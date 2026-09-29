package com.example.product_service.consumer;

import java.util.function.Consumer;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.example.product_service.dto.ProductConsumerDTO;
import com.example.product_service.entities.Product;
import com.example.product_service.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Configuration
public class ProductEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(MediaEventConsumer.class);


    @Bean
    public Consumer<ProductConsumerDTO> productConsumer(ProductRepository productRepository) {
        return event -> {
            if (!"PRODUCT".equals(event.getMediaType())) {
                return;
            }
            switch (event.getEventType()) {
                case CREATED -> {

                    Product product = productRepository.findById(event.getProductId())
                            .orElseThrow(() -> new RuntimeException("product not found"));
                    product.getImagePaths().add(event.getImagePath());
                    productRepository.save(product);
                }

                case DELETED -> {
                    Product product = productRepository.findById(event.getProductId())
                            .orElseThrow(() -> new RuntimeException("product not found"));

                    product.getImagePaths().removeIf(img -> img.equals(event.getImagePath()));
                    productRepository.save(product);
                }

                default -> log.warn("Unknown event type: {}", event.getEventType());


            }

        };
    }
}
