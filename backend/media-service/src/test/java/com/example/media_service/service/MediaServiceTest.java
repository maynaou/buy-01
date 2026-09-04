package com.example.media_service.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.IOException;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cloud.stream.function.StreamBridge;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.cloudinary.Cloudinary;
import com.cloudinary.Uploader;
import com.example.media_service.dto.MediaDTO;
import com.example.media_service.entities.Media;
import com.example.media_service.enums.MediaType;
import com.example.media_service.mapper.MediaMapper;
import com.example.media_service.repository.MediaRepository;
import com.example.media_service.repository.ProductReferenceRepository;

@ExtendWith(MockitoExtension.class)
class MediaServiceTest {

    @Mock 
    private MediaRepository mediaRepository;
    @Mock 
    private Cloudinary cloudinary;
    @Mock 
    private Uploader uploader;
    @Mock 
    private ProductReferenceRepository productReferenceRepository;
    @Mock 
    private StreamBridge streamBridge;
    @Mock 
    private MediaMapper mediaMapper;

    private MediaService mediaService;

    @BeforeEach
    void setUp() {
        mediaService = new MediaService(mediaRepository, cloudinary, productReferenceRepository,
                streamBridge, mediaMapper);
    }

    // ---------- uploadAvatar ----------

    @Test
    @DisplayName("uploadAvatar - nouvel avatar (aucun existant) → crée et sauvegarde")
    void uploadAvatar_NoExisting_ShouldCreateNew() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "imgUrl", "avatar.jpg", "image/jpeg", "fake-content".getBytes());

        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.upload(any(byte[].class), any(Map.class)))
                .thenReturn(Map.of("secure_url", "https://cloudinary.com/avatar.jpg"));

        when(mediaRepository.findByEntityIdAndMediaType("user-id-1", MediaType.AVATAR))
                .thenReturn(Optional.empty());

        Media savedMedia = new Media();
        savedMedia.setEntityId("user-id-1");
        savedMedia.setImagePath("https://cloudinary.com/avatar.jpg");
        when(mediaRepository.save(any(Media.class))).thenReturn(savedMedia);

        MediaDTO expectedDTO = new MediaDTO();
        expectedDTO.setImagePath("https://cloudinary.com/avatar.jpg");
        when(mediaMapper.fromMedia(savedMedia)).thenReturn(expectedDTO);

        MediaDTO result = mediaService.uploadAvatar(file, "user-id-1");

        assertThat(result.getImagePath()).isEqualTo("https://cloudinary.com/avatar.jpg");
        verify(mediaRepository, times(1)).save(any(Media.class));
        verify(streamBridge, times(1)).send(eq("mediaProducer-out-0"), any());
    }

    @Test
    @DisplayName("uploadAvatar - avatar déjà existant → met à jour l'entrée existante")
    void uploadAvatar_ExistingAvatar_ShouldUpdate() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "imgUrl", "avatar.jpg", "image/jpeg", "fake-content".getBytes());

        Media existingMedia = new Media();
        existingMedia.setEntityId("user-id-1");
        existingMedia.setImagePath("https://cloudinary.com/old.jpg");

        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.upload(any(byte[].class), any(Map.class)))
                .thenReturn(Map.of("secure_url", "https://cloudinary.com/new.jpg"));

        when(mediaRepository.findByEntityIdAndMediaType("user-id-1", MediaType.AVATAR))
                .thenReturn(Optional.of(existingMedia));
        when(mediaRepository.save(existingMedia)).thenReturn(existingMedia);
        when(mediaMapper.fromMedia(existingMedia)).thenReturn(new MediaDTO());

        mediaService.uploadAvatar(file, "user-id-1");

        assertThat(existingMedia.getImagePath()).isEqualTo("https://cloudinary.com/new.jpg");
        verify(mediaRepository, times(1)).save(existingMedia);
    }

    @Test
    @DisplayName("uploadAvatar - erreur Cloudinary (IOException) → lève ResponseStatusException 502")
    void uploadAvatar_CloudinaryFails_ShouldThrowBadGateway() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "imgUrl", "avatar.jpg", "image/jpeg", "fake-content".getBytes());

        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.upload(any(byte[].class), any(Map.class)))
                .thenThrow(new IOException("Cloudinary is down"));

        assertThatThrownBy(() -> mediaService.uploadAvatar(file, "user-id-1"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Failed to upload file");

        verify(mediaRepository, never()).save(any(Media.class));
    }
}