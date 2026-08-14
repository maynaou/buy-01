package com.example.product_service.dto;

import lombok.Data;
import java.util.List;

@Data
public class ProductRequest {
     private String name;
     private String description;
     private Double price;
     private Integer quantity;
     private List<String> imageUrls;
}
