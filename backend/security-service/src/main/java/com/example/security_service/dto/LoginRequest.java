package com.example.security_service.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank(message = "Username or Email is required")
    private String identifier;
    @NotBlank(message = "Password is required")
    private String password;
}
