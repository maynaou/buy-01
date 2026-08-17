package com.example.product_service.consumer;

import java.util.function.Consumer;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.example.product_service.dto.ProductConsumerDTO;
import com.example.product_service.entities.Product;
import com.example.product_service.repository.ProductRepository;

@Configuration
public class ProductEventConsumer {

    @Bean
    public Consumer<ProductConsumerDTO> productConsumer(ProductRepository productRepository) {
        return event -> {
            switch (event.getEventType()) {
                case CREATED -> {

                    System.out.println("--------------------------" + event.getImagePath());
                    Product product = productRepository.findById(event.getProductId())
                            .orElseThrow(() -> new RuntimeException("product not found"));
                    product.getImagePaths().add(event.getImagePath());
                    productRepository.save(product);
                    break;
                }

                case DELETED -> {
                    Product product = productRepository.findById(event.getProductId())
                            .orElseThrow(() -> new RuntimeException("product not found"));

                    product.getImagePaths().removeIf(img -> img.equals(event.getImagePath()));
                    productRepository.save(product);
                    break;
                }

                default -> {
                    break;
                }

            }

        };
    }
}
