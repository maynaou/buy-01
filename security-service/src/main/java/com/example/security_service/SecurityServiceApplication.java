package com.example.security_service;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.example.security_service.config.RsaKeysConfig;
import com.example.security_service.entities.Auth;
import com.example.security_service.enums.Role;
import com.example.security_service.repository.AuthRepository;

@SpringBootApplication
@EnableConfigurationProperties(RsaKeysConfig.class)
public class SecurityServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(SecurityServiceApplication.class, args);
	}

	// @Bean
	CommandLineRunner run(AuthRepository AuthRepository) {
		return args -> {
			System.out.println("Saving users to the database...");
			AuthRepository.save(new Auth("1", "user1","user1@gmail.com", "1234",Role.CLIENT));
			AuthRepository.save(new Auth("2", "user2","user2@gmail.com", "1234",Role.CLIENT));
		};
	}

	@Bean
	PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

}
