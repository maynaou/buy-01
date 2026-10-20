package com.example.order_service.entities;

import java.time.Instant;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "orders")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Order {
    @Id
    private String id;

    @Indexed
    private String buyerId;
    @Indexed
    private String sellerId;
    @Indexed
    private OrderStatus status;

    private String paymentMethod;   // "PAY_ON_DELIVERY"
    private String fullName;
    private String address;
    private String phone;

    private List<OrderItem> items;
    private double total;
    private List<StatusChange> statusHistory;

    private boolean hiddenByBuyer;  // pour "supprimer" sans casser les revenus du vendeur
    private Instant createdAt;
}