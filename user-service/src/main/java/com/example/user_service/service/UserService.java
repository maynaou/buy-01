package com.example.user_service.service;

import org.springframework.stereotype.Service;

import com.example.user_service.dto.UserResponseDTO;
import com.example.user_service.entities.User;
import com.example.user_service.mappers.UserMapper;
import com.example.user_service.repository.UserRepository;

@Service
public class UserService {
       
    UserRepository userRepository;

    UserMapper userMapper;

    public UserService(UserRepository userRepository, UserMapper userMapper) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
    }

    public UserResponseDTO getProfle(String username) {
        System.out.println("username : " + username);
        User user = userRepository.findByName(username).orElseThrow(() -> new RuntimeException("User not found"));
        return userMapper.fromUser(user);
    }

    // public UserResponseDTO updateProfile() {

    // }
}
