package com.example.user_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import com.example.user_service.entities.User;

@RepositoryRestResource
public interface UserRepository extends JpaRepository<User,String> {
}
