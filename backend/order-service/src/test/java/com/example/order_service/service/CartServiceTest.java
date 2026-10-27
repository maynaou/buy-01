package com.example.order_service.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.example.order_service.dto.CartRequest;
import com.example.order_service.dto.CartResponse;
import com.example.order_service.dto.ProductResponse;
import com.example.order_service.entities.Cart;
import com.example.order_service.entities.CartItem;
import com.example.order_service.exception.CartNotFoundException;
import com.example.order_service.exception.ProductNotFoundException;
import com.example.order_service.feign.ProductRestClient;
import com.example.order_service.repository.CartRepository;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class CartServiceTest {

    @Mock
    private CartRepository cartRepository;

    @Mock
    private ProductRestClient productRestClient;

    @InjectMocks
    private CartService cartService;

    @Test
    void addItemToCart_shouldCreateCartAndAddItemWhenCartDoesNotExist() {
        String productId = "product-123";
        String userId = "client-123";
        CartRequest request = new CartRequest();
        request.setProductId(productId);
        request.setQuantity(2);

        ProductResponse product = new ProductResponse(
                productId, "Ball", "Training ball", 12.50, 10, "seller-1", List.of("ball.jpg"), "BALLS");
        when(productRestClient.getProductById(productId)).thenReturn(Optional.of(product));
        when(cartRepository.findByUserId(userId)).thenReturn(Optional.empty());

        CartResponse response = cartService.addItemToCart(request, userId);

        ArgumentCaptor<Cart> cartCaptor = ArgumentCaptor.forClass(Cart.class);
        verify(cartRepository).save(cartCaptor.capture());
        Cart savedCart = cartCaptor.getValue();

        assertEquals(userId, savedCart.getUserId());
        assertEquals(1, savedCart.getItems().size());
        assertEquals(productId, savedCart.getItems().get(0).getProductId());
        assertEquals(2, savedCart.getItems().get(0).getQuantity());
        assertEquals(userId, response.getUserId());
        assertEquals(2, response.getTotalItems());
        assertEquals(25.0, response.getSubtotalPrice());
        verify(productRestClient, times(2)).getProductById(productId);
    }

    @Test
    void addItemToCart_shouldIncreaseQuantityWhenItemAlreadyExists() {
        String productId = "product-123";
        String userId = "client-123";
        CartRequest request = new CartRequest();
        request.setProductId(productId);
        request.setQuantity(3);

        Cart existingCart = Cart.builder()
                .id("cart-123")
                .userId(userId)
                .items(List.of(CartItem.builder().productId(productId).quantity(2).build()))
                .build();
        ProductResponse product = new ProductResponse(
                productId, "Ball", "Training ball", 10.0, 10, "seller-1", List.of(), "BALLS");
        when(productRestClient.getProductById(productId)).thenReturn(Optional.of(product));
        when(cartRepository.findByUserId(userId)).thenReturn(Optional.of(existingCart));

        CartResponse response = cartService.addItemToCart(request, userId);

        verify(cartRepository).save(existingCart);
        assertEquals(5, existingCart.getItems().get(0).getQuantity());
        assertEquals(5, response.getTotalItems());
        assertEquals(50.0, response.getSubtotalPrice());
    }

    @Test
    void addItemToCart_shouldThrowWhenProductDoesNotExist() {
        String productId = "missing-product";
        CartRequest request = new CartRequest();
        request.setProductId(productId);
        request.setQuantity(1);
        when(productRestClient.getProductById(productId)).thenReturn(Optional.empty());

        assertThrows(ProductNotFoundException.class, () -> cartService.addItemToCart(request, "client-123"));

        verify(cartRepository, never()).findByUserId("client-123");
        verify(cartRepository, never()).save(org.mockito.ArgumentMatchers.any(Cart.class));
    }

    @Test
    void mapToCartResponse_shouldMapItemsAndCalculateTotals() {
        Cart cart = Cart.builder()
                .id("cart-123")
                .userId("client-123")
                .items(List.of(
                        CartItem.builder().productId("product-1").quantity(3).build(),
                        CartItem.builder().productId("product-2").quantity(1).build()))
                .build();
        ProductResponse firstProduct = new ProductResponse(
                "product-1", "Ball", "Training ball", 10.106, 8, "seller-1", List.of("ball.jpg"), "BALLS");
        ProductResponse secondProduct = new ProductResponse(
                "product-2", "Shoes", "Running shoes", 25.0, 4, "seller-2", List.of("shoes.jpg"), "SHOES");
        when(productRestClient.getProductById("product-1")).thenReturn(Optional.of(firstProduct));
        when(productRestClient.getProductById("product-2")).thenReturn(Optional.of(secondProduct));

        CartResponse response = cartService.mapToCartResponse(cart);

        assertEquals("cart-123", response.getId());
        assertEquals("client-123", response.getUserId());
        assertEquals(2, response.getItems().size());
        assertEquals("Ball", response.getItems().get(0).getProductName());
        assertEquals(30.32, response.getItems().get(0).getSubtotal());
        assertEquals(25.0, response.getItems().get(1).getSubtotal());
        assertEquals(4, response.getTotalItems());
        assertEquals(55.32, response.getSubtotalPrice());
        assertEquals(0.0, response.getShippingPrice());
        assertEquals(55.32, response.getTotalPrice());
    }

    @Test
    void getCartByUserId_shouldReturnMappedCartWhenCartExists() {
        String userId = "client-123";
        Cart cart = Cart.builder()
                .id("cart-123")
                .userId(userId)
                .items(List.of(CartItem.builder().productId("product-1").quantity(2).build()))
                .build();
        ProductResponse product = new ProductResponse(
                "product-1", "Ball", "Training ball", 15.0, 8, "seller-1", List.of(), "BALLS");
        when(cartRepository.findByUserId(userId)).thenReturn(Optional.of(cart));
        when(productRestClient.getProductById("product-1")).thenReturn(Optional.of(product));

        CartResponse response = cartService.getCartByUserId(userId);

        assertEquals("cart-123", response.getId());
        assertEquals(userId, response.getUserId());
        assertEquals(2, response.getTotalItems());
        assertEquals(30.0, response.getSubtotalPrice());
        verify(cartRepository).findByUserId(userId);
    }

    @Test
    void getCartByUserId_shouldReturnEmptyCartWhenCartDoesNotExist() {
        String userId = "client-123";
        when(cartRepository.findByUserId(userId)).thenReturn(Optional.empty());

        CartResponse response = cartService.getCartByUserId(userId);

        assertEquals(userId, response.getUserId());
        assertEquals(List.of(), response.getItems());
        assertEquals(0, response.getTotalItems());
        assertEquals(0.0, response.getSubtotalPrice());
        assertEquals(0.0, response.getShippingPrice());
        assertEquals(0.0, response.getTotalPrice());
        verify(productRestClient, never()).getProductById(org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    void updateCart_shouldChangeItemQuantityAndSaveCart() {
        String userId = "client-123";
        String productId = "product-1";
        CartItem item = CartItem.builder().productId(productId).quantity(2).build();
        Cart cart = Cart.builder()
                .id("cart-123")
                .userId(userId)
                .items(new ArrayList<>(List.of(item)))
                .build();
        CartRequest request = new CartRequest();
        request.setProductId(productId);
        request.setQuantity(4);
        ProductResponse product = new ProductResponse(
                productId, "Ball", "Training ball", 15.0, 8, "seller-1", List.of(), "BALLS");
        when(cartRepository.findByUserId(userId)).thenReturn(Optional.of(cart));
        when(productRestClient.getProductById(productId)).thenReturn(Optional.of(product));

        CartResponse response = cartService.updateCart(request, userId);

        assertEquals(4, item.getQuantity());
        assertEquals(4, response.getTotalItems());
        assertEquals(60.0, response.getSubtotalPrice());
        verify(cartRepository).save(cart);
    }

    @Test
    void updateCart_shouldThrowWhenCartDoesNotExist() {
        String userId = "client-123";
        when(cartRepository.findByUserId(userId)).thenReturn(Optional.empty());
        CartRequest request = new CartRequest();
        request.setProductId("product-1");
        request.setQuantity(4);

        assertThrows(CartNotFoundException.class, () -> cartService.updateCart(request, userId));

        verify(cartRepository, never()).save(org.mockito.ArgumentMatchers.any(Cart.class));
    }

    @Test
    void updateCart_shouldThrowWhenProductIsNotInCart() {
        String userId = "client-123";
        Cart cart = Cart.builder()
                .id("cart-123")
                .userId(userId)
                .items(new ArrayList<>())
                .build();
        when(cartRepository.findByUserId(userId)).thenReturn(Optional.of(cart));
        CartRequest request = new CartRequest();
        request.setProductId("product-1");
        request.setQuantity(4);

        assertThrows(ProductNotFoundException.class, () -> cartService.updateCart(request, userId));

        verify(cartRepository, never()).save(org.mockito.ArgumentMatchers.any(Cart.class));
    }

    @Test
    void removeItemFromCart_shouldRemoveItemAndSaveCart() {
        String userId = "client-123";
        String productId = "product-1";
        CartItem itemToRemove = CartItem.builder().productId(productId).quantity(2).build();
        Cart cart = Cart.builder()
                .id("cart-123")
                .userId(userId)
                .items(new ArrayList<>(List.of(
                        itemToRemove,
                        CartItem.builder().productId("product-2").quantity(1).build())))
                .build();
        ProductResponse remainingProduct = new ProductResponse(
                "product-2", "Shoes", "Running shoes", 25.0, 4, "seller-2", List.of(), "SHOES");
        when(cartRepository.findByUserId(userId)).thenReturn(Optional.of(cart));
        when(productRestClient.getProductById("product-2")).thenReturn(Optional.of(remainingProduct));

        CartResponse response = cartService.removeItemFromCart(productId, userId);

        assertEquals(1, cart.getItems().size());
        assertEquals("product-2", cart.getItems().get(0).getProductId());
        assertEquals(1, response.getTotalItems());
        assertEquals(25.0, response.getSubtotalPrice());
        verify(cartRepository).save(cart);
    }

    @Test
    void removeItemFromCart_shouldThrowWhenCartDoesNotExist() {
        String userId = "client-123";
        when(cartRepository.findByUserId(userId)).thenReturn(Optional.empty());

        assertThrows(CartNotFoundException.class,
                () -> cartService.removeItemFromCart("product-1", userId));

        verify(cartRepository, never()).save(org.mockito.ArgumentMatchers.any(Cart.class));
    }

    @Test
    void removeItemFromCart_shouldThrowWhenProductIsNotInCart() {
        String userId = "client-123";
        Cart cart = Cart.builder()
                .id("cart-123")
                .userId(userId)
                .items(new ArrayList<>())
                .build();
        when(cartRepository.findByUserId(userId)).thenReturn(Optional.of(cart));

        assertThrows(ProductNotFoundException.class,
                () -> cartService.removeItemFromCart("product-1", userId));

        verify(cartRepository, never()).save(org.mockito.ArgumentMatchers.any(Cart.class));
    }

    @Test
    void clearCart_shouldRemoveAllItemsAndSaveCart() {
        String userId = "client-123";
        Cart cart = Cart.builder()
                .id("cart-123")
                .userId(userId)
                .items(new ArrayList<>(List.of(
                        CartItem.builder().productId("product-1").quantity(2).build(),
                        CartItem.builder().productId("product-2").quantity(1).build())))
                .build();
        when(cartRepository.findByUserId(userId)).thenReturn(Optional.of(cart));

        CartResponse response = cartService.clearCart(userId);

        assertEquals(List.of(), cart.getItems());
        assertEquals(userId, response.getUserId());
        assertEquals(0, response.getTotalItems());
        assertEquals(0.0, response.getSubtotalPrice());
        verify(cartRepository).save(cart);
        verify(productRestClient, never()).getProductById(org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    void clearCart_shouldThrowWhenCartDoesNotExist() {
        String userId = "client-123";
        when(cartRepository.findByUserId(userId)).thenReturn(Optional.empty());

        assertThrows(CartNotFoundException.class, () -> cartService.clearCart(userId));

        verify(cartRepository, never()).save(org.mockito.ArgumentMatchers.any(Cart.class));
    }
}
