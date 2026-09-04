package com.example.media_service.web;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.example.media_service.dto.MediaDTO;
import com.example.media_service.service.MediaService;

@ExtendWith(MockitoExtension.class)
class MediaControllerTest {

    private MockMvc mockMvc;

    @Mock
    private MediaService mediaService;

    @InjectMocks
    private MediaController mediaController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(mediaController).build();
    }

    @Test
    @DisplayName("POST /image - upload d'images produit → 201 avec liste de MediaDTO")
    void uploadImage_ShouldReturn201WithMediaList() throws Exception {
        MockMultipartFile file1 = new MockMultipartFile(
                "imgUrl", "photo1.jpg", "image/jpeg", "fake-image-content-1".getBytes());
        MockMultipartFile file2 = new MockMultipartFile(
                "imgUrl", "photo2.jpg", "image/jpeg", "fake-image-content-2".getBytes());

        MediaDTO mediaDTO1 = new MediaDTO();
        mediaDTO1.setImagePath("photo1.jpg");
        MediaDTO mediaDTO2 = new MediaDTO();
        mediaDTO2.setImagePath("photo2.jpg");

        when(mediaService.uploadImage(any(), eq("product-id-1")))
                .thenReturn(List.of(mediaDTO1, mediaDTO2));

        mockMvc.perform(multipart("/api/media/image")
                        .file(file1)
                        .file(file2)
                        .param("productId", "product-id-1"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$[0].imagePath").value("photo1.jpg"))
                .andExpect(jsonPath("$[1].imagePath").value("photo2.jpg"));

        verify(mediaService, times(1)).uploadImage(any(), eq("product-id-1"));
    }

    @Test
    @DisplayName("POST /avatar/{userId} - upload d'avatar → 201 avec MediaDTO")
    void uploadAvatar_ShouldReturn201WithMediaDTO() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "imgUrl", "avatar.jpg", "image/jpeg", "fake-avatar-content".getBytes());

        MediaDTO mediaDTO = new MediaDTO();
        mediaDTO.setImagePath("avatar.jpg");

        when(mediaService.uploadAvatar(any(), eq("user-id-1"))).thenReturn(mediaDTO);

        mockMvc.perform(multipart("/api/media/avatar/{userId}", "user-id-1")
                        .file(file))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.imagePath").value("avatar.jpg"));

        verify(mediaService, times(1)).uploadAvatar(any(), eq("user-id-1"));
    }
}