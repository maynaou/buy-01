package com.example.product_service.service;

import java.util.UUID;

import org.springframework.cloud.stream.function.StreamBridge;
import org.springframework.stereotype.Service;

import com.example.product_service.dto.ProductDTO;
import com.example.product_service.entities.Product;
import com.example.product_service.events.ProductCreatedEvent;
import com.example.product_service.mappers.ProductMapper;
import com.example.product_service.repository.ProductRepository;

@Service
public class ProductService {
    
    ProductRepository productRepository;
    ProductMapper productMapper;
    StreamBridge streamBridge;
    public ProductService(ProductRepository productRepository, ProductMapper productMapper,StreamBridge streamBridge) {
        this.productRepository = productRepository;
        this.productMapper = productMapper;
        this.streamBridge = streamBridge;
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

                streamBridge.send("productProducer-out-0", new ProductCreatedEvent(product.getId(),product.getUserId()));

                return productMapper.fromProdcut(product);
    }
}
