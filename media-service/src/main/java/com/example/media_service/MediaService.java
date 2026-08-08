package com.example.media_service;

import com.cloudinary.Cloudinary;
import com.example.media_service.repository.MediaRepository;
import lombok.RequiredArgsConstructor;
import java.io.IOException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import com.cloudinary.utils.ObjectUtils;
import com.example.media_service.entity.Media;
import java.time.Instant;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MediaService {

    private final Cloudinary cloudinary;
    private final MediaRepository mediaRepository;
    private static final long MAX_FILE_SIZE = 2 * 1024 * 1024;

    private void validateImage(MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Image file is required");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("Image size must not exceed 2 MB");
        }

        String contentType = file.getContentType();

        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Only image files are allowed");
        }
    }

    public Media uploadImage(MultipartFile file, String sellerId) {

        validateImage(file);

        try {
            
            Map result = cloudinary.uploader().upload( file.getBytes(), ObjectUtils.asMap("resource_type", "image"));

            Media media = Media.builder()
                    .sellerId(sellerId)
                    .url((String) result.get("secure_url"))
                    .publicId((String) result.get("public_id"))
                    .contentType(file.getContentType())
                    .size(file.getSize())
                    .createdAt(Instant.now())
                    .build();

            return mediaRepository.save(media);

        } catch (IOException e) {
            throw new RuntimeException("Failed to upload image", e);
        }
    }
}