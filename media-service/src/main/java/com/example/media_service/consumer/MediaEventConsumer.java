package com.example.media_service.consumer;

import java.util.function.Consumer;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.example.media_service.dto.ProductReferenceDTO;
import com.example.media_service.entity.ProductReference;
import com.example.media_service.repository.MediaRepository;
import com.example.media_service.repository.ProductReferenceRepository;
import com.example.media_service.entity.Media;


@Configuration
public class MediaEventConsumer {
    
    @Bean
    public Consumer<ProductReferenceDTO> mediaConsumer(ProductReferenceRepository productReferenceRepository, MediaRepository mediaRepository ) {
      return event -> {

        switch (event.getEventType()) {

            case CREATED -> {
                ProductReference productReference =
                        ProductReference.builder()
                                .productId(event.getProductId())
                                .userId(event.getUserId())
                                .build();

                productReferenceRepository.save(productReference);
            }

            case DELETED -> {
                // Media media = mediaRepository.findByProducId(event.getProductId()).orElseThrow(() -> new RuntimeException("productId not found"));
                // mediaRepository.delete(media);
            }

            default -> {
                System.out.println(
                        "Unknown event type: " + event.getEventType()
                );
            }
        }
    };
    }
}
