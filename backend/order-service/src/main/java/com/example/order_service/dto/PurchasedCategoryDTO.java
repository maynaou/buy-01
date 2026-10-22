package com.example.order_service.dto;

public record PurchasedCategoryDTO(
        String category,
        long units,
        double amountSpent) {
}
