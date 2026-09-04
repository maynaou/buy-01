package com.example.security_service.services;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;

import com.example.security_service.entities.RefreshToken;
import com.example.security_service.exception.InvalidRefreshTokenException;
import com.example.security_service.repository.RefreshTokenRepository;

@ExtendWith(MockitoExtension.class)
class TokenServiceTest {

    @Mock private JwtEncoder jwtEncoder;
    @Mock private RefreshTokenRepository refreshTokenRepository;

    private TokenService tokenService;

    @BeforeEach
    void setUp() {
        tokenService = new TokenService(jwtEncoder, refreshTokenRepository);
    }

    @Test
    void generateToken_Success() {
        Jwt fakeJwt = Jwt.withTokenValue("fake.jwt.token")
                .header("alg", "RS256")
                .claim("sub", "user123")
                .build();

        when(jwtEncoder.encode(any(JwtEncoderParameters.class))).thenReturn(fakeJwt);

        String token = tokenService.generateToken("user123", "ROLE_CLIENT");

        assertThat(token).isEqualTo("fake.jwt.token");
        verify(jwtEncoder).encode(any(JwtEncoderParameters.class));
    }

    @Test
    void createRefreshToken_Success() {
        when(refreshTokenRepository.save(any(RefreshToken.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        RefreshToken result = tokenService.createRefreshToken("user123");

        assertThat(result.getUserId()).isEqualTo("user123");
        assertThat(result.getToken()).isNotBlank();
        assertThat(result.getExpiryDate()).isAfter(Instant.now());
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    void verifyToken_Success() {
        RefreshToken validToken = RefreshToken.builder()
                .userId("user123")
                .token("valid-token")
                .expiryDate(Instant.now().plusSeconds(3600))
                .build();

        when(refreshTokenRepository.findByToken("valid-token")).thenReturn(Optional.of(validToken));

        RefreshToken result = tokenService.verifyToken("valid-token");

        assertThat(result).isEqualTo(validToken);
        verify(refreshTokenRepository, never()).delete(any());
    }

    @Test
    void verifyToken_NotFound_ShouldThrow() {
        when(refreshTokenRepository.findByToken("unknown-token")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> tokenService.verifyToken("unknown-token"))
                .isInstanceOf(InvalidRefreshTokenException.class)
                .hasMessage("Invalid refresh token");
    }

    @Test
    void verifyToken_Expired_ShouldDeleteAndThrow() {
        RefreshToken expiredToken = RefreshToken.builder()
                .userId("user123")
                .token("expired-token")
                .expiryDate(Instant.now().minusSeconds(3600))
                .build();

        when(refreshTokenRepository.findByToken("expired-token")).thenReturn(Optional.of(expiredToken));

        assertThatThrownBy(() -> tokenService.verifyToken("expired-token"))
                .isInstanceOf(InvalidRefreshTokenException.class)
                .hasMessage("Refresh token expired");

        verify(refreshTokenRepository).delete(expiredToken);
    }
}