package com.example.security_service.web;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

import com.example.security_service.dto.AuthResponse;
import com.example.security_service.dto.LoginRequest;
import com.example.security_service.dto.RegisterRequest;
import com.example.security_service.enums.Role;
import com.example.security_service.services.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private AuthService authService;

    @InjectMocks
    private AuthController authController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(authController)
                .setValidator(new LocalValidatorFactoryBean())
                .build();
        objectMapper = new ObjectMapper();
    }

    @Test
    void register_Success() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("testuser");
        request.setEmail("test@example.com");
        request.setPassword("password123");
        request.setRole(Role.CLIENT);

        doNothing().when(authService).register(any(RegisterRequest.class));

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(content().string("Registration successful!"));

        verify(authService).register(any(RegisterRequest.class));
    }

    @Test
    void login_Success() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setIdentifier("testuser");
        request.setPassword("password123");

        AuthResponse response = AuthResponse.builder()
                .acces_Token("access-token-123")
                .refresh_Token("refresh-token-456")
                .build();

        when(authService.login(any(LoginRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.acces_Token").value("access-token-123"))
                .andExpect(jsonPath("$.refresh_Token").value("refresh-token-456"));

        verify(authService).login(any(LoginRequest.class));
    }

    @Test
    void refresh_Success() throws Exception {
        String token = "valid-refresh-token";
        AuthResponse response = AuthResponse.builder()
                .acces_Token("new-access-token")
                .refresh_Token("new-refresh-token")
                .build();

        when(authService.refresh(token)).thenReturn(response);

        mockMvc.perform(post("/api/auth/refresh/{id}", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.acces_Token").value("new-access-token"))
                .andExpect(jsonPath("$.refresh_Token").value("new-refresh-token"));

        verify(authService).refresh(token);
    }

    @Test
    void register_InvalidData_ShouldReturn400() throws Exception {
        RegisterRequest request = new RegisterRequest(); // champs vides

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(authService, never()).register(any());
    }

    @Test
    void login_InvalidData_ShouldReturn400() throws Exception {
        LoginRequest request = new LoginRequest(); // champs vides

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(authService, never()).login(any());
    }
}