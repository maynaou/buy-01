package com.example.media_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import com.example.media_service.entities.Media;


@RepositoryRestResource
public interface MediaRepository extends JpaRepository<Media,String>{ 
}
