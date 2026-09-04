package com.example.media_service.web;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import com.example.media_service.dto.MediaDTO;
import com.example.media_service.service.MediaService;

@RestController
@RequestMapping("/api/media")
public class MediaController {

    MediaService mediaService;

    public MediaController(MediaService mediaService) {
           this.mediaService = mediaService;
    }
    
    @PostMapping(value = "/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('ROLE_SELLER') and @mediaSecurity.isOwner(#productId,authentication.name)")
    public ResponseEntity<List<MediaDTO>> uploadImage(
            @RequestParam("imgUrl") MultipartFile[] imgUrls,
            @RequestParam("productId") String productId) {
         return ResponseEntity.status(HttpStatus.CREATED).body(mediaService.uploadImage(imgUrls, productId));
    }

    @PostMapping(value = "/avatar/{userId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('ROLE_SELLER') and #userId == authentication.name")
    public ResponseEntity<MediaDTO> uploadAvatar(@RequestParam("imgUrl") MultipartFile imgUrl , @PathVariable String userId) {
           return ResponseEntity.status(HttpStatus.CREATED).body(mediaService.uploadAvatar(imgUrl, userId));
    } 

} 
