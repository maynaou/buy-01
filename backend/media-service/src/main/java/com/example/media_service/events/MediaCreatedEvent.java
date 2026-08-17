package com.example.media_service.events;


import com.example.media_service.enums.EventType;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class MediaCreatedEvent {
       private EventType eventType;
       private String productId;
       private String imagePath;
       // private String userId;
}