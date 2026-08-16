package com.example.product_service.entities;

import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.example.product_service.dto.MediaDTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document
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
     private List<MediaDTO> imagePaths;
}
