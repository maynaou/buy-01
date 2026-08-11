package com.example.product_service.service;

import java.util.UUID;

import com.example.product_service.dto.ProductDTO;
import com.example.product_service.entities.Product;
import com.example.product_service.mappers.ProductMapper;
import com.example.product_service.repository.ProductRepository;

public class ProductService {
    
    ProductRepository productRepository;
    ProductMapper productMapper;
    public ProductService(ProductRepository productRepository, ProductMapper productMapper) {
        this.productRepository = productRepository;
        this.productMapper = productMapper;
    }

    public ProductDTO createProduct(ProductDTO productRequest, String userId) {
                Product product = Product.builder()
                                         .id(UUID.randomUUID().toString())
                                         .name(productRequest.getName())
                                         .description(productRequest.getDescription())
                                         .price(productRequest.getPrice())
                                         .quantity(productRequest.getQuantity())
                                         .userId(userId)
                                         .build();
                productRepository.save(product);

                return productMapper.fromProdcut(product);
    }
}
