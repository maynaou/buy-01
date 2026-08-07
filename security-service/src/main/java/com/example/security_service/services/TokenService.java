package com.example.security_service.services;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import com.example.security_service.entities.RefreshToken;
import com.example.security_service.repository.RefreshTokenRepository;

@Service
public class TokenService {

     JwtEncoder jwtEncoder;
     RefreshTokenRepository refreshTokenRepository;

     public TokenService(JwtEncoder jwtEncoder,RefreshTokenRepository refreshTokenRepository) {
           this.jwtEncoder = jwtEncoder;
           this.refreshTokenRepository = refreshTokenRepository;
     }
    
     public String generateToken(String subject, String scopes) {
           Instant now = Instant.now();
           JwtClaimsSet Claim = JwtClaimsSet.builder()
                              .subject(subject)
                              .issuer("security-service")
                              .issuedAt(now)
                              .expiresAt(now.plus(5, ChronoUnit.MINUTES))
                              .claim("scope", scopes)
                              .build();
            String token = jwtEncoder.encode(JwtEncoderParameters.from(Claim)).getTokenValue();
            return token;
     }

     public RefreshToken createRefreshToken(String subject, String scopes) {
            RefreshToken refreshToken = RefreshToken.builder()
                                    .username(subject)
                                    .token(UUID.randomUUID().toString())
                                    .expiryDate(Instant.now().plusSeconds(7 * 24 * 60 * 60))
                                    .build();
        return  refreshTokenRepository.save(refreshToken);
    }


    public RefreshToken verifyToken(String token) {

       RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid refresh token"));

        if (refreshToken.getExpiryDate().isBefore(Instant.now())) {
            refreshTokenRepository.delete(refreshToken);
            throw new RuntimeException("Refresh token expired");
        }

        return refreshToken;
    }

    public void deleteByUserId(String username) {
        refreshTokenRepository.deleteByUsername(username);
    }

}
