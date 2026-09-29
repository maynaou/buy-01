package com.example.user_service.consomer;

import java.util.function.Consumer;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.example.user_service.dto.UserConsumerAvatarDTO;
import com.example.user_service.dto.UserConsumerDTO;
import com.example.user_service.entities.User;
import com.example.user_service.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Configuration
@SuppressWarnings("null")
public class UserEventConsumer {

  private static final Logger log = LoggerFactory.getLogger(UserEventConsumer.class);


  @Bean
  public Consumer<UserConsumerDTO> userConsumer(UserRepository userRepository) {
    return event -> {

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

      switch (event.getEventType()) {
        case CREATED -> {
          User user = userRepository.findById(event.getUserId())
              .orElseThrow(() -> new RuntimeException("user not found"));
          user.setAvatar(event.getImagePath());
          userRepository.save(user);
        }

        default -> log.warn("Unknown event type: {}", event.getEventType());

      }

    };
  }
}
