package com.example.security_service.services;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cloud.stream.function.StreamBridge;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.Authentication;

import com.example.security_service.config.CustomUserDetails;
import com.example.security_service.dto.AuthResponse;
import com.example.security_service.dto.LoginRequest;
import com.example.security_service.dto.RegisterRequest;
import com.example.security_service.entities.Auth;
import com.example.security_service.entities.RefreshToken;
import com.example.security_service.enums.Role;
import com.example.security_service.exception.UserAlreadyExistsException;
import com.example.security_service.exception.UserNotFoundException;
import com.example.security_service.repository.AuthRepository;
import com.example.security_service.repository.RefreshTokenRepository;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @Mock 
    private AuthRepository authRepository;
    @Mock 
    private PasswordEncoder passwordEncoder;
    @Mock 
    private AuthenticationManager authenticationManager;
    @Mock 
    private TokenService tokenService;
    @Mock 
    private RefreshTokenRepository refreshTokenRepository;
    @Mock 
    private StreamBridge streamBridge;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(authRepository, passwordEncoder, authenticationManager,
                tokenService, refreshTokenRepository, streamBridge);
    }

    @Test
    @DisplayName("register - utilisateur nouveau → sauvegarde et publie un event")
    void register_NewUser_ShouldSaveAndPublishEvent() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("testuser");
        request.setEmail("test@example.com");
        request.setPassword("password123");
        request.setRole(Role.CLIENT);

        when(authRepository.existsByUsername("testuser")).thenReturn(false);
        when(authRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashed-password");

        Auth savedAuth = Auth.builder()
                .id("auth-id-1")
                .username("testuser")
                .email("test@example.com")
                .role(Role.CLIENT)
                .build();
        when(authRepository.save(any(Auth.class))).thenReturn(savedAuth);

        authService.register(request);

        verify(authRepository, times(1)).save(any(Auth.class));
        verify(streamBridge, times(1)).send(eq("authProducer-out-0"), any());
    }

    @Test
    @DisplayName("register - username déjà pris → lève UserAlreadyExistsException")
    void register_UsernameTaken_ShouldThrow() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("testuser");
        request.setEmail("test@example.com");
        request.setPassword("password123");
        request.setRole(Role.CLIENT);

        when(authRepository.existsByUsername("testuser")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(UserAlreadyExistsException.class)
                .hasMessage("Username already exists");

        verify(authRepository, never()).save(any(Auth.class));
        verify(streamBridge, never()).send(any(), any());
    }


    @Test
    @DisplayName("register - email déjà pris → lève UserAlreadyExistsException")
    void register_EmailTaken_ShouldThrow() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("testuser");
        request.setEmail("test@example.com");
        request.setPassword("password123");
        request.setRole(Role.CLIENT);

        when(authRepository.existsByUsername("testuser")).thenReturn(false);
        when(authRepository.existsByEmail("test@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(UserAlreadyExistsException.class)
                .hasMessage("Email already exists");

        verify(authRepository, never()).save(any(Auth.class));
        verify(streamBridge, never()).send(any(), any());
    }

    @Test
    @DisplayName("login - identifiants valides → retourne access + refresh token")
    void login_ValidCredentials_ShouldReturnTokens() {
        LoginRequest request = new LoginRequest();
        request.setIdentifier("testuser");
        request.setPassword("password123");

        Authentication authentication = mock(Authentication.class);
        CustomUserDetails userDetails = mock(CustomUserDetails.class);

        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        when(userDetails.getId()).thenReturn("user-id-1");
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_CLIENT")))
            .when(userDetails).getAuthorities();

        when(tokenService.generateToken("user-id-1", "ROLE_CLIENT")).thenReturn("fake-access-token");

        RefreshToken fakeRefreshToken = RefreshToken.builder()
                .userId("user-id-1")
                .token("fake-refresh-token")
                .build();
        when(tokenService.createRefreshToken("user-id-1")).thenReturn(fakeRefreshToken);

        AuthResponse response = authService.login(request);

        assertThat(response.getAcces_Token()).isEqualTo("fake-access-token");
        assertThat(response.getRefresh_Token()).isEqualTo("fake-refresh-token");
    }

    @Test
    @DisplayName("refresh - token valide → régénère et supprime l'ancien")
    void refresh_ValidToken_ShouldRotateToken() {
        RefreshToken oldToken = RefreshToken.builder()
                .id("old-token-id")
                .userId("user-id-1")
                .token("old-refresh-token")
                .build();

        Auth user = Auth.builder()
                .id("user-id-1")
                .role(Role.CLIENT)
                .build();

        RefreshToken newRefreshToken = RefreshToken.builder()
                .userId("user-id-1")
                .token("new-refresh-token")
                .build();

        when(tokenService.verifyToken("old-refresh-token")).thenReturn(oldToken);
        when(authRepository.findById("user-id-1")).thenReturn(Optional.of(user));
        when(tokenService.generateToken("user-id-1", "ROLE_CLIENT")).thenReturn("new-access-token");
        when(tokenService.createRefreshToken("user-id-1")).thenReturn(newRefreshToken);

        AuthResponse response = authService.refresh("old-refresh-token");

        assertThat(response.getAcces_Token()).isEqualTo("new-access-token");
        assertThat(response.getRefresh_Token()).isEqualTo("new-refresh-token");
        verify(refreshTokenRepository, times(1)).deleteById("old-token-id");
    }

    @Test
    @DisplayName("refresh - utilisateur introuvable → lève UserNotFoundException")
    void refresh_UserNotFound_ShouldThrow() {
        RefreshToken oldToken = RefreshToken.builder()
                .id("old-token-id")
                .userId("ghost-user-id")
                .token("some-token")
                .build();

        when(tokenService.verifyToken("some-token")).thenReturn(oldToken);
        when(authRepository.findById("ghost-user-id")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.refresh("some-token"))
                .isInstanceOf(UserNotFoundException.class)
                .hasMessage("User not found");

        verify(refreshTokenRepository, never()).deleteById(any());
    }
}
