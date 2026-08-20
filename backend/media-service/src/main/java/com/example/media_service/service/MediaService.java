package com.example.media_service.service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.cloud.stream.function.StreamBridge;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.example.media_service.dto.MediaDTO;
import com.example.media_service.entities.Media;
import com.example.media_service.enums.EventType;
import com.example.media_service.enums.MediaType;
import com.example.media_service.events.MediaCreatedEvent;
import com.example.media_service.exception.MediaNotFoundException;
import com.example.media_service.mapper.MediaMapper;
import com.example.media_service.repository.MediaRepository;
import com.example.media_service.repository.ProductReferenceRepository;

@Service
public class MediaService {

    MediaRepository mediaRepository;

    ProductReferenceRepository productReferenceRepository;

    private Cloudinary cloudinary;

    StreamBridge streamBridge;

    MediaMapper mediaMapper;

    public MediaService(MediaRepository mediaRepository, Cloudinary cloudinary,
            ProductReferenceRepository productReferenceRepository, StreamBridge streamBridge,
            MediaMapper mediaMapper) {
        this.mediaRepository = mediaRepository;
        this.cloudinary = cloudinary;
        this.productReferenceRepository = productReferenceRepository;
        this.streamBridge = streamBridge;
        this.mediaMapper = mediaMapper;
    }

    public List<MediaDTO> uploadImage(MultipartFile[] imgUrls, String productId) {

        Optional<List<Media>> existing = mediaRepository.findAllByEntityIdAndMediaType(productId, MediaType.PRODUCT);
        List<Media> existingList = existing.orElseGet(ArrayList::new);
        List<Media> saved = new ArrayList<>();
        int index = 0;
        for (MultipartFile file : imgUrls) {
            if (file.isEmpty()) {
                continue;
            }

            try {
                var pic = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap("folder", "media"));
                String imagePath = pic.get("secure_url").toString();

                if (index < existingList.size()) {
                    Media existingMedia = existingList.get(index);
                    String oldPath = existingMedia.getImagePath();
                    existingMedia.setImagePath(imagePath);
                    saved.add(this.mediaRepository.save(existingMedia));

                    streamBridge.send("mediaProducer-out-0",
                            new MediaCreatedEvent(EventType.DELETED, productId, oldPath, MediaType.PRODUCT));
                } else {
                    Media newMedia = new Media();
                    newMedia.setEntityId(productId);
                    newMedia.setImagePath(imagePath);
                    newMedia.setMediaType(MediaType.PRODUCT);

                    saved.add(this.mediaRepository.save(newMedia));
                }
                index++;

                streamBridge.send("mediaProducer-out-0",
                        new MediaCreatedEvent(EventType.CREATED, productId, imagePath, MediaType.PRODUCT));

            } catch (IOException e) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "Failed to upload file: " + file.getOriginalFilename());
            }

        }

        if (index < existingList.size()) {
            List<Media> removed = new ArrayList<>(existingList.subList(index, existingList.size()));
            this.mediaRepository.deleteAll(removed);

            for (Media media : removed) {
                streamBridge.send("mediaProducer-out-0",
                        new MediaCreatedEvent(EventType.DELETED, productId, media.getImagePath(),
                                MediaType.PRODUCT));
            }
        }

        return mediaMapper.fromMedia(saved);
    }

    public MediaDTO uploadAvatar(MultipartFile imgUrl, String userId) {
        try {
            var pic = cloudinary.uploader().upload(imgUrl.getBytes(), ObjectUtils.asMap("folder", "media"));

            String imagePath = pic.get("secure_url").toString();

            Optional<Media> existing = mediaRepository.findByEntityIdAndMediaType(userId, MediaType.AVATAR);

            Media saved;
            if (existing.isPresent()) {
                existing.get().setImagePath(imagePath);
                saved = this.mediaRepository.save(existing.get());
            } else {
                Media newMedia = new Media();
                newMedia.setEntityId(userId);
                newMedia.setImagePath(imagePath);
                newMedia.setMediaType(MediaType.AVATAR);

                saved = this.mediaRepository.save(newMedia);
            }

            streamBridge.send("mediaProducer-out-0",
                    new MediaCreatedEvent(EventType.CREATED, userId, imagePath, MediaType.AVATAR));

            return mediaMapper.fromMedia(saved);

        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Failed to upload file: " + imgUrl.getOriginalFilename());
        }
    }

    public void deleteImage(String id) {
        Media media = mediaRepository.findById(id).orElseThrow(() -> new MediaNotFoundException("image not found"));
        mediaRepository.delete(media);
        streamBridge.send("mediaProducer-out-0",
                new MediaCreatedEvent(EventType.DELETED, media.getEntityId(), media.getImagePath(), media.getMediaType()));
    }

}