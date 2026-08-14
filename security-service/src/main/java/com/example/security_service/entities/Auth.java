package com.example.security_service.entities;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import com.example.security_service.enums.Role;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Auth {
     @Id
     private String id;
     @Indexed(unique = true)
     private String username;
     @Indexed(unique = true)
     private String email;
     private String password;
     private Role role;
}
