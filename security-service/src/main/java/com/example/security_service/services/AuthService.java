package com.example.security_service.services;


import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.cloud.stream.function.StreamBridge;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.security_service.dto.LoginRequest;
import com.example.security_service.dto.RegisterRequest;
import com.example.security_service.entities.Auth;
import com.example.security_service.entities.RefreshToken;
import com.example.security_service.events.UserCreatedEvent;
import com.example.security_service.repository.AuthRepository;
import com.example.security_service.repository.RefreshTokenRepository;

@Service
public class AuthService {

    AuthRepository authRepository;
    PasswordEncoder passwordEncoder;
    AuthenticationManager authenticationManager;
    TokenService tokenService;
    RefreshTokenRepository refreshTokenRepository;
    StreamBridge streamBridge;

    public AuthService(AuthRepository authRepository, PasswordEncoder passwordEncoder,AuthenticationManager authenticationManager,
         TokenService tokenService,RefreshTokenRepository refreshTokenRepository, StreamBridge streamBridge) {
        this.authRepository = authRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.tokenService = tokenService;
        this.refreshTokenRepository = refreshTokenRepository;
        this.streamBridge = streamBridge;
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

        streamBridge.send("authProducer-out-0", new UserCreatedEvent(authRegister.getId(),authRegister.getUsername(),authRegister.getEmail(),authRegister.getRole()));
    }

    public Map<String,String> login(LoginRequest loginRequest) {
          Authentication authentication = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(loginRequest.getIdentifier(), loginRequest.getPassword()));
          String scopes = authentication.getAuthorities().stream().map(auth-> auth.getAuthority())
                                        .filter(authority -> !authority.startsWith("FACTOR_"))
                                        .collect(Collectors.joining(" "));

          String subject = authentication.getName();
          Map<String,String> idToken = new HashMap<>();
          String acces_Token = tokenService.generateToken(subject, scopes);
          RefreshToken refresh_Token = tokenService.createRefreshToken(subject);
          idToken.put("acces_Token", acces_Token);
          idToken.put("refresh_Token", refresh_Token.getToken());
          return idToken;
    }

    public Map<String,String> refresh(String refreshToken) {
        RefreshToken token = tokenService.verifyToken(refreshToken);
          Auth user = authRepository.findByUsername(token.getUsername()).orElseThrow(() -> new RuntimeException("User not found"));
          String scopes = user.getRole().toString();
          String access_token = tokenService.generateToken(token.getUsername(), scopes);
          RefreshToken refresh_token = tokenService.createRefreshToken(user.getUsername());
          refreshTokenRepository.deleteById(token.getId());
          Map<String,String> idToken = new HashMap<>();
          idToken.put("access_token", access_token);
          idToken.put("refresh_token", refresh_token.getToken());
        return idToken;
    }

}
