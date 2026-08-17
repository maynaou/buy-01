package com.example.media_service;

import java.util.UUID;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import com.example.media_service.entities.Media;
import com.example.media_service.repository.MediaRepository;

@SpringBootApplication
public class MediaServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(MediaServiceApplication.class, args);
    }

    @Bean
    CommandLineRunner commandLineRunner(MediaRepository mediaRepository) {
        return args -> {
                  Media media = Media.builder()
                                     .imagePath(UUID.randomUUID().toString())
                                     .productId("prod123")
                                     .build();

                  mediaRepository.save(media);
        };
    }
}