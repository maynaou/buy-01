package com.example.user_service.dto;

import com.example.user_service.enums.EventType;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;

@Data
public class UserConsumerAvatarDTO {
      private EventType eventType;
      @JsonProperty("entityId")
      private String userId;
      private String imagePath;
      private String mediaType;
}
