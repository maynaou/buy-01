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
            System.out.println("-------------------------------------------hnaaaa");
        Auth auth = authRepository.findByUsername(event.getUsername())
                .orElseGet(() -> Auth.builder()
                        .username(event.getUsername())
                        .build());

        auth.setEmail(event.getEmail());
        auth.setRole(event.getRole());

        authRepository.save(auth);
                           
        };
    }
}
