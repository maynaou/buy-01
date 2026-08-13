package com.example.product_service.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import com.example.product_service.entities.Product;

@RepositoryRestResource
public interface ProductRepository extends JpaRepository<Product,String> {
         Optional<Product> findByProductId(String productId);
}
