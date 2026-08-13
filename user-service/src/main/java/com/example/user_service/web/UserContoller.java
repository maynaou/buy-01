package com.example.user_service.web;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.user_service.dto.UserDTO;
import com.example.user_service.service.UserService;

import io.swagger.v3.oas.annotations.parameters.RequestBody;

@RestController
@RequestMapping("/api/users")
public class UserContoller {
    
    UserService userService;

    public UserContoller(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserDTO> getProfile(Authentication authentication) {
        return ResponseEntity.ok(userService.getProfle(authentication.getName()));
    }

    @PutMapping("/me")
    public void updateProfile(Authentication authentication , @RequestBody UserDTO userDTO) {
         userService.updateProfile(authentication.getName(),userDTO);
    }
}
