package com.example.media_service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.UUID;

import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.kafka.KafkaContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import com.cloudinary.Cloudinary;
import com.cloudinary.Uploader;
import com.example.media_service.entities.Media;
import com.example.media_service.entities.ProductReference;
import com.example.media_service.enums.EventType;
import com.example.media_service.enums.MediaType;
import com.example.media_service.repository.MediaRepository;
import com.example.media_service.repository.ProductReferenceRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest(properties = {
		"spring.cloud.discovery.enabled=false",
		"eureka.client.enabled=false",
		"CLOUDINARY_URL=cloudinary://test:test@test",
		"spring.cloud.stream.function.autodetect=false",
		"spring.cloud.function.definition=",
		"spring.cloud.stream.bindings.mediaConsumer-in-0.consumer.auto-startup=false"
})
@AutoConfigureMockMvc
@Testcontainers
@SuppressWarnings("null")
class MediaServiceApplicationTests {

	@Container
	static final MongoDBContainer mongoDB = new MongoDBContainer("mongo:7.0");

	@Container
	static final KafkaContainer kafka = new KafkaContainer("apache/kafka-native:3.8.0");

	@DynamicPropertySource
	static void configureServices(DynamicPropertyRegistry registry) {
		registry.add("spring.data.mongodb.uri", () -> mongoDB.getReplicaSetUrl("media_test"));
		registry.add("spring.cloud.stream.kafka.binder.brokers", kafka::getBootstrapServers);
	}

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private MediaRepository mediaRepository;

	@Autowired
	private ProductReferenceRepository productReferenceRepository;

	@Autowired
	private ObjectMapper objectMapper;

	@MockBean
	private Cloudinary cloudinary;

	private Uploader uploader;

	@BeforeEach
	void setUp() throws Exception {
		mediaRepository.deleteAll();
		productReferenceRepository.deleteAll();

		reset(cloudinary);
		uploader = Mockito.mock(Uploader.class);
		when(cloudinary.uploader()).thenReturn(uploader);
		when(uploader.upload(any(byte[].class), any(Map.class)))
				.thenReturn(Map.of("secure_url", "https://res.cloudinary.com/test/media/product-photo.jpg"));
	}

	@Test
	void uploadProductImage_shouldPersistMediaAndPublishEvent() throws Exception {
		productReferenceRepository.save(ProductReference.builder()
				.productId("product-123")
				.userId("seller-123")
				.build());

		MockMultipartFile image = new MockMultipartFile(
				"imgUrl", "product-photo.jpg", org.springframework.http.MediaType.IMAGE_JPEG_VALUE,
				"test-image".getBytes());

		mockMvc.perform(multipart("/api/media/image")
				.file(image)
				.param("productId", "product-123")
				.header("X-User-Id", "seller-123")
				.header("X-User-Role", "ROLE_SELLER"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$[0].imagePath")
						.value("https://res.cloudinary.com/test/media/product-photo.jpg"))
				.andExpect(jsonPath("$[0].entityId").value("product-123"))
				.andExpect(jsonPath("$[0].mediaType").value("PRODUCT"));

		Media savedMedia = mediaRepository.findAllByEntityIdAndMediaType(
				"product-123", MediaType.PRODUCT).orElseThrow().get(0);
		assertEquals("https://res.cloudinary.com/test/media/product-photo.jpg", savedMedia.getImagePath());

		JsonNode event = readNextMediaEvent("product-123");
		assertEquals(EventType.CREATED.name(), event.get("eventType").asText());
		assertEquals("product-123", event.get("entityId").asText());
		assertEquals(savedMedia.getImagePath(), event.get("imagePath").asText());
		assertEquals(MediaType.PRODUCT.name(), event.get("mediaType").asText());
	}

	@Test
	void uploadProductImage_shouldRejectAnotherSellersProduct() throws Exception {
		productReferenceRepository.save(ProductReference.builder()
				.productId("product-123")
				.userId("seller-123")
				.build());

		MockMultipartFile image = new MockMultipartFile(
				"imgUrl", "product-photo.jpg", org.springframework.http.MediaType.IMAGE_JPEG_VALUE,
				"test-image".getBytes());

		mockMvc.perform(multipart("/api/media/image")
				.file(image)
				.param("productId", "product-123")
				.header("X-User-Id", "another-seller")
				.header("X-User-Role", "ROLE_SELLER"))
				.andExpect(status().isForbidden());

		assertEquals(0, mediaRepository.count());
		verify(uploader, never()).upload(any(byte[].class), any(Map.class));
	}

	@Test
	void uploadAvatar_shouldPersistMediaAndPublishEvent() throws Exception {
		MockMultipartFile image = new MockMultipartFile(
				"imgUrl", "avatar.jpg", org.springframework.http.MediaType.IMAGE_JPEG_VALUE,
				"test-avatar".getBytes());

		mockMvc.perform(multipart("/api/media/avatar/{userId}", "seller-123")
				.file(image)
				.header("X-User-Id", "seller-123")
				.header("X-User-Role", "ROLE_SELLER"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.imagePath")
						.value("https://res.cloudinary.com/test/media/product-photo.jpg"))
				.andExpect(jsonPath("$.entityId").value("seller-123"))
				.andExpect(jsonPath("$.mediaType").value("AVATAR"));

		Media savedMedia = mediaRepository.findByEntityIdAndMediaType("seller-123", MediaType.AVATAR)
				.orElseThrow();
		assertEquals("https://res.cloudinary.com/test/media/product-photo.jpg", savedMedia.getImagePath());

		JsonNode event = readNextMediaEvent("seller-123");
		assertEquals(EventType.CREATED.name(), event.get("eventType").asText());
		assertEquals("seller-123", event.get("entityId").asText());
		assertEquals(MediaType.AVATAR.name(), event.get("mediaType").asText());
	}

	private JsonNode readNextMediaEvent(String entityId) throws Exception {
		Properties consumerProperties = new Properties();
		consumerProperties.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, kafka.getBootstrapServers());
		consumerProperties.put(ConsumerConfig.GROUP_ID_CONFIG, "media-service-test-" + UUID.randomUUID());
		consumerProperties.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
		consumerProperties.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
		consumerProperties.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");

		try (KafkaConsumer<String, String> consumer = new KafkaConsumer<>(consumerProperties)) {
			consumer.subscribe(List.of("mediaTopic"));

			Instant deadline = Instant.now().plusSeconds(10);
			while (Instant.now().isBefore(deadline)) {
				var records = consumer.poll(Duration.ofMillis(250));
				for (var record : records) {
					JsonNode event = objectMapper.readTree(record.value());
					if (entityId.equals(event.path("entityId").asText())) {
						return event;
					}
				}
			}
		}

		throw new AssertionError(
				"No media event received for entity " + entityId + " from Kafka topic mediaTopic within 10 seconds");
	}
}
