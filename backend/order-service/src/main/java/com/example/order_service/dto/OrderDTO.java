package com.example.order_service.dto;

import java.time.Instant;
import java.util.List;

import lombok.Data;
import lombok.NoArgsConstructor;

import com.example.order_service.entities.OrderItem;
import com.example.order_service.entities.OrderStatus;
import com.example.order_service.entities.StatusChange;

@Data
@NoArgsConstructor
public class OrderDTO {
    private String id;
    private String buyerId;
    private String sellerId;
    private OrderStatus status;
    private String paymentMethod;
    private String fullName;
    private String address;
    private String phone;
    private List<OrderItem> items;
    private double total;
    private List<StatusChange> statusHistory;
    private boolean hiddenByBuyer;
    private Instant createdAt;
}
