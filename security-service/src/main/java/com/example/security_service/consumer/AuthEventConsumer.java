package com.example.security_service.consumer;

import java.util.function.Consumer;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.example.security_service.dto.AuthConsumerDTO;
import com.example.security_service.entities.Auth;
import com.example.security_service.repository.AuthRepository;

@Configuration
public class AuthEventConsumer {
    
    @Bean 
    public Consumer<AuthConsumerDTO> authConsumer(AuthRepository authRepository) {
        return event -> {
               Auth auth = Auth.builder()
                                .username(event.getUsername())
                                .email(event.getEmail())
                                .role(event.getRole())
                                .build();
                authRepository.save(auth);
                           
        };
    }
}
