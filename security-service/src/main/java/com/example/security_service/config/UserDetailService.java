package com.example.security_service.config;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;

import com.example.security_service.entities.Auth;
import com.example.security_service.repository.AuthRepository;

@Component
public class UserDetailService implements UserDetailsService {
    
    private AuthRepository authRepository;

    public UserDetailService(AuthRepository authRepository) {
         this.authRepository = authRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String identifier) {
          Auth user = authRepository.findByEmail(identifier)
            .or(() -> authRepository.findByUsername(identifier))
            .orElseThrow(() ->
                    new RuntimeException(
                            "Username or password incorrect"));
          return new CustomUserDetails(user);
    }
}
