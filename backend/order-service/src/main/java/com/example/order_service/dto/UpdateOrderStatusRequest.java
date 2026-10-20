package com.example.order_service.dto;

import com.example.order_service.entities.OrderStatus;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateOrderStatusRequest {
    @NotNull(message = "Status is required")
    private OrderStatus status;
}
