package com.example.media_service.dto;


import lombok.Data;

@Data
public class ProductDTO {
     private String id;
     private String name;
     private String description;
     private Double price;
     private Integer quantity;
     private String userId;
}
