package com.example.media_service.repository;
import org.springframework.data.jpa.repository.JpaRepository;

import com.example.media_service.entity.ProductReference;

public interface ProductReferenceRepository extends JpaRepository<ProductReference,Long>{

    
}