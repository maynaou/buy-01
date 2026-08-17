package com.example.product_service.dto;


import com.example.product_service.enums.EventType;

import lombok.Data;

@Data
public class ProductConsumerDTO {
       private EventType eventType;
       private String productId;
       private String imagePath;
}
