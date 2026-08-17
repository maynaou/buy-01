package com.example.media_service.repository;



import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import com.example.media_service.entities.Media;


@Repository
public interface MediaRepository extends MongoRepository<Media, String> {
     Optional<List<Media>> findByProductId(String product);
}