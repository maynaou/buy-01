package com.example.product_service.dto;

import java.util.List;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ProductDTO {
     @NotBlank(message = "Name is required")
     @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
     private String name;
     @NotBlank(message = "Description is required")
     @Size(min = 10, max = 500, message = "Description must be between 10 and 500 characters")
     private String description;
     @NotNull(message = "Price is required")
     @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
     @DecimalMax(value = "999999.99", message = "Price must be less than 999999.99")
     private Double price;
     @NotNull(message = "Quantity is required")
     @Min(value = 0, message = "Quantity cannot be negative")
     private Integer quantity;
     private List<MediaDTO> media;
}
