package com.example.user_service.service;

import org.springframework.cloud.stream.function.StreamBridge;
import org.springframework.stereotype.Service;

import com.example.user_service.dto.UserDTO;
import com.example.user_service.entities.User;
import com.example.user_service.events.UserCreatedEvent;
import com.example.user_service.exception.UserNotFoundException;
import com.example.user_service.mappers.UserMapper;
import com.example.user_service.repository.UserRepository;

@Service
@SuppressWarnings("null")
public class UserService {
       
    UserRepository userRepository;
    UserMapper userMapper;
    StreamBridge streamBridge;

    public UserService(UserRepository userRepository, UserMapper userMapper,StreamBridge streamBridge) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.streamBridge = streamBridge;
    }

    public UserDTO getProfle(String userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new UserNotFoundException("User not found"));
        return userMapper.fromUser(user);
    }

    public UserDTO updateProfile(String userId,UserDTO userDTO) { 
        System.out.println("role : " + userDTO.getRole());
          User user = userRepository.findById(userId).orElseThrow(() -> new UserNotFoundException("User not found"));
          user.setUsername(userDTO.getUsername());
          user.setEmail(userDTO.getEmail());
          user.setRole(userDTO.getRole());
          userRepository.save(user);

          streamBridge.send("userProducer-out-0", new UserCreatedEvent(user.getUsername(),user.getEmail(),user.getRole()));

         return userMapper.fromUser(user);
    }
}
