// package com.example.media_service.consumer;

// import java.util.function.Consumer;

// import org.springframework.context.annotation.Bean;
// import org.springframework.context.annotation.Configuration;

// import com.example.media_service.dto.ProductReferenceDTO;
// import com.example.media_service.entity.ProductReference;
// import com.example.media_service.repository.ProductReferenceRepository;

// @Configuration
// public class MediaEventConsumer {
    
//     @Bean
//     public Consumer<ProductReferenceDTO> mediaConsumer(ProductReferenceRepository productReferenceRepository) {
//         return product -> {
//                 System.out.println("productId : " + product.getProductId());
//                 ProductReference productReference = ProductReference.builder()
//                                                                     .productId(product.getProductId())
//                                                                     .userId(product.getUserId())
//                                                                     .build();
//                 productReferenceRepository.save(productReference);
//         };
//     }
// }
