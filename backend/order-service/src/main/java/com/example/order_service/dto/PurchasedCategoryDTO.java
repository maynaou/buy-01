package com.example.order_service.dto;

import lombok.Builder;

@Builder 
public record PurchasedCategoryDTO(
        String category,
        long units,
        double amountSpent) {
}
