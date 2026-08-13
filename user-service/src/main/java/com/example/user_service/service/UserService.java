package com.example.user_service.service;

import org.springframework.stereotype.Service;

import com.example.user_service.dto.UserDTO;
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

    public UserDTO getProfle(String userId) {
        System.out.println("username : " + userId);
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        return userMapper.fromUser(user);
    }

    public UserDTO updateProfile(String userId,UserDTO userDTO) { 
          User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
          user.setName(userDTO.getName());
          user.setEmail(userDTO.getEmail());
          user.setRole(userDTO.getRole());
          userRepository.save(user);
         return userMapper.fromUser(user);
    }
}
