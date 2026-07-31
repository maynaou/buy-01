package com.example.user_service;

import java.util.UUID;
import java.util.stream.Stream;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import com.example.user_service.entities.User;
import com.example.user_service.enums.Role;
import com.example.user_service.repository.UserRepository;

@SpringBootApplication
public class UserServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(UserServiceApplication.class, args);
	}

    @Bean
	CommandLineRunner commandLineRunner(UserRepository userRepository) {
		return args -> {
               Stream.of("maynaou","achraf","yahya", "hafid").forEach(name -> {
				        User user = User.builder()
						           .id(UUID.randomUUID().toString())
					               .name(name)
								   .email(name+"123@gmail.com")
								   .password("123456")
								   .role(Role.CLIENT)
								   .avatar(name)
					               .build();
					    userRepository.save(user);
			   });
		};
	}
}
