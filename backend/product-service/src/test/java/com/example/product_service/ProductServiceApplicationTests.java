package com.example.product_service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Properties;
import java.util.UUID;

import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.kafka.KafkaContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import com.example.product_service.entities.Product;
import com.example.product_service.enums.EventType;
import com.example.product_service.enums.ProductCategory;
import com.example.product_service.repository.ProductRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest(properties = {
		"spring.cloud.discovery.enabled=false",
		"eureka.client.enabled=false"
})
@AutoConfigureMockMvc
@Testcontainers
@SuppressWarnings("null")
class ProductServiceApplicationTests {

	@Container
	static final MongoDBContainer mongoDB = new MongoDBContainer("mongo:7.0");

	@Container
	static final KafkaContainer kafka = new KafkaContainer("apache/kafka-native:3.8.0");

	@DynamicPropertySource
	static void configureServices(DynamicPropertyRegistry registry) {
		registry.add("spring.data.mongodb.uri", () -> mongoDB.getReplicaSetUrl("product_test"));
		registry.add("spring.cloud.stream.kafka.binder.brokers", kafka::getBootstrapServers);
	}

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ProductRepository productRepository;

	@Autowired
	private ObjectMapper objectMapper;

	@BeforeEach
	void cleanDatabase() {
		productRepository.deleteAll();
	}

	@Test
	void createProduct_shouldPersistProductAndPublishEvent() throws Exception {
		String responseBody = mockMvc.perform(post("/api/products/product")
				.header("X-User-Id", "seller-123")
				.header("X-User-Role", "ROLE_SELLER")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "name": "Football",
						  "description": "Professional match football",
						  "price": 29.99,
						  "quantity": 12,
						  "category": "BALLS"
						}
						"""))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").isNotEmpty())
				.andExpect(jsonPath("$.name").value("Football"))
				.andExpect(jsonPath("$.userId").value("seller-123"))
				.andReturn()
				.getResponse()
				.getContentAsString();

		JsonNode response = objectMapper.readTree(responseBody);
		String productId = response.get("id").asText();
		Product savedProduct = productRepository.findById(productId).orElseThrow();
		assertEquals("Football", savedProduct.getName());
		assertEquals(12, savedProduct.getQuantity());
		assertEquals(ProductCategory.BALLS, savedProduct.getCategory());
		assertEquals("seller-123", savedProduct.getUserId());

		JsonNode event = readNextProductEvent();
		assertEquals(EventType.CREATED.name(), event.get("eventType").asText());
		assertEquals(productId, event.get("productId").asText());
		assertEquals("seller-123", event.get("userId").asText());
	}

	@Test
	void searchProducts_shouldReturnMatchingPersistedProducts() throws Exception {
		productRepository.save(Product.builder()
				.id("ball-1")
				.name("Football")
				.description("Professional match ball")
				.price(29.99)
				.quantity(12)
				.category(ProductCategory.BALLS)
				.userId("seller-123")
				.build());
		productRepository.save(Product.builder()
				.id("shoe-1")
				.name("Football boots")
				.description("Lightweight training boots")
				.price(89.99)
				.quantity(4)
				.category(ProductCategory.FOOTWEAR)
				.userId("seller-456")
				.build());

		mockMvc.perform(get("/api/products/search")
				.param("keyword", "professional")
				.param("category", "BALLS")
				.param("minPrice", "20")
				.param("maxPrice", "40"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.content.length()").value(1))
				.andExpect(jsonPath("$.content[0].id").value("ball-1"))
				.andExpect(jsonPath("$.content[0].name").value("Football"))
				.andExpect(jsonPath("$.totalElements").value(1));
	}

	@Test
	void stockEndpoints_shouldUpdateStockAndRejectInsufficientQuantity() throws Exception {
		productRepository.save(Product.builder()
				.id("stock-product")
				.name("Football")
				.description("Professional match football")
				.price(29.99)
				.quantity(5)
				.category(ProductCategory.BALLS)
				.userId("seller-123")
				.build());

		mockMvc.perform(post("/api/products/stock-product/stock/decrease")
				.header("X-User-Id", "client-123")
				.header("X-User-Role", "ROLE_CLIENT")
				.param("quantity", "3"))
				.andExpect(status().isOk());
		assertEquals(2, productRepository.findById("stock-product").orElseThrow().getQuantity());

		mockMvc.perform(post("/api/products/stock-product/stock/decrease")
				.header("X-User-Id", "client-123")
				.header("X-User-Role", "ROLE_CLIENT")
				.param("quantity", "3"))
				.andExpect(status().isConflict());
		assertEquals(2, productRepository.findById("stock-product").orElseThrow().getQuantity());

		mockMvc.perform(post("/api/products/stock-product/stock/increase")
				.header("X-User-Id", "client-123")
				.header("X-User-Role", "ROLE_CLIENT")
				.param("quantity", "4"))
				.andExpect(status().isOk());
		assertEquals(6, productRepository.findById("stock-product").orElseThrow().getQuantity());
	}

	private JsonNode readNextProductEvent() throws Exception {
		Properties consumerProperties = new Properties();
		consumerProperties.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, kafka.getBootstrapServers());
		consumerProperties.put(ConsumerConfig.GROUP_ID_CONFIG, "product-service-test-" + UUID.randomUUID());
		consumerProperties.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
		consumerProperties.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
		consumerProperties.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");

		try (KafkaConsumer<String, String> consumer = new KafkaConsumer<>(consumerProperties)) {
			consumer.subscribe(List.of("productTopic"));

			Instant deadline = Instant.now().plusSeconds(10);
			while (Instant.now().isBefore(deadline)) {
				var records = consumer.poll(Duration.ofMillis(250));
				if (!records.isEmpty()) {
					return objectMapper.readTree(records.iterator().next().value());
				}
			}
		}

		throw new AssertionError("No product event received from Kafka topic productTopic within 10 seconds");
	}

}
