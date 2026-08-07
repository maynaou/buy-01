package com.example.security_service.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;
import com.example.security_service.entities.Auth;

@RepositoryRestResource
public interface AuthRepository extends JpaRepository<Auth, String> {
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    Optional<Auth> findByEmail(String email);
    Optional<Auth> findByUsername(String username);
}
