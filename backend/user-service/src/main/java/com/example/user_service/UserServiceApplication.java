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


//djfsfhjdhkjfhjkdhsqkjfhjkdhfjkhjkdsqlkjfsqldhfjkdhsqkfjdshqjkfhdjksqhfkjhdjkqhsfjkhdkjhfkjs