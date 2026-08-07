package com.example.security_service.events;

import com.example.security_service.enums.Role;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserCreatedEvent {
     private String id;
     private String username;
     private String email;
     private Role role;
}
