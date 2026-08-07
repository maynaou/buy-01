package com.example.security_service.dto;

import lombok.Data;

@Data
public class LoginRequest {
    private String identifier;
    private String password;
}
