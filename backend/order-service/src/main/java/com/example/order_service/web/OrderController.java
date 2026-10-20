package com.example.order_service.web;

import java.util.List;
import java.time.LocalDate;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.format.annotation.DateTimeFormat;

import com.example.order_service.dto.CheckoutRequest;
import com.example.order_service.dto.UpdateOrderStatusRequest;
import com.example.order_service.entities.Order;
import com.example.order_service.entities.OrderStatus;
import com.example.order_service.service.OrderService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    /** Client places an order from their cart. */
    @PostMapping("/checkout")
    @PreAuthorize("hasAuthority('ROLE_CLIENT')")
    public ResponseEntity<List<Order>> checkout(@Valid @RequestBody CheckoutRequest request,
                                                Authentication authentication) {
        List<Order> orders = orderService.checkout(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(orders);
    }

    /** Client retrieves all their orders (not hidden). */
    @GetMapping("/my-orders")
    @PreAuthorize("hasAuthority('ROLE_CLIENT')")
    public ResponseEntity<List<Order>> getMyBuyerOrders(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            Authentication authentication) {
        if (!isValidFilters(search, dateFrom, dateTo)) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(orderService.getOrdersByBuyer(
                authentication.getName(), search, status, dateFrom, dateTo));
    }

    /** Client cancels their pending order. */
    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('ROLE_CLIENT')")
    public ResponseEntity<Order> cancelByBuyer(@PathVariable String id,
                                               Authentication authentication) {
        Order updated = orderService.cancelOrderByBuyer(id, authentication.getName());
        return ResponseEntity.ok(updated);
    }

    /** Client removes delivered/cancelled order from their history view. */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_CLIENT')")
    public ResponseEntity<Void> hideByBuyer(@PathVariable String id,
                                            Authentication authentication) {
        orderService.hideOrderByBuyer(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    /** Seller retrieves all orders that contain their products. */
    @GetMapping("/seller")
    @PreAuthorize("hasAuthority('ROLE_SELLER')")
    public ResponseEntity<List<Order>> getMyOrders(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            Authentication authentication) {
        if (!isValidFilters(search, dateFrom, dateTo)) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(orderService.getOrdersBySeller(
                authentication.getName(), search, status, dateFrom, dateTo));
    }

    private boolean isValidFilters(String search, LocalDate dateFrom, LocalDate dateTo) {
        return (search == null || search.length() <= 100)
                && (dateFrom == null || dateTo == null || !dateFrom.isAfter(dateTo));
    }

    /** Seller updates order status (e.g. PENDING -> CONFIRMED -> SHIPPED -> DELIVERED, or CANCELLED). */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('ROLE_SELLER')")
    public ResponseEntity<Order> updateStatus(@PathVariable String id,
                                              @Valid @RequestBody UpdateOrderStatusRequest request,
                                              Authentication authentication) {
                                                System.out.println("Updating order status for order ID: " + id + " to status: " + request.getStatus() + " by user: " + authentication.getName());
        Order updated = orderService.updateOrderStatus(id, request.getStatus(), authentication.getName());
        return ResponseEntity.ok(updated);
    }
}