package com.example.order_service.web;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.order_service.dto.CheckoutRequest;
import com.example.order_service.dto.OrderDTO;
import com.example.order_service.dto.OrderSearchRequest;
import com.example.order_service.dto.UpdateOrderStatusRequest;
import com.example.order_service.service.OrderService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping("/checkout")
    @PreAuthorize("hasAuthority('ROLE_CLIENT')")
    public ResponseEntity<List<OrderDTO>> checkout(@Valid @RequestBody CheckoutRequest request,
                                                   Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.checkout(request, authentication.getName()));
    }

    @PostMapping("/my-orders")
    @PreAuthorize("hasAuthority('ROLE_CLIENT')")
    public ResponseEntity<List<OrderDTO>> getMyBuyerOrders(@Valid @RequestBody OrderSearchRequest filters, Authentication authentication) {
        return ResponseEntity.ok(orderService.getOrdersByBuyer(authentication.getName(), filters));
    }

    @PostMapping("/seller")
    @PreAuthorize("hasAuthority('ROLE_SELLER')")
    public ResponseEntity<List<OrderDTO>> getMyOrders(@Valid @RequestBody OrderSearchRequest filters,Authentication authentication) {
        return ResponseEntity.ok(orderService.getOrdersBySeller(authentication.getName(), filters));
    }

    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('ROLE_CLIENT') and @orderSecurity.isOrderOwnedByBuyer(#id, authentication.name)")
    public ResponseEntity<OrderDTO> cancelByBuyer(@PathVariable String id, Authentication authentication) {
        return ResponseEntity.ok(orderService.cancelOrderByBuyer(id, authentication.getName()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_CLIENT') and @orderSecurity.isOrderOwnedByBuyer(#id, authentication.name)")
    public ResponseEntity<Void> hideByBuyer(@PathVariable String id, Authentication authentication) {
        orderService.hideOrderByBuyer(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('ROLE_SELLER') and @orderSecurity.isOrderOwnedBySeller(#id, authentication.name)")
    public ResponseEntity<OrderDTO> updateStatus(@PathVariable String id, @Valid @RequestBody UpdateOrderStatusRequest request, 
                                                 Authentication authentication) {           
        return ResponseEntity.ok(orderService.updateOrderStatus(id, request.getStatus(), authentication.getName()));
    }




}