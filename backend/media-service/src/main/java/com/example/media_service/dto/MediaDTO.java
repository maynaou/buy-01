package com.example.media_service.dto;

import com.example.media_service.enums.MediaType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MediaDTO {
    private String imagePath;
    private String entityId;
    private MediaType mediaType;
}