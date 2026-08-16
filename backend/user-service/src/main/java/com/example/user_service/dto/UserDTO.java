package com.example.user_service.dto;

import com.example.user_service.enums.Role;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserDTO {
      @NotBlank(message = "Username is required")
      @Size(min = 3, max = 20, message = "Username must be between 3 and 20 characters")
      @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "Username must contain only letters, numbers, and underscore")  
      private String username;
      @NotBlank(message = "Email is required")
      @Email(message = "Email is not valid")
      private String email;
      @NotNull(message = "role is required")
      private Role role;
}
