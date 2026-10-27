package com.example.order_service.dto;

import java.util.List;

public record ProductResponse(
    String id,
    String name,
    String description,
    Double price,
    Integer quantity,
    String userId,
    List<String> imagePaths,
    String category
) {}