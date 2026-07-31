package com.example.media_service;

import java.util.UUID;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.annotation.Bean;
import org.springframework.hateoas.PagedModel;

import com.example.media_service.dto.ProductDTO;
import com.example.media_service.entities.Media;
import com.example.media_service.feign.ProductRestClient;
import com.example.media_service.repository.MediaRepository;

@SpringBootApplication
@EnableFeignClients
public class MediaServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(MediaServiceApplication.class, args);
	}
    
	@Bean
	CommandLineRunner commandLineRunner(MediaRepository mediaRepository , ProductRestClient productRestClient) {
          return args -> {
                      PagedModel<ProductDTO> products = productRestClient.getAllProducts();
					  System.out.println(products);

					  products.forEach(prod -> {
						    Media media = Media.builder()
							              .id(UUID.randomUUID().toString())
										  .imagePath(prod + "_" + UUID.randomUUID().toString())
										  .productId(prod.getId())
							              .build();
						   mediaRepository.save(media);
					  });
		  };
	}

}
