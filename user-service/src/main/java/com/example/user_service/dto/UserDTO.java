package com.example.user_service.dto;

import com.example.user_service.enums.Role;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserDTO {
      private String name;
      private String email;
      private Role role;
}
