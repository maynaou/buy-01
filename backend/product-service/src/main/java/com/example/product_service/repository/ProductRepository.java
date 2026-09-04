package com.example.product_service.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.example.product_service.entities.Product;

@Repository
public interface ProductRepository extends MongoRepository<Product,String> {

    List<Product> findByUserId(String userId);
}
