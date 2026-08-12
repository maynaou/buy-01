package com.example.media_service.events;

import lombok.Data;

@Data
public class MediaCreatedEvent {
       private String productId;
       private String imagePath;
}
