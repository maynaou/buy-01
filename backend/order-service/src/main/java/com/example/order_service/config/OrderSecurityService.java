package com.example.order_service.config;

import org.springframework.stereotype.Service;

import com.example.order_service.repository.OrderRepository;

@Service("orderSecurity")
@SuppressWarnings("null")
public class OrderSecurityService {
     
    OrderRepository orderRepository;

    public OrderSecurityService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    public boolean isOrderOwnedByBuyer(String orderId, String currentId) {
        return orderRepository.findById(orderId).map(order -> order.getBuyerId().equals(currentId)).orElse(false);
    }

    public boolean isOrderOwnedBySeller(String orderId, String currentId) {
        return orderRepository.findById(orderId).map(order -> order.getSellerId().equals(currentId)).orElse(false);
    }

}
