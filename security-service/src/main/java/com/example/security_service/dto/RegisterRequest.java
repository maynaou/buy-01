package com.example.security_service.dto;

import com.example.security_service.enums.Role;
import lombok.Data;

@Data
public class RegisterRequest {
     private String username;
     private String email;
     private String password;
     private Role role;
}
