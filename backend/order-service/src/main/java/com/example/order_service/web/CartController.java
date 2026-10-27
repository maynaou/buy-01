package com.example.order_service.web;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.order_service.dto.CartRequest;
import com.example.order_service.dto.CartResponse;
import com.example.order_service.service.CartService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/orders")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }
    
    @PostMapping("/cart")
    @PreAuthorize("hasAuthority('ROLE_CLIENT')")
    public ResponseEntity<CartResponse> addItem(@Valid @RequestBody CartRequest cartRequest, Authentication authentication) {
        return ResponseEntity.ok(cartService.addItemToCart(cartRequest, authentication.getName()));
    }

    @GetMapping("/cart")
    @PreAuthorize("hasAuthority('ROLE_CLIENT')")
    public ResponseEntity<CartResponse> getCartByUserId(Authentication authentication) {
        System.out.println("User ID: " + authentication.getName()); // Debugging line
        return ResponseEntity.ok(cartService.getCartByUserId(authentication.getName()));
    }

    @PutMapping("/cart")
    @PreAuthorize("hasAuthority('ROLE_CLIENT')")
    public ResponseEntity<CartResponse> updateCart(@Valid @RequestBody CartRequest cartRequest, Authentication authentication) {
        return ResponseEntity.ok(cartService.updateCart(cartRequest, authentication.getName()));
    }

    @DeleteMapping("/cart/{productId}")
    @PreAuthorize("hasAuthority('ROLE_CLIENT')")
    public ResponseEntity<CartResponse> removeItemFromCart(@PathVariable String productId, Authentication authentication) {
        return ResponseEntity.ok(cartService.removeItemFromCart(productId, authentication.getName()));
    }

    @DeleteMapping("/cart/clear")
    @PreAuthorize("hasAuthority('ROLE_CLIENT')")
    public ResponseEntity<CartResponse> clearCart(Authentication authentication) {
        return ResponseEntity.ok(cartService.clearCart(authentication.getName()));
    }
    
}
