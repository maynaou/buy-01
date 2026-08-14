package com.example.product_service.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {
    private String id;
    private String name;
    private String description;
    private Double price;
    private Integer quantity;
    private String sellerId;
    private List<String> imageUrls;
}