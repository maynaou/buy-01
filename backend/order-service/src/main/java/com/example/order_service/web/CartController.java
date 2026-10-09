package com.example.order_service.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
public class CartController {
    
    @PostMapping("/cart/Items")
    public ResponseEntity<String> addItem(@RequestBody CartRequest cartRequest) {
        System.out.println("Received request to add item to cart: " + cartRequest);
        return ResponseEntity.ok("Item added to cart");
    }

    @GetMapping("/cart")
    public String getCart() {
        return "Cart details";
    }
    
}
