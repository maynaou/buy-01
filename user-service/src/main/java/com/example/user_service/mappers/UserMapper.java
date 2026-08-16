package com.example.user_service.mappers;

import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Component;

import com.example.user_service.dto.UserDTO;
import com.example.user_service.entities.User;

@Component
@SuppressWarnings("null")
public class UserMapper {
    public UserDTO fromUser( User user) {
        UserDTO userResponseDTO = new UserDTO();
            BeanUtils.copyProperties(user, userResponseDTO);
        return userResponseDTO;
    }
}
