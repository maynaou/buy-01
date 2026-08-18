package com.example.user_service.consomer;

import java.util.function.Consumer;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.example.user_service.dto.UserConsumerAvatarDTO;
import com.example.user_service.dto.UserConsumerDTO;
import com.example.user_service.entities.User;
import com.example.user_service.repository.UserRepository;

@Configuration
@SuppressWarnings("null")
public class UserEventConsumer {

  @Bean
  public Consumer<UserConsumerDTO> userConsumer(UserRepository userRepository) {
    return event -> {

      System.out.println("----------------------------------------------");
      User users = User.builder()
          .id(event.getId())
          .username(event.getUsername())
          .email(event.getEmail())
          .role(event.getRole())
          .avatar("")
          .build();
      userRepository.save(users);

    };
  }

  @Bean
  public Consumer<UserConsumerAvatarDTO> userConsumerAvatar(UserRepository userRepository) {
    return event -> {
      if (!"AVATAR".equals(event.getMediaType())) {
        return;
      }
      System.out.println("----------------------------------------------"+ event.getUserId() + event.getImagePath());
      switch (event.getEventType()) {
        case CREATED -> {
          User user = userRepository.findById(event.getUserId())
              .orElseThrow(() -> new RuntimeException("user not found"));
          user.setAvatar(event.getImagePath());
          userRepository.save(user);
          break;
        }

        case DELETED -> {
            User user = userRepository.findById(event.getUserId())
              .orElseThrow(() -> new RuntimeException("user not found"));
            user.setAvatar(null);
            userRepository.save(user);
        }

        default -> {

          System.out.println(
              "Unknown event type: " + event.getEventType());
          break;
        }

      }

    };
  }
}
