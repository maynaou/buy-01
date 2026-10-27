package com.example.order_service.dto;

import com.example.order_service.enums.ProductEventType;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductEventDTO {
    private ProductEventType eventType;
    private String productId;
    private String userId;
}
