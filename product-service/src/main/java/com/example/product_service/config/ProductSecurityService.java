package com.example.product_service.config;

import org.springframework.stereotype.Service;

import com.example.product_service.repository.ProductRepository;

@Service("productSecurity")
@SuppressWarnings("null")
public class ProductSecurityService {
     
    ProductRepository productRepository;

    public ProductSecurityService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public boolean isOwner(String productId, String currentId) {
        return productRepository.findById(productId).map(product -> product.getSellerId().equals(currentId)).orElse(false); 
    } 
    
}
