package com.example.media_service.events;


import com.example.media_service.enums.EventType;
import com.example.media_service.enums.MediaType;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class MediaCreatedEvent {
       private EventType eventType;
       private String entityId;
       private String imagePath;
       private MediaType mediaType;
}