package com.example.product_service.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class Product {
     @Id
     private String id;
     private String name;
     private String description;
     private Double price;
     private Integer quantity;
     private String userId;
}
