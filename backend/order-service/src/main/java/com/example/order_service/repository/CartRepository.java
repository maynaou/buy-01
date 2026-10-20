package com.example.order_service.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import com.example.order_service.entities.Cart;


@Repository 
public interface CartRepository extends MongoRepository<Cart,String> {
    Optional<Cart> findByUserId(String userId);
}