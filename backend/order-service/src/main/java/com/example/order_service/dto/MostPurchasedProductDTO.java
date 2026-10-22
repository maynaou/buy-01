package com.example.order_service.dto;

public record MostPurchasedProductDTO(
        String productId,
        String name,
        long units,
        double amountSpent) {
}
