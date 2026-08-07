package com.example.security_service.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.security_service.entities.RefreshToken;


public interface RefreshTokenRepository extends JpaRepository<RefreshToken,Long>{
     Optional<RefreshToken> findByToken(String token);
     void deleteByUsername(String username);
}
