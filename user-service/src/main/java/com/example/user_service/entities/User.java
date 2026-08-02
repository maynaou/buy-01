package com.example.user_service.entities;

import com.example.user_service.enums.Role;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class User {
       @Id
       private String id;
       private String name;
       private String email;
       private String password;
       @Enumerated(EnumType.STRING)
       private Role role;
       private String avatar;
}