package com.example.user_service.web;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.user_service.dto.UserResponseDTO;
import com.example.user_service.service.UserService;

@RestController
@RequestMapping("/api/users")
public class UserContoller {
    
    UserService userService;

    public UserContoller(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponseDTO> getProfile(Authentication authentication) {
        return ResponseEntity.ok(userService.getProfle(authentication.getName()));
    }
}
