package com.example.user_service.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import com.example.user_service.entities.User;

@Repository
public interface UserRepository extends MongoRepository<User,String> {
}
