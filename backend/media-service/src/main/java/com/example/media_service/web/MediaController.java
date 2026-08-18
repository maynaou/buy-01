package com.example.media_service.web;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import com.example.media_service.service.MediaService;

@RestController
@RequestMapping("/api/media")
public class MediaController {

    MediaService mediaService;

    public MediaController(MediaService mediaService) {
           this.mediaService = mediaService;
    }
    
    @PostMapping(value = "/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE) 
    public void uploadImage(
            @RequestParam("imgUrl") MultipartFile[] imgUrls, 
            @RequestParam("productId") String productId) {
         mediaService.uploadImage(imgUrls, productId);
    }

    @PostMapping(value = "/avatar/{userId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public void uplaodAvatar(@RequestParam("imgUrl") MultipartFile imgUrl , @PathVariable String userId) {
            mediaService.uploadAvatar(imgUrl, userId);
    } 

    @DeleteMapping("/{id}")
    public void deleteImage(@PathVariable String id) {
           mediaService.deleteImage(id);
    }

} 
