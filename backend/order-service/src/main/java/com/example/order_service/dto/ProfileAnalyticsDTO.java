package com.example.order_service.dto;

import java.util.List;
import lombok.Builder;

@Builder 
public record ProfileAnalyticsDTO(
        double totalSpent,
        List<MostPurchasedProductDTO> mostBoughtProducts,
        List<PurchasedCategoryDTO> topCategories) {
}
