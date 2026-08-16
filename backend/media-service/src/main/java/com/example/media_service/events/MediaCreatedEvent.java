package com.example.media_service.events;

import com.example.media_service.enums.EventType;

import lombok.Data;

@Data
public class MediaCreatedEvent {
       private String productId;
       private String imagePath;
       private String userId;
       private EventType eventType;
}