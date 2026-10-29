package com.example.security_service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.kafka.KafkaContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import com.example.security_service.config.RsaKeysConfig;
import com.example.security_service.entities.Auth;
import com.example.security_service.enums.Role;
import com.example.security_service.repository.AuthRepository;
import com.example.security_service.repository.RefreshTokenRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest(properties = {
		"spring.cloud.discovery.enabled=false",
		"eureka.client.enabled=false",
		"spring.cloud.stream.function.autodetect=false",
		"spring.cloud.function.definition=",
		"spring.cloud.stream.bindings.authConsumer-in-0.consumer.auto-startup=false"
})
@AutoConfigureMockMvc
@Testcontainers
class SecurityServiceApplicationTests {

	@Container
	static final MongoDBContainer mongoDB = new MongoDBContainer("mongo:7.0");

	@Container
	static final KafkaContainer kafka = new KafkaContainer("apache/kafka-native:3.8.0");

	@DynamicPropertySource
	static void configureServices(DynamicPropertyRegistry registry) {
		registry.add("spring.data.mongodb.uri", () -> mongoDB.getReplicaSetUrl("security_test"));
		registry.add("spring.cloud.stream.kafka.binder.brokers", kafka::getBootstrapServers);
	}

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private AuthRepository authRepository;

	@Autowired
	private RefreshTokenRepository refreshTokenRepository;

	@Autowired
	private PasswordEncoder passwordEncoder;

	@Autowired
	private ObjectMapper objectMapper;

	@Autowired
	private RsaKeysConfig rsaKeysConfig;

	@BeforeEach
	void cleanDatabase() {
		authRepository.deleteAll();
		refreshTokenRepository.deleteAll();
	}

	@Test
	void register_shouldPersistUserAndPublishEventToKafka() throws Exception {
		mockMvc.perform(post("/api/auth/register")
				.contentType(MediaType.parseMediaType("application/json"))
				.content("""
						{
						  "username": "testuser",
						  "email": "test@example.com",
						  "password": "password123",
						  "role": "CLIENT"
						}
						"""))
				.andExpect(status().isCreated())
				.andExpect(content().string("Registration successful!"));

		Auth savedUser = authRepository.findByUsername("testuser").orElseThrow();

		assertEquals("test@example.com", savedUser.getEmail());
		assertEquals(Role.CLIENT, savedUser.getRole());
		assertNotEquals("password123", savedUser.getPassword());
		assertTrue(passwordEncoder.matches("password123", savedUser.getPassword()));

		JsonNode event = readNextAuthEvent();
		assertEquals(savedUser.getId(), event.get("id").asText());
		assertEquals("testuser", event.get("username").asText());
		assertEquals("test@example.com", event.get("email").asText());
		assertEquals("CLIENT", event.get("role").asText());
	}

	@Test
	@SuppressWarnings("null")
	void login_shouldAuthenticateUserAndPersistRefreshToken() throws Exception {
		Auth user = authRepository.save(Auth.builder()
				.username("loginuser")
				.email("login@example.com")
				.password(passwordEncoder.encode("password123"))
				.role(Role.CLIENT)
				.build());

		String responseBody = mockMvc.perform(post("/api/auth/login")
				.contentType(MediaType.parseMediaType("application/json"))
				.content("""
						{
						  "identifier": "loginuser",
						  "password": "password123"
						}
						"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.accessToken").isNotEmpty())
				.andExpect(jsonPath("$.refreshToken").isNotEmpty())
				.andReturn()
				.getResponse()
				.getContentAsString();

		JsonNode response = objectMapper.readTree(responseBody);
		String accessToken = response.get("accessToken").asText();
		String refreshToken = response.get("refreshToken").asText();

		Jwt decodedAccessToken = NimbusJwtDecoder.withPublicKey(rsaKeysConfig.publicKey())
				.build()
				.decode(accessToken);

		assertEquals(user.getId(), decodedAccessToken.getSubject());
		assertEquals("ROLE_CLIENT", decodedAccessToken.getClaimAsString("scope"));

		var savedRefreshToken = refreshTokenRepository.findByToken(refreshToken).orElseThrow();
		assertEquals(user.getId(), savedRefreshToken.getUserId());
		assertNotNull(savedRefreshToken.getExpiryDate());
	}

	private JsonNode readNextAuthEvent() throws Exception {
		Properties consumerProperties = new Properties();
		consumerProperties.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, kafka.getBootstrapServers());
		consumerProperties.put(ConsumerConfig.GROUP_ID_CONFIG, "security-service-test-" + UUID.randomUUID());
		consumerProperties.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
		consumerProperties.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
		consumerProperties.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");

		try (KafkaConsumer<String, String> consumer = new KafkaConsumer<>(consumerProperties)) {
			consumer.subscribe(List.of("authTopic"));

			Instant deadline = Instant.now().plusSeconds(10);
			while (Instant.now().isBefore(deadline)) {
				var records = consumer.poll(Duration.ofMillis(250));
				if (!records.isEmpty()) {
					return objectMapper.readTree(records.iterator().next().value());
				}
			}
		}

		throw new AssertionError("No user-created event received from Kafka topic authTopic within 10 seconds");
	}
}
