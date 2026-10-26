package com.example.order_service.web;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import com.example.order_service.dto.CheckoutRequest;
import com.example.order_service.dto.OrderDTO;
import com.example.order_service.dto.OrderSearchRequest;
import com.example.order_service.dto.UpdateOrderStatusRequest;
import com.example.order_service.entities.OrderStatus;
import com.example.order_service.service.OrderService;

@ExtendWith(MockitoExtension.class)
class OrderControllerTest {

    @Mock
    private OrderService orderService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private OrderController orderController;

    @Test
    void checkout_shouldReturnCreatedOrdersAndPassAuthenticatedBuyerToService() {
        CheckoutRequest request = new CheckoutRequest();
        request.setFullName("Client Test");
        request.setAddress("123 Main Street");
        request.setPhone("0612345678");

        OrderDTO order = new OrderDTO();
        order.setId("order-123");
        order.setBuyerId("client-123");
        List<OrderDTO> expectedOrders = List.of(order);

        when(authentication.getName()).thenReturn("client-123");
        when(orderService.checkout(request, "client-123")).thenReturn(expectedOrders);

        ResponseEntity<List<OrderDTO>> response = orderController.checkout(request, authentication);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertSame(expectedOrders, response.getBody());
        verify(orderService).checkout(request, "client-123");
    }

    @Test
    void getMyBuyerOrders_shouldReturnOrdersAndPassAuthenticatedBuyerAndFiltersToService() {
        OrderSearchRequest filters = new OrderSearchRequest();
        List<OrderDTO> expectedOrders = List.of(new OrderDTO());
        when(authentication.getName()).thenReturn("client-123");
        when(orderService.getOrdersByBuyer("client-123", filters)).thenReturn(expectedOrders);

        ResponseEntity<List<OrderDTO>> response = orderController.getMyBuyerOrders(filters, authentication);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertSame(expectedOrders, response.getBody());
        verify(orderService).getOrdersByBuyer("client-123", filters);
    }

    @Test
    void getMyOrders_shouldReturnOrdersAndPassAuthenticatedSellerAndFiltersToService() {
        OrderSearchRequest filters = new OrderSearchRequest();
        List<OrderDTO> expectedOrders = List.of(new OrderDTO());
        when(authentication.getName()).thenReturn("seller-123");
        when(orderService.getOrdersBySeller("seller-123", filters)).thenReturn(expectedOrders);

        ResponseEntity<List<OrderDTO>> response = orderController.getMyOrders(filters, authentication);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertSame(expectedOrders, response.getBody());
        verify(orderService).getOrdersBySeller("seller-123", filters);
    }

    @Test
    void cancelByBuyer_shouldReturnCancelledOrderAndPassOrderIdAndBuyerToService() {
        String orderId = "order-123";
        OrderDTO expectedOrder = new OrderDTO();
        expectedOrder.setId(orderId);
        when(authentication.getName()).thenReturn("client-123");
        when(orderService.cancelOrderByBuyer(orderId, "client-123")).thenReturn(expectedOrder);

        ResponseEntity<OrderDTO> response = orderController.cancelByBuyer(orderId, authentication);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertSame(expectedOrder, response.getBody());
        verify(orderService).cancelOrderByBuyer(orderId, "client-123");
    }

    @Test
    void hideByBuyer_shouldReturnNoContentAndPassOrderIdAndBuyerToService() {
        String orderId = "order-123";
        when(authentication.getName()).thenReturn("client-123");

        ResponseEntity<Void> response = orderController.hideByBuyer(orderId, authentication);

        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        assertNull(response.getBody());
        verify(orderService).hideOrderByBuyer(orderId, "client-123");
    }

    @Test
    void updateStatus_shouldReturnUpdatedOrderAndPassStatusAndSellerToService() {
        String orderId = "order-123";
        UpdateOrderStatusRequest request = new UpdateOrderStatusRequest(OrderStatus.SHIPPED);
        OrderDTO expectedOrder = new OrderDTO();
        expectedOrder.setId(orderId);
        expectedOrder.setStatus(OrderStatus.SHIPPED);
        when(authentication.getName()).thenReturn("seller-123");
        when(orderService.updateOrderStatus(orderId, OrderStatus.SHIPPED, "seller-123"))
                .thenReturn(expectedOrder);

        ResponseEntity<OrderDTO> response = orderController.updateStatus(orderId, request, authentication);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertSame(expectedOrder, response.getBody());
        verify(orderService).updateOrderStatus(orderId, OrderStatus.SHIPPED, "seller-123");
    }
}
