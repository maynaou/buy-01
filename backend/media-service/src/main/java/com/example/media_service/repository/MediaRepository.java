package com.example.media_service.repository;


import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.media_service.entity.Media;


@Repository
public interface MediaRepository extends JpaRepository<Media, String> {
    Optional<Media> findByProducId(String productId);
}