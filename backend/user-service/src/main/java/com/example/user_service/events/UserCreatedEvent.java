package com.example.user_service.events;

import com.example.user_service.enums.Role;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserCreatedEvent {
    private String username;
    private String email;
    private Role role;
}
