package com.example.product_service.dto;

import lombok.Data;

@Data
public class ProductDTO {
     private String name;
     private String description;
     private Double price;
     private Integer quantity;
}
