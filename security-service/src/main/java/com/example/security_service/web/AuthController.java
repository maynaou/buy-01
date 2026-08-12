package com.example.security_service.web;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.security_service.dto.AuthResponse;
import com.example.security_service.dto.LoginRequest;
import com.example.security_service.dto.RegisterRequest;
import com.example.security_service.services.AuthService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    AuthService authService;

    public AuthController(AuthService authService) {
         this.authService = authService;
    }

    @PostMapping("/register")
    public String register(@RequestBody RegisterRequest registerRequest) {
            authService.register(registerRequest);
            return "Authentication successful!";
    }

    @PostMapping("/login") 
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest loginRequest) {
         return ResponseEntity.status(HttpStatus.OK).body(authService.login(loginRequest));
    }
    
    @PostMapping("/refresh/{id}")
    public Map<String,String> refresh(@PathVariable String id) {
          return authService.refresh(id);
    }
}
