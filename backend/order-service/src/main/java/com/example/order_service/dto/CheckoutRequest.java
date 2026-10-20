package com.example.order_service.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CheckoutRequest {
    @NotBlank(message = "Full name is required")
    private String fullName;
    @NotBlank(message = "Address is required")
    private String address;
    @NotBlank(message = "Phone is required")
    private String phone;
}