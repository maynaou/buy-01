package com.example.media_service.repository;

import com.example.media_service.entity.Media;

import org.springframework.data.jpa.repository.JpaRepository;
// import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;


@Repository
public interface MediaRepository extends JpaRepository<Media, String> {
}