package com.example.user_service.consomer;

import java.util.function.Consumer;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.example.user_service.dto.UserDTO;
import com.example.user_service.entities.User;
import com.example.user_service.repository.UserRepository;

@Configuration
public class UserEventConsumer {
     
      @Bean 
      public Consumer<UserDTO> userConsumer(UserRepository userRepository) {
        return user -> {
            User users = User.builder()
                            .id(user.getId())
                            .name(user.getUsername())
                            .email(user.getEmail())
                            .role(user.getRole())
                            .build();
            userRepository.save(users);
        };
      }
}
