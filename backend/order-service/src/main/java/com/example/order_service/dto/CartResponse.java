package com.example.order_service.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartResponse {
    private String id;
    private String userId;
    private List<CartItemResponse> items;
    private Integer totalItems;
    private Double subtotalPrice;
    private Double shippingPrice;
    private Double totalPrice;
}
