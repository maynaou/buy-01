package com.example.security_service.repository;

import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import com.example.security_service.entities.RefreshToken;

@Repository
public interface RefreshTokenRepository extends MongoRepository<RefreshToken,String>{
     Optional<RefreshToken> findByToken(String token);
}
