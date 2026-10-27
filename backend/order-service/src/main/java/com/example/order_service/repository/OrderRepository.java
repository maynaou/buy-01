package com.example.order_service.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.order_service.entities.Order;

public interface OrderRepository extends MongoRepository<Order, String> {
    List<Order> findByBuyerIdAndHiddenByBuyerFalse(String buyerId);
    List<Order> findBySellerId(String sellerId);
}