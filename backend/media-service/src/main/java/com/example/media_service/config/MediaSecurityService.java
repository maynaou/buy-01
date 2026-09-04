package com.example.media_service.config;

import org.springframework.stereotype.Service;

import com.example.media_service.repository.ProductReferenceRepository;

@Service("mediaSecurity")
public class MediaSecurityService {
      
    ProductReferenceRepository productReferenceRepository;

    public MediaSecurityService(ProductReferenceRepository productReferenceRepository) {
           this.productReferenceRepository = productReferenceRepository;
    }

    public boolean isOwner(String productId, String currentId) {
        return productReferenceRepository.findByProductId(productId).map(product -> product.getUserId().equals(currentId)).orElse(false); 
    } 
}
