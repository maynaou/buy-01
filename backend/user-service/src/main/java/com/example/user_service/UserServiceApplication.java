package com.example.user_service;


import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import com.example.user_service.repository.UserRepository;

@SpringBootApplication
public class UserServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(UserServiceApplication.class, args);
	}

    // @Bean
	CommandLineRunner commandLineRunner(UserRepository userRepository) {
		return args -> {
		};
	}
}


//11111111111111111111111111111111111111111111111111111111111222222222222222233333333333333333