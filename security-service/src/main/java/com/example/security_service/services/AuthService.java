package com.example.security_service.services;


import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.security_service.dto.LoginRequest;
import com.example.security_service.dto.RegisterRequest;
import com.example.security_service.entities.Auth;
import com.example.security_service.entities.RefreshToken;
import com.example.security_service.repository.AuthRepository;

@Service
public class AuthService {

    AuthRepository authRepository;
    PasswordEncoder passwordEncoder;
    AuthenticationManager authenticationManager;

    TokenService tokenService;

    public AuthService(AuthRepository authRepository, PasswordEncoder passwordEncoder,AuthenticationManager authenticationManager, TokenService tokenService) {
        this.authRepository = authRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.tokenService = tokenService;
    }

    public void register(RegisterRequest registerRequest) {
        Auth authRegister = Auth.builder()
                .id(UUID.randomUUID().toString())
                .username(registerRequest.getUsername())
                .email(registerRequest.getEmail())
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .role(registerRequest.getRole())
                .build();

        authRepository.save(authRegister);
    }

    public Map<String,String> login(LoginRequest loginRequest) {
          Authentication authentication = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(loginRequest.getIdentifier(), loginRequest.getPassword()));
          String scopes = authentication.getAuthorities().stream().map(auth-> auth.getAuthority()).collect(Collectors.joining(" "));
          String subject = authentication.getName();

          System.out.println("+" + scopes);

          Map<String,String> idToken = new HashMap<>();
          String acces_Token = tokenService.generateToken(subject, scopes);

          RefreshToken refresh_Token = tokenService.createRefreshToken(subject, scopes);

          idToken.put("acces_Token", acces_Token);
          idToken.put("refresh_Token", refresh_Token.getToken());

          return idToken;
    }

    public String refresh(String refreshToken) {
        RefreshToken token = tokenService.verifyToken(refreshToken);
          Auth user = authRepository.findByUsername(token.getUsername()).orElseThrow(() -> new RuntimeException("User not found"));
          String scopes = "ROLE_" + user.getRole().toString();
          System.out.println("-"+ scopes);
        return tokenService.generateToken(token.getUsername(), scopes);
    }

}
