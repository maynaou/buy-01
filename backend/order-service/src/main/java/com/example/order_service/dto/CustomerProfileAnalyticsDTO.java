package com.example.order_service.dto;

import java.util.List;

public record CustomerProfileAnalyticsDTO(
        double totalSpent,
        List<MostPurchasedProductDTO> mostBoughtProducts,
        List<PurchasedCategoryDTO> topCategories) {
}
