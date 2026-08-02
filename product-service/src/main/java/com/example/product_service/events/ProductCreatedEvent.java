package com.example.product_service.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class ProductCreatedEvent {
    private String productId;
    private String name;
    private String description;
    private double price;
    private int quantity;
    private String userId;
}
