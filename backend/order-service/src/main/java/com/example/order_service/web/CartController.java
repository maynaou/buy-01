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
import com.example.order_service.entities.Cart;
import com.example.order_service.service.CartService;

@RestController
@RequestMapping("/api/orders")
public class CartController {

    private CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }
    
    @PostMapping("/cart")
    @PreAuthorize("hasAuthority('ROLE_CLIENT')")
    public ResponseEntity<String> addItem(@RequestBody CartRequest cartRequest , Authentication authentication) {
        cartService.addItemToCart(cartRequest, authentication.getName());
        return ResponseEntity.ok("Item added to cart");
    }

    @GetMapping("/cart")
    @PreAuthorize("hasAuthority('ROLE_CLIENT')")
    public ResponseEntity<Cart> getCartByUserId(Authentication authentication) {
        Cart cart = cartService.getCartByUserId(authentication.getName());
        return ResponseEntity.ok(cart);
    }

    @PutMapping("/cart")
    @PreAuthorize("hasAuthority('ROLE_CLIENT')")
    public ResponseEntity<Cart> updateCart(@RequestBody CartRequest cartRequest, Authentication authentication) {
        return ResponseEntity.ok(cartService.updateCart(cartRequest, authentication.getName()));
    }

    @DeleteMapping("/cart/{productId}")
    @PreAuthorize("hasAuthority('ROLE_CLIENT')")
    public ResponseEntity<Void> removeItemFromCart(@PathVariable String productId, Authentication authentication) {
        cartService.removeItemFromCart(productId, authentication.getName());
        return ResponseEntity.ok().build();
    }
    
}
