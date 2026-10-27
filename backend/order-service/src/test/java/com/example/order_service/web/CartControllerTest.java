package com.example.order_service.web;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import com.example.order_service.dto.CartRequest;
import com.example.order_service.dto.CartResponse;
import com.example.order_service.service.CartService;

@ExtendWith(MockitoExtension.class)
class CartControllerTest {

    @Mock
    private CartService cartService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private CartController cartController;

    @Test
    void addItem_shouldReturnCartAndPassAuthenticatedUserToService() {
        // Arrange — Préparer les données et les dépendances
        CartRequest request = new CartRequest();
        request.setProductId("product-123");
        request.setQuantity(2);

        CartResponse expectedResponse = CartResponse.builder()
                .userId("client-123")
                .totalItems(2)
                .build();

        when(authentication.getName()).thenReturn("client-123");
        when(cartService.addItemToCart(request, "client-123")).thenReturn(expectedResponse);
        
        // Act — Exécuter la méthode qu'on veut tester
        ResponseEntity<CartResponse> response = cartController.addItem(request, authentication);
        

        // Assert — Vérifier le résultat et les interactions
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertSame(expectedResponse, response.getBody());
        verify(cartService).addItemToCart(request, "client-123");
    }

    @Test 
    void getCartByUserId_shouldReturnCartAndPassAuthenticationUserToService() {
        CartResponse expectedResponse = CartResponse.builder()
                                        .userId("client-123")
                                        .totalItems(2)
                                        .build();
        when(authentication.getName()).thenReturn("client-123");
        when(cartService.getCartByUserId("client-123")).thenReturn(expectedResponse);

        ResponseEntity<CartResponse> response = cartController.getCartByUserId(authentication);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertSame(expectedResponse, response.getBody());
        verify(cartService).getCartByUserId("client-123");
    }

    @Test
    void updateCart_shouldReturnCartAndPassAuthenticatedUserToService() {
        // Arrange — Préparer les données et les dépendances
        CartRequest request = new CartRequest();
        request.setProductId("product-123");
        request.setQuantity(2);

        CartResponse expectedResponse = CartResponse.builder()
                .userId("client-123")
                .totalItems(2)
                .build();

        when(authentication.getName()).thenReturn("client-123");
        when(cartService.updateCart(request, "client-123")).thenReturn(expectedResponse);
        
        // Act — Exécuter la méthode qu'on veut tester
        ResponseEntity<CartResponse> response = cartController.updateCart(request, authentication);
        

        // Assert — Vérifier le résultat et les interactions
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertSame(expectedResponse, response.getBody());
        verify(cartService).updateCart(request, "client-123");
    }

    @Test
    void removeItemFromCart_shouldReturnCartAndPassProductIdAndAuthenticatedUserToService() {
        String productId = "product-123";
        CartResponse expectedResponse = CartResponse.builder()
                .userId("client-123")
                .totalItems(1)
                .build();

        when(authentication.getName()).thenReturn("client-123");
        when(cartService.removeItemFromCart(productId, "client-123")).thenReturn(expectedResponse);

        ResponseEntity<CartResponse> response = cartController.removeItemFromCart(productId, authentication);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertSame(expectedResponse, response.getBody());
        verify(cartService).removeItemFromCart(productId, "client-123");
    }

    @Test
    void clearCart_shouldReturnCartAndPassAuthenticatedUserToService() {
        CartResponse expectedResponse = CartResponse.builder()
                .userId("client-123")
                .totalItems(0)
                .build();

        when(authentication.getName()).thenReturn("client-123");
        when(cartService.clearCart("client-123")).thenReturn(expectedResponse);

        ResponseEntity<CartResponse> response = cartController.clearCart(authentication);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertSame(expectedResponse, response.getBody());
        verify(cartService).clearCart("client-123");
    }
}
