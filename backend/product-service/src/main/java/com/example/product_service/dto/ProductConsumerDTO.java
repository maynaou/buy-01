package com.example.product_service.dto;


import com.example.product_service.enums.EventType;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;

@Data
public class ProductConsumerDTO {
       private EventType eventType;
       @JsonProperty("entityId")
       private String productId;
       private String imagePath;
       private String mediaType;
}
