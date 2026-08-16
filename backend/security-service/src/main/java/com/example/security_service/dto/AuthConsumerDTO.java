package com.example.security_service.dto;

import com.example.security_service.enums.Role;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthConsumerDTO {
    private String username;
    private String email;
    private Role role;
}
