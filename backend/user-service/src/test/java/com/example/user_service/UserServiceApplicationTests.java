package com.example.user_service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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

import com.example.user_service.entities.User;
import com.example.user_service.enums.Role;
import com.example.user_service.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest(properties = {
		"spring.cloud.discovery.enabled=false",
		"eureka.client.enabled=false"
})
@AutoConfigureMockMvc
@Testcontainers
@SuppressWarnings("null")
class UserServiceApplicationTests {

	@Container
	static final MongoDBContainer mongoDB = new MongoDBContainer("mongo:7.0");

	@Container
	static final KafkaContainer kafka = new KafkaContainer("apache/kafka-native:3.8.0");

	@DynamicPropertySource
	static void configureServices(DynamicPropertyRegistry registry) {
		registry.add("spring.data.mongodb.uri", () -> mongoDB.getReplicaSetUrl("user_test"));
		registry.add("spring.cloud.stream.kafka.binder.brokers", kafka::getBootstrapServers);
	}

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private ObjectMapper objectMapper;

	@BeforeEach
	void cleanDatabase() {
		userRepository.deleteAll();
	}

	@Test
	void getProfile_shouldReturnPersistedUser() throws Exception {
		userRepository.save(User.builder()
				.id("user-123")
				.username("testuser")
				.email("test@example.com")
				.role(Role.CLIENT)
				.avatar("avatar.png")
				.build());

		mockMvc.perform(get("/api/users/me")
				.header("X-User-Id", "user-123")
				.header("X-User-Role", "ROLE_CLIENT"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.username").value("testuser"))
				.andExpect(jsonPath("$.email").value("test@example.com"))
				.andExpect(jsonPath("$.role").value("CLIENT"))
				.andExpect(jsonPath("$.avatar").value("avatar.png"));
	}

	@Test
	void updateProfile_shouldPersistChangesAndPublishEvent() throws Exception {
		userRepository.save(User.builder()
				.id("user-456")
				.username("oldname")
				.email("old@example.com")
				.role(Role.CLIENT)
				.avatar("avatar.png")
				.build());

		mockMvc.perform(put("/api/users/me")
				.header("X-User-Id", "user-456")
				.header("X-User-Role", "ROLE_CLIENT")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "username": "newname",
						  "email": "new@example.com",
						  "role": "SELLER"
						}
						"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.username").value("newname"))
				.andExpect(jsonPath("$.email").value("new@example.com"))
				.andExpect(jsonPath("$.role").value("SELLER"))
				.andExpect(jsonPath("$.avatar").value("avatar.png"));

		User updatedUser = userRepository.findById("user-456").orElseThrow();
		assertEquals("newname", updatedUser.getUsername());
		assertEquals("new@example.com", updatedUser.getEmail());
		assertEquals(Role.SELLER, updatedUser.getRole());
		assertEquals("avatar.png", updatedUser.getAvatar());

		JsonNode event = readNextUserEvent();
		assertEquals("newname", event.get("username").asText());
		assertEquals("new@example.com", event.get("email").asText());
		assertEquals("SELLER", event.get("role").asText());
	}

	private JsonNode readNextUserEvent() throws Exception {
		Properties consumerProperties = new Properties();
		consumerProperties.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, kafka.getBootstrapServers());
		consumerProperties.put(ConsumerConfig.GROUP_ID_CONFIG, "user-service-test-" + UUID.randomUUID());
		consumerProperties.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
		consumerProperties.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
		consumerProperties.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");

		try (KafkaConsumer<String, String> consumer = new KafkaConsumer<>(consumerProperties)) {
			consumer.subscribe(List.of("userTopic"));

			Instant deadline = Instant.now().plusSeconds(10);
			while (Instant.now().isBefore(deadline)) {
				var records = consumer.poll(Duration.ofMillis(250));
				if (!records.isEmpty()) {
					return objectMapper.readTree(records.iterator().next().value());
				}
			}
		}

		throw new AssertionError("No user-updated event received from Kafka topic userTopic within 10 seconds");
	}
}
