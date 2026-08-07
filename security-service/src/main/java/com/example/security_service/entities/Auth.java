package com.example.security_service.entities;

import com.example.security_service.enums.Role;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Auth {
     @Id
     private String id;
     private String username;
     private String email;
     private String password;
     @Enumerated(EnumType.STRING)
     private Role role;
     // private String avatar;
}
