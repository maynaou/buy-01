package com.example.media_service.consumer;

import java.util.List;
import java.util.function.Consumer;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.example.media_service.dto.ProductReferenceDTO;
import com.example.media_service.entities.Media;
import com.example.media_service.entities.ProductReference;
import com.example.media_service.repository.MediaRepository;
import com.example.media_service.repository.ProductReferenceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


@Configuration
public class MediaEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(MediaEventConsumer.class);
    
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
                List<Media> media = mediaRepository.findByEntityId(event.getProductId()).orElseThrow(() -> new RuntimeException("productId not found"));
                mediaRepository.deleteAll(media);
            }

            default -> {
                log.warn("Unknown event type: {}", event.getEventType());
            }
        }
    };
    }
}
