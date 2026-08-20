package com.example.media_service.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.media_service.entities.ProductReference;

public interface ProductReferenceRepository extends MongoRepository<ProductReference, String> {
        Optional<ProductReference> findByProductId(String productId);
}
