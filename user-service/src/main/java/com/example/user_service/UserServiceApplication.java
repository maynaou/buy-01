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
            //    Stream.of("maynaou","achraf","yahya", "hafid").forEach(name -> {
			// 	        User user = User.builder()
			// 			           .id(UUID.randomUUID().toString())
			// 		               .username(name)
			// 					   .email(name+"123@gmail.com")
			// 					   .role(Role.CLIENT)
			// 					//    .avatar(name)
			// 		               .build();
			// 		    userRepository.save(user);
			// 			// streamBridge.send("userProducer-out-0", new UserCreatedEvent(user.getId(), user.getName(), user.getRole())	
			// 			// );
			//    });
		};
	}
}
