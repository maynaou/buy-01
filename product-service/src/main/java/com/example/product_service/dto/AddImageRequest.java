package com.example.product_service.dto;

import lombok.Data;
import java.util.List;

@Data
public class AddImageRequest {
    private List<String> imageUrls;
}