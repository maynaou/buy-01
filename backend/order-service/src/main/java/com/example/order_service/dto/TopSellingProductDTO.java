package com.example.order_service.dto;

public record TopSellingProductDTO(
        String productId,
        String name,
        long units,
        double revenue) {
}
