package com.example.media_service.web;

import com.example.media_service.dto.MediaResponse;
import com.example.media_service.service.MediaService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/media/images")
@RequiredArgsConstructor
public class MediaController {

    private final MediaService mediaService;

    @PostMapping
    public MediaResponse uploadImage(@RequestParam("file") MultipartFile file, @RequestParam("sellerId") String userId, @RequestParam("productId") String productId) {
        return mediaService.uploadImage(file, userId, productId);
    }

    @GetMapping("/{id}")
    public MediaResponse getImageById(@PathVariable String id) {
        return mediaService.getImageById(id);
    }

    @DeleteMapping("/{id}")
    public void deleteImage(@PathVariable String id) {
        mediaService.deleteImage(id);
    }
}