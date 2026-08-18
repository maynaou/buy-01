package com.example.media_service.repository;



import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import com.example.media_service.entities.Media;
import com.example.media_service.enums.MediaType;


@Repository
public interface MediaRepository extends MongoRepository<Media, String> {
     Optional<List<Media>> findByEntityId(String product);
     Optional<Media> findByEntityIdAndType(String entityId, MediaType type);
     Optional<List<Media>> findAllByEntityIdAndType(String entityId, MediaType type);
}