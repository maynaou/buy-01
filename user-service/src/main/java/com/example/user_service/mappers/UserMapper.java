package com.example.user_service.mappers;

import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Component;

import com.example.user_service.dto.UserResponseDTO;
import com.example.user_service.entities.User;

@Component
public class UserMapper {
    public UserResponseDTO fromUser(User user) {
        UserResponseDTO userResponseDTO = new UserResponseDTO();
        BeanUtils.copyProperties(user, userResponseDTO);
        return userResponseDTO;
    }
}
