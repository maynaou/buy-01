package com.example.media_service.dto;


import lombok.Data;

@Data
public class ProductDTO {
    private String productId;
    private String name;
    private String description;
    private double price;
    private int quantity;
    private String userId;
}
