package com.example.order_service.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartItemResponse {
    private String productId;
    private String productName;
    private String productDescription;
    private Double unitPrice;
    private Integer quantity;
    private Double subtotal;
    private Integer availableStock;
    private List<String> imagePaths;
}
