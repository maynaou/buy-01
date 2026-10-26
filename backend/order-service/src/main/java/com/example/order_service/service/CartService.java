package com.example.order_service.service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.example.order_service.dto.CartItemResponse;
import com.example.order_service.dto.CartRequest;
import com.example.order_service.dto.CartResponse;
import com.example.order_service.dto.ProductResponse;
import com.example.order_service.entities.Cart;
import com.example.order_service.entities.CartItem;
import com.example.order_service.exception.CartNotFoundException;
import com.example.order_service.exception.ProductNotFoundException;
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

    public CartResponse addItemToCart(CartRequest cartRequest, String userId) {
        productRestClient.getProductById(cartRequest.getProductId())
                .orElseThrow(() -> new ProductNotFoundException("Product not found: " + cartRequest.getProductId()));

        Cart cart = cartRepository.findByUserId(userId)
                .orElseGet(() -> Cart.builder()
                        .id(UUID.randomUUID().toString())
                        .userId(userId)
                        .items(new ArrayList<>())
                        .build());

        if (cart.getItems() == null) {
            cart.setItems(new ArrayList<>());
        }

        CartItem existingItem = cart.getItems().stream()
                .filter(item -> item.getProductId().equals(cartRequest.getProductId()))
                .findFirst()
                .orElse(null);

        if (existingItem != null) {
            existingItem.setQuantity(existingItem.getQuantity() + cartRequest.getQuantity());
        } else {
            CartItem newItem = CartItem.builder()
                    .productId(cartRequest.getProductId())
                    .quantity(cartRequest.getQuantity())
                    .build();

            cart.getItems().add(newItem);
        }

        cartRepository.save(cart);
        return mapToCartResponse(cart);
    }

    public CartResponse getCartByUserId(String userId) {
        return cartRepository.findByUserId(userId)
                .map(this::mapToCartResponse)
                .orElseGet(() -> CartResponse.builder()
                        .userId(userId)
                        .items(new ArrayList<>())
                        .totalItems(0)
                        .subtotalPrice(0.0)
                        .shippingPrice(0.0)
                        .totalPrice(0.0)
                        .build());
    }

    public CartResponse updateCart(CartRequest cartRequest, String userId) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new CartNotFoundException("Cart not found for user: " + userId));

        CartItem existingItem = cart.getItems().stream()
                .filter(item -> item.getProductId().equals(cartRequest.getProductId()))
                .findFirst()
                .orElseThrow(() -> new ProductNotFoundException("Product not found in cart"));

        existingItem.setQuantity(cartRequest.getQuantity());

        cartRepository.save(cart);
        return mapToCartResponse(cart);
    }

    public CartResponse removeItemFromCart(String productId, String userId) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new CartNotFoundException("Cart not found for user: " + userId));

        CartItem existingItem = cart.getItems().stream()
                .filter(item -> item.getProductId().equals(productId))
                .findFirst()
                .orElseThrow(() -> new ProductNotFoundException("Product not found in cart"));

        cart.getItems().remove(existingItem);
        cartRepository.save(cart);

        return mapToCartResponse(cart);
    }

    public CartResponse clearCart(String userId) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new CartNotFoundException("Cart not found for user: " + userId));

        cart.getItems().clear();
        cartRepository.save(cart);

        return mapToCartResponse(cart);
    }

    public void removeProductFromAllCarts(String productId) {
        List<Cart> affectedCarts = cartRepository.findAll().stream()
                .filter(cart -> cart.getItems() != null
                        && cart.getItems().removeIf(item -> productId.equals(item.getProductId())))
                .toList();

        if (!affectedCarts.isEmpty()) {
            cartRepository.saveAll(affectedCarts);
        }
    }


    public CartResponse mapToCartResponse(Cart cart) {
        List<CartItemResponse> itemResponses = new ArrayList<>();
        double subtotalPrice = 0.0;
        int totalItems = 0;

        if (cart.getItems() != null) {
            for (CartItem item : cart.getItems()) {
                
                ProductResponse product = productRestClient.getProductById(item.getProductId()).orElseThrow(() -> new ProductNotFoundException("Product not found: " + item.getProductId()));


                    double unitPrice = product.price() != null ? product.price() : 0.0;
                    
                    double subtotal = Math.round(unitPrice * item.getQuantity() * 100.0) / 100.0;

                    subtotalPrice += subtotal;
                    totalItems += item.getQuantity();

                    itemResponses.add(CartItemResponse.builder()
                            .productId(product.id())
                            .productName(product.name())
                            .productDescription(product.description())
                            .unitPrice(unitPrice)
                            .quantity(item.getQuantity())
                            .subtotal(subtotal)
                            .availableStock(product.quantity())
                            .imagePaths(product.imagePaths())
                            .build());
            }
        }

        subtotalPrice = Math.round(subtotalPrice * 100.0) / 100.0;
        double shippingPrice = 0.0;
        double totalPrice = Math.round((subtotalPrice + shippingPrice) * 100.0) / 100.0;

        return CartResponse.builder()
                .id(cart.getId())
                .userId(cart.getUserId())
                .items(itemResponses)
                .totalItems(totalItems)
                .subtotalPrice(subtotalPrice)
                .shippingPrice(shippingPrice)
                .totalPrice(totalPrice)
                .build();
    }
}