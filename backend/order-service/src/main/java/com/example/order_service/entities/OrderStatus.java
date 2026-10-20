package com.example.order_service.entities;

public enum OrderStatus {
    PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED;

    public boolean canGoTo(OrderStatus next) {
        return switch (this) {
            case PENDING   -> next == CONFIRMED || next == CANCELLED;
            case CONFIRMED -> next == SHIPPED   || next == CANCELLED;
            case SHIPPED   -> next == DELIVERED || next == CANCELLED;
            default        -> false; // DELIVERED et CANCELLED sont terminés
        };
    }
}