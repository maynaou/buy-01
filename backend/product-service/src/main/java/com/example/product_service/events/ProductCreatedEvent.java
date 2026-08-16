package com.example.product_service.events;

import com.example.product_service.enums.EventType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class ProductCreatedEvent {
    private EventType eventType;
    private String productId;
    private String userId;
}
