package com.example.user_service.web;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.user_service.dto.RegisterRequest;
import com.example.user_service.service.AuthService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

      AuthService authService;

      public AuthController(AuthService authService) {
          this.authService = authService;
      }
         
      @GetMapping("/login")
      public ResponseEntity<?> login() {
          authService.login();
          return ResponseEntity.ok().body("Login endpoint called");
      }

      @PostMapping("/register")
      public ResponseEntity<String> register(@RequestBody RegisterRequest registerRequest) {
           authService.register(registerRequest);
          return ResponseEntity.status(201).body("Register endpoint called");
      }
}
