package com.example.user_service.events;

import com.example.user_service.enums.Role;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class UserCreatedEvent {
       private String userId;
       private String name;
       private Role role;
}
