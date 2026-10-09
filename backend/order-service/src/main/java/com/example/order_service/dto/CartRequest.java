package com.example.order_service.dto;

import lombok.Data;

@Data
public class CartRequest {
    private String productId;
    private Integer quantity;
}
