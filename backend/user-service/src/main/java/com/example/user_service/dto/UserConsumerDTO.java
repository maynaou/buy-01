package com.example.user_service.dto;

import com.example.user_service.enums.Role;

import lombok.Data;


@Data
public class UserConsumerDTO {
      private String id;
      private String username;
      private String email;
      private Role role;
}
