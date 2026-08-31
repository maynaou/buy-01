package com.example.security_service.web;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;


import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.example.security_service.dto.AuthResponse;
import com.example.security_service.dto.LoginRequest;
import com.example.security_service.dto.RegisterRequest;
import com.example.security_service.services.AuthService;
import com.example.security_service.enums.Role;
import com.fasterxml.jackson.databind.ObjectMapper;

@ExtendWith(MockitoExtension.class)
public class AuthControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AuthService authService;

    @InjectMocks
    private AuthController authController;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(authController).build();
        objectMapper = new ObjectMapper();
    }

    @Test
    @DisplayName("POST /api/auth/register - Succès")
    void register_Success() throws Exception {
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setUsername("testuser");
        registerRequest.setEmail("test@example.com");
        registerRequest.setPassword("password123");
        registerRequest.setRole(Role.CLIENT); // Remplacez selon votre enum

        doNothing().when(authService).register(any(RegisterRequest.class));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andExpect(content().string("Registration successful!"));

        verify(authService, times(1)).register(any(RegisterRequest.class));
    }


    @Test
    @DisplayName("POST /api/auth/login - Succès")
    void login_Success() throws Exception {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setIdentifier("testuser");
        loginRequest.setPassword("password123");

        AuthResponse authResponse = AuthResponse.builder()
                .acces_Token("access-token-123")
                .refresh_Token("refresh-token-456")
                .build();

        when(authService.login(any(LoginRequest.class))).thenReturn(authResponse);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.acces_Token").value("access-token-123"))
                .andExpect(jsonPath("$.refresh_Token").value("refresh-token-456"));

        verify(authService, times(1)).login(any(LoginRequest.class));
    }


    @Test
    @DisplayName("POST /api/auth/refresh/{id} - Succès")
    void refresh_Success() throws Exception {
        String refreshTokenStr = "valid-refresh-token";
        AuthResponse authResponse = AuthResponse.builder()
                .acces_Token("new-access-token")
                .refresh_Token("new-refresh-token")
                .build();

        when(authService.refresh(refreshTokenStr)).thenReturn(authResponse);

        mockMvc.perform(post("/api/auth/refresh/{id}", refreshTokenStr))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.acces_Token").value("new-access-token"))
                .andExpect(jsonPath("$.refresh_Token").value("new-refresh-token"));

        verify(authService, times(1)).refresh(refreshTokenStr);
    }


}
