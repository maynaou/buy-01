package com.example.media_service.entities;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.example.media_service.enums.MediaType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class Media {
    @Id
    private String id;
    private String imagePath;
    private String entityId; 
    private MediaType type;
}
