package com.example.media_service.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.media_service.entities.ProductReference;

public interface ProductReferenceRepository extends MongoRepository<ProductReference, String> {
        ProductReference findByProductId(String productId);
}
