package com.example.security_service.services;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import com.example.security_service.entities.RefreshToken;
import com.example.security_service.exception.InvalidRefreshTokenException;
import com.example.security_service.repository.RefreshTokenRepository;

@Service
@SuppressWarnings("null")
public class TokenService {

     JwtEncoder jwtEncoder;
     RefreshTokenRepository refreshTokenRepository;

     public TokenService(JwtEncoder jwtEncoder,RefreshTokenRepository refreshTokenRepository) {
           this.jwtEncoder = jwtEncoder;
           this.refreshTokenRepository = refreshTokenRepository;
     }
    
     public String generateToken(String subject, String scopes) {
           Instant now = Instant.now();
           JwtClaimsSet claim = JwtClaimsSet.builder()
                              .subject(subject)
                              .issuer("security-service")
                              .issuedAt(now)
                              .expiresAt(now.plus(5, ChronoUnit.MINUTES))
                              .claim("scope", scopes)
                              .build();

            return jwtEncoder.encode(JwtEncoderParameters.from(claim)).getTokenValue();
     }

     public RefreshToken createRefreshToken(String subject) {
            RefreshToken refreshToken = RefreshToken.builder()
                                    .userId(subject)
                                    .token(UUID.randomUUID().toString())
                                    .expiryDate(Instant.now().plusSeconds(7L * 24 * 60 * 60))
                                    // .expiryDate(Instant.now().plus(Duration.ofDays(7)))
                                    .build();
        return  refreshTokenRepository.save(refreshToken);
    }


    public RefreshToken verifyToken(String token) {

       RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new InvalidRefreshTokenException("Invalid refresh token"));

        if (refreshToken.getExpiryDate().isBefore(Instant.now())) {
            refreshTokenRepository.delete(refreshToken);
            throw new InvalidRefreshTokenException("Refresh token expired");
        }

        return refreshToken;
    }
}
