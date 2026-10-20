package com.example.order_service.entities;

import java.time.Instant;

public record StatusChange(OrderStatus status, Instant changedAt, String changedBy) {}