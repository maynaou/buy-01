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
import com.example.media_service.entities.Media;
import com.example.media_service.entities.ProductReference;
import com.example.media_service.enums.EventType;
import com.example.media_service.enums.MediaType;
import com.example.media_service.events.MediaCreatedEvent;
import com.example.media_service.repository.MediaRepository;
import com.example.media_service.repository.ProductReferenceRepository;

@Service
public class MediaService {

    MediaRepository mediaRepository;

    ProductReferenceRepository productReferenceRepository;

    private Cloudinary cloudinary;

    StreamBridge streamBridge;

    public MediaService(MediaRepository mediaRepository, Cloudinary cloudinary,
            ProductReferenceRepository productReferenceRepository, StreamBridge streamBridge) {
        this.mediaRepository = mediaRepository;
        this.cloudinary = cloudinary;
        this.productReferenceRepository = productReferenceRepository;
        this.streamBridge = streamBridge;
    }

    public void uploadImage(MultipartFile[] imgUrls, String productId) {
        ProductReference productReference = productReferenceRepository.findByProductId(productId);

        if (!productReference.getProductId().equals(productId)) {
            throw new RuntimeException("product pas cree");
        }

        Optional<List<Media>> existing = mediaRepository.findAllByEntityIdAndType(productId, MediaType.PRODUCT);
        List<Media> existingList = existing.orElseGet(ArrayList::new);
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
                    this.mediaRepository.save(existingMedia);

                    streamBridge.send("mediaProducer-out-0",
                            new MediaCreatedEvent(EventType.DELETED, productId, oldPath, MediaType.PRODUCT));
                } else {
                    Media newMedia = new Media();
                    newMedia.setEntityId(productId);
                    newMedia.setImagePath(imagePath);
                    newMedia.setType(MediaType.PRODUCT);

                    this.mediaRepository.save(newMedia);
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

    }

    public void uploadAvatar(MultipartFile imgUrl, String userId) {
        try {
            var pic = cloudinary.uploader().upload(imgUrl.getBytes(), ObjectUtils.asMap("folder", "media"));

            String imagePath = pic.get("secure_url").toString();

            Optional<Media> existing = mediaRepository.findByEntityIdAndType(userId, MediaType.AVATAR);

            if (existing.isPresent()) {
                existing.get().setImagePath(imagePath);
                this.mediaRepository.save(existing.get());
            } else {
                Media newMedia = new Media();
                newMedia.setEntityId(userId);
                newMedia.setImagePath(imagePath);
                newMedia.setType(MediaType.AVATAR);

                this.mediaRepository.save(newMedia);
            }

            streamBridge.send("mediaProducer-out-0",
                    new MediaCreatedEvent(EventType.CREATED, userId, imagePath, MediaType.AVATAR));

        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Failed to upload file: " + imgUrl.getOriginalFilename());
        }
    }

    public void deleteImage(String id) {
        Media media = mediaRepository.findById(id).orElseThrow(() -> new RuntimeException("image not found"));
        mediaRepository.delete(media);
        streamBridge.send("mediaProducer-out-0",
                new MediaCreatedEvent(EventType.DELETED, media.getEntityId(), media.getImagePath(), media.getType()));
    }

}