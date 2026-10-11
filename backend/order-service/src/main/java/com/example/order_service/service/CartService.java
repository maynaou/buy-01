package com.example.order_service.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.example.order_service.dto.CartRequest;
import com.example.order_service.dto.ProductResponse;
import com.example.order_service.entities.Cart;
import com.example.order_service.entities.CartItem;
import com.example.order_service.feign.ProductRestClient;
import com.example.order_service.repository.CartRepository;

@Service
public class CartService {
    

    private final CartRepository cartRepository;

    private final ProductRestClient productRestClient;
    
    public CartService(CartRepository cartRepository, ProductRestClient productRestClient) {
        this.cartRepository = cartRepository;
        this.productRestClient = productRestClient;
    }

public void addItemToCart(CartRequest cartRequest, String userId) {

    ProductResponse product = productRestClient
            .getProductById(cartRequest.getProductId());

    System.out.println("Product: " + product);

    if (product == null || product.id() == null) {
        throw new IllegalArgumentException("Product not found");
    }


    Cart cart = cartRepository.findByUserId(userId)
            .orElseGet(() -> Cart.builder()
                    .id(UUID.randomUUID().toString())
                    .userId(userId)
                    .items(new ArrayList<>())
                    .createdAt(Instant.now())
                    .build());

    if (cart.getItems() == null) {
        cart.setItems(new ArrayList<>());
    }

    CartItem existingItem = cart.getItems().stream()
            .filter(item -> item.getProductId()
                    .equals(cartRequest.getProductId()))
            .findFirst()
            .orElse(null);

    if (existingItem != null) {
        existingItem.setQuantity(
                existingItem.getQuantity() + cartRequest.getQuantity()
        );
    } else {
        CartItem newItem = CartItem.builder()
                .productId(cartRequest.getProductId())
                .quantity(cartRequest.getQuantity())
                .build();

        cart.getItems().add(newItem);
    }

    cart.setUpdatedAt(Instant.now());

    cartRepository.save(cart);
}


public Cart getCartByUserId(String userId) {
    return cartRepository.findByUserId(userId)
            .orElseThrow(() -> new IllegalArgumentException("Cart not found for user: " + userId));
}

public Cart updateCart(CartRequest cartRequest, String userId) {
    Cart cart = cartRepository.findByUserId(userId)
            .orElseThrow(() -> new IllegalArgumentException("Cart not found for user: " + userId));

    CartItem existingItem = cart.getItems().stream()
            .filter(item -> item.getProductId().equals(cartRequest.getProductId()))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Product not found in cart"));

    existingItem.setQuantity(cartRequest.getQuantity());
    cart.setUpdatedAt(Instant.now());

    cartRepository.save(cart);
    return cart;
}

public void removeItemFromCart(String productId, String userId) {
    Cart cart = cartRepository.findByUserId(userId)
            .orElseThrow(() -> new IllegalArgumentException("Cart not found for user: " + userId));

    CartItem existingItem = cart.getItems().stream()
            .filter(item -> item.getProductId().equals(productId))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Product not found in cart"));

    cart.getItems().remove(existingItem);
    cart.setUpdatedAt(Instant.now());

    cartRepository.save(cart);
}

}