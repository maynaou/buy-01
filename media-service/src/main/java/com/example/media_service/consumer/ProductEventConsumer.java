package com.example.media_service.consumer;

import java.util.UUID;
import java.util.function.Consumer;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.example.media_service.dto.ProductDTO;
import com.example.media_service.entities.Media;
import com.example.media_service.repository.MediaRepository;

@Configuration
public class ProductEventConsumer {
           

    @Bean
    public Consumer<ProductDTO> productConsumer(MediaRepository mediaRepository) {
        return productEvent -> {
            System.out.println("Received Product Event: " + productEvent.getProductId());
            Media media = Media.builder()
                    .id(UUID.randomUUID().toString())
                    .imagePath(productEvent.getName() + "_" + UUID.randomUUID().toString())
                    .productId(productEvent.getProductId())
                    .build();
            mediaRepository.save(media);
        };
    }
}
