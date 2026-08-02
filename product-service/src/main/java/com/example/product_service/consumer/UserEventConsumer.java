package com.example.product_service.consumer;

import java.util.UUID;
import java.util.function.Consumer;

import org.springframework.cloud.stream.function.StreamBridge;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.example.product_service.dto.UserDTO;
import com.example.product_service.entities.Product;
import com.example.product_service.events.ProductCreatedEvent;
import com.example.product_service.repository.ProductRepository;

@Configuration
public class UserEventConsumer {
     

    @Bean
    public Consumer<UserDTO> userConsumer(ProductRepository productRepository, StreamBridge streamBridge) {
        return user -> {
            System.out.println("Received user event: " + user);
            Product product = Product.builder()
                                  .id(UUID.randomUUID().toString())
                                  .name("djaja")
                                  .description("djaja lamli7 saffy")
                                  .price(10000 + Math.random()*90000)
                                  .quantity(20)
                                  .userId(user.getUserId())
                                  .build();
            productRepository.save(product);

            System.out.println("Product created and saved: " + product.getId());

            streamBridge.send("productProducer-out-0", ProductCreatedEvent.builder()
                    .productId(product.getId())
                    .name(product.getName())
                    .description(product.getDescription())
                    .price(product.getPrice())
                    .quantity(product.getQuantity())
                    .userId(product.getUserId())
                    .build());
        };
    }
}
