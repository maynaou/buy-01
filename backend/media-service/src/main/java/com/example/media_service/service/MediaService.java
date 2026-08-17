package com.example.media_service.service;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

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

        for (MultipartFile file : imgUrls) {
            if (file.isEmpty()) {
                continue;
            }

            try {
                var pic = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap("folder", "media"));

                Media newMedia = new Media();
                newMedia.setProductId(productId);
                newMedia.setImagePath(pic.get("secure_url").toString());

                this.mediaRepository.save(newMedia);

                streamBridge.send("mediaProducer-out-0",
                        new MediaCreatedEvent(EventType.CREATED, productId, newMedia.getImagePath()));

            } catch (IOException e) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "Failed to upload file: " + file.getOriginalFilename());
            }
        }

    }

    public void deleteImage(String id) {
        Media media = mediaRepository.findById(id).orElseThrow(() -> new RuntimeException("image not found"));
        mediaRepository.delete(media);
        streamBridge.send("mediaProducer-out-0",
                new MediaCreatedEvent(EventType.DELETED, media.getProductId(), media.getImagePath()));
    }

}