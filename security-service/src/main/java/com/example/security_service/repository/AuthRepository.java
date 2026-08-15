package com.example.security_service.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.example.security_service.entities.Auth;

@Repository
public interface AuthRepository extends MongoRepository<Auth, String> {
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    Optional<Auth> findByEmail(String email);
    Optional<Auth> findByUsername(String username);
}
