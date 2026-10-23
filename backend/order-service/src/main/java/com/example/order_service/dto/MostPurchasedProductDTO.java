package com.example.order_service.dto;

import lombok.Builder;
import lombok.Data;

@Builder 
public record MostPurchasedProductDTO(
        String productId,
        String name,
        long units,
        double amountSpent) {
}
