// package com.example.media_service.service;

// import com.cloudinary.Cloudinary;
// import com.example.media_service.repository.MediaRepository;
// import lombok.RequiredArgsConstructor;
// import java.io.IOException;
// import org.springframework.stereotype.Service;
// import org.springframework.web.multipart.MultipartFile;
// import com.cloudinary.utils.ObjectUtils;
// import com.example.media_service.dto.MediaResponse;
// import com.example.media_service.entity.Media;
// import java.time.Instant;
// import java.util.Map;

// // @Service
// // @RequiredArgsConstructor
// public class MediaService {

//     private final Cloudinary cloudinary;
//     private final MediaRepository mediaRepository;
//     private static final long MAX_FILE_SIZE = 2 * 1024 * 1024;

//     private void validateImage(MultipartFile file) {

//         if (file == null || file.isEmpty()) {
//             throw new IllegalArgumentException("Image file is required");
//         }

//         if (file.getSize() > MAX_FILE_SIZE) {
//             throw new IllegalArgumentException("Image size must not exceed 2 MB");
//         }

//         String contentType = file.getContentType();

//         if (contentType == null || !contentType.startsWith("image/")) {
//             throw new IllegalArgumentException("Only image files are allowed");
//         }
//     }

//     public MediaResponse uploadImage(MultipartFile file, String sellerId) {
//         validateImage(file);
//         try {

//             @SuppressWarnings("unchecked")
//             Map<String, Object> result = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap("resource_type", "image"));

//             Media savedMedia = mediaRepository.save(Media.builder()
//                     .sellerId(sellerId)
//                     .url((String) result.get("secure_url"))
//                     .publicId((String) result.get("public_id"))
//                     .contentType(file.getContentType())
//                     .size(file.getSize())
//                     .createdAt(Instant.now())
//                     .build());

//             return MediaResponse.builder()
//                     .id(savedMedia.getId())
//                     .url(savedMedia.getUrl())
//                     .contentType(savedMedia.getContentType())
//                     .size(savedMedia.getSize())
//                     .createdAt(savedMedia.getCreatedAt())
//                     .build();

//         } catch (IOException e) {
//             throw new RuntimeException("Failed to upload image", e);
//         }
//     }

//     public MediaResponse getImageById(String id) {
//         Media media = mediaRepository.findById(id)
//                 .orElseThrow(() -> new IllegalArgumentException("Image not found with id: " + id));
//         return MediaResponse.builder()
//                 .id(media.getId())
//                 .url(media.getUrl())
//                 .contentType(media.getContentType())
//                 .size(media.getSize())
//                 .createdAt(media.getCreatedAt())
//                 .build();
//     }

// }