package com.example.user_service.service;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.example.user_service.dto.RegisterRequest;
import com.example.user_service.entities.User;
import com.example.user_service.enums.Role;
import com.example.user_service.repository.UserRepository;

@Service
public class AuthService {
    

    UserRepository userRepository;

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public void login() {
        System.out.println("Login endpoint called");
    }

    public void register(RegisterRequest registerRequest) {
        User user = User.builder()
                .id(UUID.randomUUID().toString())
                .name(registerRequest.name())
                .email(registerRequest.email())
                .password(registerRequest.password())
                .role(Role.valueOf(registerRequest.role()))
                .build();
        userRepository.save(user);
    }
}


