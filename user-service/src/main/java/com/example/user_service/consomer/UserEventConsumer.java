package com.example.user_service.consomer;

import java.util.function.Consumer;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.example.user_service.dto.UserConsumerDTO;
import com.example.user_service.entities.User;
import com.example.user_service.repository.UserRepository;

@Configuration
public class UserEventConsumer {
     
      @Bean 
      public Consumer<UserConsumerDTO> userConsumer(UserRepository userRepository) {
        return event -> {
          switch (event.getEventType()) {
            
            case USER -> {
                      User users = User.builder()
                            .id(event.getId())
                            .username(event.getUsername())
                            .email(event.getEmail())
                            .role(event.getRole())
                            .avatar("")
                            .build();
                         userRepository.save(users);
                       break;
            }

            case AVATAR -> {
                     User users = userRepository.findById(event.getId()).orElseThrow(()-> new RuntimeException("user not found"));
                     users.setAvatar(event.getAvatar());
                     userRepository.save(users);
            }


            default -> {
                    break;
            }
             
          }

        };
      }
}
