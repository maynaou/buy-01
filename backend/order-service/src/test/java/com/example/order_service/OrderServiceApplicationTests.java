package com.example.order_service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import com.example.order_service.dto.ProductResponse;
import com.example.order_service.entities.Cart;
import com.example.order_service.entities.CartItem;
import com.example.order_service.entities.Order;
import com.example.order_service.feign.ProductRestClient;
import com.example.order_service.repository.CartRepository;
import com.example.order_service.repository.OrderRepository;

@SpringBootTest(properties = {
		"spring.cloud.discovery.enabled=false",
		"eureka.client.enabled=false",
		"spring.cloud.function.definition=",
		"spring.cloud.stream.function.autodetect=false",
		"spring.cloud.stream.bindings.orderConsumer-in-0.consumer.auto-startup=false"
})
@AutoConfigureMockMvc
@Testcontainers
@SuppressWarnings("null")
class OrderServiceApplicationTests {

	@Container
	static final MongoDBContainer mongoDB = new MongoDBContainer("mongo:7.0");

	@DynamicPropertySource
	static void configureMongo(DynamicPropertyRegistry registry) {
		registry.add("spring.data.mongodb.uri", mongoDB::getReplicaSetUrl);
	}

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private CartRepository cartRepository;

	@Autowired
	private OrderRepository orderRepository;

	@MockBean
	private ProductRestClient productRestClient;

	@BeforeEach
	void setUp() {
		orderRepository.deleteAll();
		cartRepository.deleteAll();
		reset(productRestClient);
	}

	@Test
	void addCartItem_shouldPersistCartForAuthenticatedClient() throws Exception {
		when(productRestClient.getProductById("product-123"))
				.thenReturn(Optional.of(product()));

		mockMvc.perform(post("/api/orders/cart")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"productId":"product-123","quantity":2}
						""")
				.header("X-User-Id", "client-123")
				.header("X-User-Role", "ROLE_CLIENT"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.userId").value("client-123"))
				.andExpect(jsonPath("$.items[0].productId").value("product-123"))
				.andExpect(jsonPath("$.items[0].quantity").value(2))
				.andExpect(jsonPath("$.subtotalPrice").value(25.0));

		Cart savedCart = cartRepository.findByUserId("client-123").orElseThrow();
		assertEquals(1, savedCart.getItems().size());
		assertEquals("product-123", savedCart.getItems().get(0).getProductId());
	}

	@Test
	void checkout_shouldCreateOrderDecreaseStockAndClearCart() throws Exception {
		cartRepository.save(Cart.builder()
				.id("cart-123")
				.userId("client-123")
				.items(new ArrayList<>(List.of(
						CartItem.builder().productId("product-123").quantity(2).build())))
				.build());
		when(productRestClient.getProductById("product-123"))
				.thenReturn(Optional.of(product()));

		mockMvc.perform(post("/api/orders/checkout")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"fullName":"Client Name","address":"123 Main Street","phone":"555-0100"}
						""")
				.header("X-User-Id", "client-123")
				.header("X-User-Role", "ROLE_CLIENT"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$[0].buyerId").value("client-123"))
				.andExpect(jsonPath("$[0].sellerId").value("seller-123"))
				.andExpect(jsonPath("$[0].total").value(25.0))
				.andExpect(jsonPath("$[0].items[0].quantity").value(2));
		Order savedOrder = orderRepository.findAll().get(0);
		assertEquals("client-123", savedOrder.getBuyerId());
		assertEquals("seller-123", savedOrder.getSellerId());
		assertEquals(25.0, savedOrder.getTotal());
		assertTrue(cartRepository.findByUserId("client-123").orElseThrow().getItems().isEmpty());
		verify(productRestClient).decreaseStock("product-123", 2);
	}

	@Test
	void addCartItem_shouldRejectNonClientRole() throws Exception {
		mockMvc.perform(post("/api/orders/cart")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"productId":"product-123","quantity":2}
						""")
				.header("X-User-Id", "seller-123")
				.header("X-User-Role", "ROLE_SELLER"))
				.andExpect(status().isForbidden());

		assertTrue(cartRepository.findAll().isEmpty());
	}

	private ProductResponse product() {
		return new ProductResponse(
				"product-123",
				"Test product",
				"Integration test product",
				12.5,
				10,
				"seller-123",
				List.of("https://example.test/product.jpg"),
				"TEST");
	}
}
