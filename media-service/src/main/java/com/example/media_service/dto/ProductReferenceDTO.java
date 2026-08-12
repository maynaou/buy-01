package com.example.media_service.dto;

import com.example.media_service.enums.EventType;

import lombok.Data;

@Data
public class ProductReferenceDTO {
     private EventType eventType;
     private String productId;
     private String userId;
}
