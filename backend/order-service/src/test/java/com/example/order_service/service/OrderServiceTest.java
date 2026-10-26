package com.example.order_service.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.LocalDate;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;

import com.example.order_service.dto.CheckoutRequest;
import com.example.order_service.dto.OrderDTO;
import com.example.order_service.dto.OrderSearchRequest;
import com.example.order_service.dto.ProductResponse;
import com.example.order_service.entities.Cart;
import com.example.order_service.entities.CartItem;
import com.example.order_service.entities.Order;
import com.example.order_service.entities.OrderItem;
import com.example.order_service.entities.OrderStatus;
import com.example.order_service.entities.StatusChange;
import com.example.order_service.exception.EmptyCartException;
import com.example.order_service.exception.InsufficientStockException;
import com.example.order_service.exception.InvalidOrderStateException;
import com.example.order_service.exception.OrderNotFoundException;
import com.example.order_service.exception.ProductNotFoundException;
import com.example.order_service.feign.ProductRestClient;
import com.example.order_service.mapper.OrderMapper;
import com.example.order_service.repository.CartRepository;
import com.example.order_service.repository.OrderRepository;

import feign.FeignException;
import feign.Request;
import feign.Response;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class OrderServiceTest {

    private static final String BUYER_ID = "buyer-123";

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private CartRepository cartRepository;

    @Mock
    private ProductRestClient productRestClient;

    @Mock
    private MongoTemplate mongoTemplate;

    @Spy
    private OrderMapper orderMapper = new OrderMapper();

    @InjectMocks
    private OrderService orderService;

    private CheckoutRequest checkoutRequest;

    @BeforeEach
    void setUp() {
        checkoutRequest = new CheckoutRequest();
        checkoutRequest.setFullName("Client Test");
        checkoutRequest.setAddress("123 Main Street");
        checkoutRequest.setPhone("0612345678");
    }

    @Test
    void checkout_shouldCreateOneOrderPerSellerAndClearCart() {
        Cart cart = cart(
                item("product-1", 2),
                item("product-2", 1),
                item("product-3", 3));
        ProductResponse firstProduct = product("product-1", "Ball", 10.105, 8, "seller-1",
                List.of("ball.jpg"), "SPORT");
        ProductResponse secondProduct = product("product-2", "Shoes", 25.0, 4, "seller-2",
                List.of(), "SHOES");
        ProductResponse thirdProduct = product("product-3", "Bottle", 5.0, 10, "seller-1",
                null, "ACCESSORIES");
        when(cartRepository.findByUserId(BUYER_ID)).thenReturn(Optional.of(cart));
        when(productRestClient.getProductById("product-1")).thenReturn(Optional.of(firstProduct));
        when(productRestClient.getProductById("product-2")).thenReturn(Optional.of(secondProduct));
        when(productRestClient.getProductById("product-3")).thenReturn(Optional.of(thirdProduct));

        List<Order> savedOrders = new ArrayList<>();
        when(orderRepository.saveAll(any())).thenAnswer(invocation -> {
            savedOrders.addAll(invocation.getArgument(0));
            return savedOrders;
        });

        List<OrderDTO> result = orderService.checkout(checkoutRequest, BUYER_ID);

        assertEquals(2, result.size());
        Map<String, Order> ordersBySeller = savedOrders.stream()
                .collect(java.util.stream.Collectors.toMap(Order::getSellerId, order -> order));
        assertEquals(2, ordersBySeller.size());

        Order sellerOneOrder = ordersBySeller.get("seller-1");
        assertNotNull(sellerOneOrder);
        assertEquals(BUYER_ID, sellerOneOrder.getBuyerId());
        assertEquals(OrderStatus.PENDING, sellerOneOrder.getStatus());
        assertEquals("PAY_ON_DELIVERY", sellerOneOrder.getPaymentMethod());
        assertEquals("Client Test", sellerOneOrder.getFullName());
        assertEquals("123 Main Street", sellerOneOrder.getAddress());
        assertEquals("0612345678", sellerOneOrder.getPhone());
        assertEquals(35.21, sellerOneOrder.getTotal());
        assertEquals(2, sellerOneOrder.getItems().size());
        assertEquals("ball.jpg", sellerOneOrder.getItems().get(0).getImage());
        assertEquals(2, sellerOneOrder.getItems().get(0).getQuantity());
        assertEquals("SPORT", sellerOneOrder.getItems().get(0).getCategory());
        assertNull(sellerOneOrder.getItems().get(1).getImage());
        assertEquals(1, sellerOneOrder.getStatusHistory().size());
        assertEquals(BUYER_ID, sellerOneOrder.getStatusHistory().get(0).changedBy());
        assertFalse(sellerOneOrder.isHiddenByBuyer());
        assertNotNull(sellerOneOrder.getCreatedAt());

        Order sellerTwoOrder = ordersBySeller.get("seller-2");
        assertNotNull(sellerTwoOrder);
        assertEquals(25.0, sellerTwoOrder.getTotal());
        assertEquals(1, sellerTwoOrder.getItems().size());
        assertNull(sellerTwoOrder.getItems().get(0).getImage());
        assertEquals(List.of(), cart.getItems());
        verify(productRestClient).decreaseStock("product-1", 2);
        verify(productRestClient).decreaseStock("product-2", 1);
        verify(productRestClient).decreaseStock("product-3", 3);
        verify(cartRepository).save(cart);
    }

    @Test
    void checkout_shouldThrowWhenCartDoesNotExist() {
        when(cartRepository.findByUserId(BUYER_ID)).thenReturn(Optional.empty());

        assertThrows(EmptyCartException.class, () -> orderService.checkout(checkoutRequest, BUYER_ID));

        verifyNoInteractions(productRestClient, orderRepository);
    }

    @Test
    void checkout_shouldThrowWhenCartIsEmpty() {
        when(cartRepository.findByUserId(BUYER_ID)).thenReturn(Optional.of(cart()));

        assertThrows(EmptyCartException.class, () -> orderService.checkout(checkoutRequest, BUYER_ID));

        verifyNoInteractions(productRestClient, orderRepository);
    }

    @Test
    void checkout_shouldThrowWhenProductDoesNotExist() {
        Cart cart = cart(item("missing-product", 1));
        when(cartRepository.findByUserId(BUYER_ID)).thenReturn(Optional.of(cart));
        when(productRestClient.getProductById("missing-product")).thenReturn(Optional.empty());

        assertThrows(ProductNotFoundException.class,
                () -> orderService.checkout(checkoutRequest, BUYER_ID));

        verify(productRestClient, never()).decreaseStock(any(), org.mockito.ArgumentMatchers.anyInt());
        verifyNoInteractions(orderRepository);
    }

    @Test
    void checkout_shouldThrowWhenProductHasNoStockInformation() {
        Cart cart = cart(item("product-1", 1));
        when(cartRepository.findByUserId(BUYER_ID)).thenReturn(Optional.of(cart));
        when(productRestClient.getProductById("product-1"))
                .thenReturn(Optional.of(product("product-1", "Ball", 10.0, null, "seller-1", List.of(), "SPORT")));

        assertThrows(InsufficientStockException.class,
                () -> orderService.checkout(checkoutRequest, BUYER_ID));

        verify(productRestClient, never()).decreaseStock(any(), org.mockito.ArgumentMatchers.anyInt());
        verifyNoInteractions(orderRepository);
    }

    @Test
    void checkout_shouldThrowWhenProductHasInsufficientStock() {
        Cart cart = cart(item("product-1", 3));
        when(cartRepository.findByUserId(BUYER_ID)).thenReturn(Optional.of(cart));
        when(productRestClient.getProductById("product-1"))
                .thenReturn(Optional.of(product("product-1", "Ball", 10.0, 2, "seller-1", List.of(), "SPORT")));

        assertThrows(InsufficientStockException.class,
                () -> orderService.checkout(checkoutRequest, BUYER_ID));

        verify(productRestClient, never()).decreaseStock(any(), org.mockito.ArgumentMatchers.anyInt());
        verifyNoInteractions(orderRepository);
    }

    @Test
    void checkout_shouldRestorePreviouslyDecreasedStockWhenStockUpdateFails() {
        Cart cart = cart(item("product-1", 2), item("product-2", 1));
        when(cartRepository.findByUserId(BUYER_ID)).thenReturn(Optional.of(cart));
        when(productRestClient.getProductById("product-1"))
                .thenReturn(Optional.of(product("product-1", "Ball", 10.0, 5, "seller-1", List.of(), "SPORT")));
        when(productRestClient.getProductById("product-2"))
                .thenReturn(Optional.of(product("product-2", "Shoes", 20.0, 5, "seller-1", List.of(), "SHOES")));
        RuntimeException failure = new RuntimeException("stock service unavailable");
        doThrow(failure).when(productRestClient).decreaseStock("product-2", 1);

        RuntimeException thrown = assertThrows(RuntimeException.class,
                () -> orderService.checkout(checkoutRequest, BUYER_ID));

        assertEquals(failure, thrown);
        verify(productRestClient).increaseStock("product-1", 2);
        verify(productRestClient, never()).increaseStock("product-2", 1);
        verifyNoInteractions(orderRepository);
    }

    @Test
    void checkout_shouldTranslateStockConflictAndRestorePreviouslyDecreasedStock() {
        Cart cart = cart(item("product-1", 2), item("product-2", 1));
        when(cartRepository.findByUserId(BUYER_ID)).thenReturn(Optional.of(cart));
        when(productRestClient.getProductById("product-1"))
                .thenReturn(Optional.of(product("product-1", "Ball", 10.0, 5, "seller-1", List.of(), "SPORT")));
        when(productRestClient.getProductById("product-2"))
                .thenReturn(Optional.of(product("product-2", "Shoes", 20.0, 5, "seller-1", List.of(), "SHOES")));
        doThrow(conflictException()).when(productRestClient).decreaseStock("product-2", 1);

        InsufficientStockException thrown = assertThrows(InsufficientStockException.class,
                () -> orderService.checkout(checkoutRequest, BUYER_ID));

        assertEquals("Stock changed during checkout, please retry", thrown.getMessage());
        verify(productRestClient).increaseStock("product-1", 2);
        verifyNoInteractions(orderRepository);
    }

    @Test
    void checkout_shouldRestoreAllStockWhenSavingOrdersFails() {
        Cart cart = cart(item("product-1", 2), item("product-2", 1));
        when(cartRepository.findByUserId(BUYER_ID)).thenReturn(Optional.of(cart));
        when(productRestClient.getProductById("product-1"))
                .thenReturn(Optional.of(product("product-1", "Ball", 10.0, 5, "seller-1", List.of(), "SPORT")));
        when(productRestClient.getProductById("product-2"))
                .thenReturn(Optional.of(product("product-2", "Shoes", 20.0, 5, "seller-2", List.of(), "SHOES")));
        doThrow(new RuntimeException("database unavailable")).when(orderRepository).saveAll(any());

        assertThrows(RuntimeException.class, () -> orderService.checkout(checkoutRequest, BUYER_ID));

        verify(productRestClient).increaseStock("product-1", 2);
        verify(productRestClient).increaseStock("product-2", 1);
        assertEquals(2, cart.getItems().size());
        verify(cartRepository, never()).save(cart);
    }

    @Test
    void checkout_shouldReturnMappedOrdersAfterSaving() {
        Cart cart = cart(item("product-1", 1));
        when(cartRepository.findByUserId(BUYER_ID)).thenReturn(Optional.of(cart));
        when(productRestClient.getProductById("product-1"))
                .thenReturn(Optional.of(product("product-1", "Ball", 10.0, 5, "seller-1", List.of(), "SPORT")));
        List<OrderDTO> result = orderService.checkout(checkoutRequest, BUYER_ID);

        assertEquals(1, result.size());
        assertInstanceOf(OrderDTO.class, result.get(0));
        verify(orderRepository).saveAll(any());
    }

    @Test
    void getOrdersByBuyer_shouldFilterByBuyerAndExcludeHiddenOrders() {
        OrderSearchRequest filters = new OrderSearchRequest();
        Order expectedOrder = order("order-1", BUYER_ID, "seller-1", OrderStatus.PENDING);
        when(mongoTemplate.find(any(Query.class), org.mockito.ArgumentMatchers.eq(Order.class)))
                .thenReturn(List.of(expectedOrder));

        List<OrderDTO> result = orderService.getOrdersByBuyer(BUYER_ID, filters);

        assertEquals(1, result.size());
        assertEquals(expectedOrder.getId(), result.get(0).getId());
        Query query = captureOrderQuery();
        List<?> conditions = query.getQueryObject().getList("$and", Object.class);
        assertEquals(BUYER_ID, ((org.bson.Document) conditions.get(0)).get("buyerId"));
        assertEquals(false, ((org.bson.Document) conditions.get(1)).get("hiddenByBuyer"));
        assertEquals(-1, query.getSortObject().get("createdAt"));
    }

    @Test
    void getOrdersBySeller_shouldFilterBySellerWithoutBuyerVisibilityCondition() {
        OrderSearchRequest filters = new OrderSearchRequest();
        when(mongoTemplate.find(any(Query.class), org.mockito.ArgumentMatchers.eq(Order.class)))
                .thenReturn(List.of());

        List<OrderDTO> result = orderService.getOrdersBySeller("seller-1", filters);

        assertEquals(List.of(), result);
        Query query = captureOrderQuery();
        List<?> conditions = query.getQueryObject().getList("$and", Object.class);
        assertEquals(1, conditions.size());
        assertEquals("seller-1", ((org.bson.Document) conditions.get(0)).get("sellerId"));
    }

    @Test
    void getOrdersByBuyer_shouldApplyStatusSearchAndUtcDateFilters() {
        OrderSearchRequest filters = new OrderSearchRequest();
        filters.setStatus(OrderStatus.SHIPPED);
        filters.setSearch("  Ball.*  ");
        filters.setDateFrom(LocalDate.of(2026, 1, 10));
        filters.setDateTo(LocalDate.of(2026, 1, 12));
        when(mongoTemplate.find(any(Query.class), org.mockito.ArgumentMatchers.eq(Order.class)))
                .thenReturn(List.of());

        orderService.getOrdersByBuyer(BUYER_ID, filters);

        Query query = captureOrderQuery();
        List<?> conditions = query.getQueryObject().getList("$and", Object.class);
        org.bson.Document statusCondition = conditions.stream()
                .map(org.bson.Document.class::cast)
                .filter(condition -> condition.containsKey("status"))
                .findFirst()
                .orElseThrow();
        assertEquals(OrderStatus.SHIPPED.name(), statusCondition.get("status"));

        org.bson.Document searchCondition = conditions.stream()
                .map(org.bson.Document.class::cast)
                .filter(condition -> condition.containsKey("$or"))
                .findFirst()
                .orElseThrow();
        List<?> searchAlternatives = searchCondition.getList("$or", Object.class);
        assertEquals(3, searchAlternatives.size());
        assertTrue(searchAlternatives.stream()
                .map(org.bson.Document.class::cast)
                .allMatch(condition -> condition.values().stream()
                        .anyMatch(value -> value instanceof java.util.regex.Pattern pattern
                                && pattern.pattern().equals("\\QBall.*\\E")
                                && pattern.flags() == java.util.regex.Pattern.CASE_INSENSITIVE)));

        org.bson.Document dateCondition = conditions.stream()
                .map(org.bson.Document.class::cast)
                .filter(condition -> condition.containsKey("createdAt"))
                .findFirst()
                .orElseThrow();
        org.bson.Document dateRange = (org.bson.Document) dateCondition.get("createdAt");
        assertEquals(Instant.parse("2026-01-10T00:00:00Z"), dateRange.get("$gte"));
        assertEquals(Instant.parse("2026-01-13T00:00:00Z"), dateRange.get("$lt"));
    }

    @Test
    void cancelOrderByBuyer_shouldCancelPendingOrderRestoreStockAndRecordHistory() {
        Order order = order("order-1", BUYER_ID, "seller-1", OrderStatus.PENDING);
        when(orderRepository.findById("order-1")).thenReturn(Optional.of(order));
        when(orderRepository.save(order)).thenReturn(order);

        OrderDTO result = orderService.cancelOrderByBuyer("order-1", BUYER_ID);

        assertEquals(OrderStatus.CANCELLED, order.getStatus());
        assertEquals(2, order.getStatusHistory().size());
        StatusChange change = order.getStatusHistory().get(1);
        assertEquals(OrderStatus.CANCELLED, change.status());
        assertEquals(BUYER_ID, change.changedBy());
        assertNotNull(change.changedAt());
        assertEquals("order-1", result.getId());
        verify(productRestClient).increaseStock("product-1", 2);
        verify(orderRepository).save(order);
    }

    @Test
    void cancelOrderByBuyer_shouldStillCancelWhenStockRestorationFails() {
        Order order = order("order-1", BUYER_ID, "seller-1", OrderStatus.PENDING);
        when(orderRepository.findById("order-1")).thenReturn(Optional.of(order));
        when(orderRepository.save(order)).thenReturn(order);
        doThrow(new RuntimeException("product service unavailable"))
                .when(productRestClient).increaseStock("product-1", 2);

        OrderDTO result = orderService.cancelOrderByBuyer("order-1", BUYER_ID);

        assertEquals(OrderStatus.CANCELLED, order.getStatus());
        assertEquals("order-1", result.getId());
        verify(orderRepository).save(order);
    }

    @Test
    void cancelOrderByBuyer_shouldThrowWhenOrderDoesNotExist() {
        when(orderRepository.findById("missing-order")).thenReturn(Optional.empty());

        assertThrows(OrderNotFoundException.class,
                () -> orderService.cancelOrderByBuyer("missing-order", BUYER_ID));

        verifyNoInteractions(productRestClient);
        verify(orderRepository, never()).save(any());
    }

    @Test
    void cancelOrderByBuyer_shouldRejectNonPendingOrder() {
        Order order = order("order-1", BUYER_ID, "seller-1", OrderStatus.CONFIRMED);
        when(orderRepository.findById("order-1")).thenReturn(Optional.of(order));

        assertThrows(InvalidOrderStateException.class,
                () -> orderService.cancelOrderByBuyer("order-1", BUYER_ID));

        verifyNoInteractions(productRestClient);
        verify(orderRepository, never()).save(any());
    }

    @Test
    void hideOrderByBuyer_shouldHideDeliveredOrCancelledOrder() {
        for (OrderStatus status : List.of(OrderStatus.DELIVERED, OrderStatus.CANCELLED)) {
            Order order = order("order-" + status, BUYER_ID, "seller-1", status);
            when(orderRepository.findById(order.getId())).thenReturn(Optional.of(order));

            orderService.hideOrderByBuyer(order.getId(), BUYER_ID);

            assertEquals(true, order.isHiddenByBuyer());
            verify(orderRepository).save(order);
        }
    }

    @Test
    void hideOrderByBuyer_shouldRejectOrderThatIsNotDeliveredOrCancelled() {
        Order order = order("order-1", BUYER_ID, "seller-1", OrderStatus.SHIPPED);
        when(orderRepository.findById("order-1")).thenReturn(Optional.of(order));

        assertThrows(InvalidOrderStateException.class,
                () -> orderService.hideOrderByBuyer("order-1", BUYER_ID));

        assertFalse(order.isHiddenByBuyer());
        verify(orderRepository, never()).save(any());
    }

    @Test
    void hideOrderByBuyer_shouldThrowWhenOrderDoesNotExist() {
        when(orderRepository.findById("missing-order")).thenReturn(Optional.empty());

        assertThrows(OrderNotFoundException.class,
                () -> orderService.hideOrderByBuyer("missing-order", BUYER_ID));

        verify(orderRepository, never()).save(any());
    }

    @Test
    void updateOrderStatus_shouldUpdateValidTransitionAndRecordHistory() {
        Order order = order("order-1", BUYER_ID, "seller-1", OrderStatus.PENDING);
        when(orderRepository.findById("order-1")).thenReturn(Optional.of(order));
        when(orderRepository.save(order)).thenReturn(order);

        OrderDTO result = orderService.updateOrderStatus("order-1", OrderStatus.CONFIRMED, "seller-1");

        assertEquals(OrderStatus.CONFIRMED, order.getStatus());
        assertEquals(2, order.getStatusHistory().size());
        StatusChange change = order.getStatusHistory().get(1);
        assertEquals(OrderStatus.CONFIRMED, change.status());
        assertEquals("seller-1", change.changedBy());
        assertNotNull(change.changedAt());
        assertEquals("order-1", result.getId());
        verify(productRestClient, never()).increaseStock(any(), org.mockito.ArgumentMatchers.anyInt());
        verify(orderRepository).save(order);
    }

    @Test
    void updateOrderStatus_shouldRestoreStockWhenSellerCancelsOrder() {
        Order order = order("order-1", BUYER_ID, "seller-1", OrderStatus.CONFIRMED);
        when(orderRepository.findById("order-1")).thenReturn(Optional.of(order));
        when(orderRepository.save(order)).thenReturn(order);

        orderService.updateOrderStatus("order-1", OrderStatus.CANCELLED, "seller-1");

        assertEquals(OrderStatus.CANCELLED, order.getStatus());
        verify(productRestClient).increaseStock("product-1", 2);
        verify(orderRepository).save(order);
    }

    @Test
    void updateOrderStatus_shouldStillCancelWhenStockRestorationFails() {
        Order order = order("order-1", BUYER_ID, "seller-1", OrderStatus.SHIPPED);
        when(orderRepository.findById("order-1")).thenReturn(Optional.of(order));
        when(orderRepository.save(order)).thenReturn(order);
        doThrow(new RuntimeException("product service unavailable"))
                .when(productRestClient).increaseStock("product-1", 2);

        orderService.updateOrderStatus("order-1", OrderStatus.CANCELLED, "seller-1");

        assertEquals(OrderStatus.CANCELLED, order.getStatus());
        verify(orderRepository).save(order);
    }

    @Test
    void updateOrderStatus_shouldRejectInvalidTransition() {
        Order order = order("order-1", BUYER_ID, "seller-1", OrderStatus.DELIVERED);
        when(orderRepository.findById("order-1")).thenReturn(Optional.of(order));

        assertThrows(InvalidOrderStateException.class,
                () -> orderService.updateOrderStatus("order-1", OrderStatus.CANCELLED, "seller-1"));

        assertEquals(OrderStatus.DELIVERED, order.getStatus());
        verifyNoInteractions(productRestClient);
        verify(orderRepository, never()).save(any());
    }

    @Test
    void updateOrderStatus_shouldThrowWhenOrderDoesNotExist() {
        when(orderRepository.findById("missing-order")).thenReturn(Optional.empty());

        assertThrows(OrderNotFoundException.class,
                () -> orderService.updateOrderStatus("missing-order", OrderStatus.CONFIRMED, "seller-1"));

        verifyNoInteractions(productRestClient);
        verify(orderRepository, never()).save(any());
    }

    private Query captureOrderQuery() {
        ArgumentCaptor<Query> queryCaptor = ArgumentCaptor.forClass(Query.class);
        verify(mongoTemplate).find(queryCaptor.capture(), org.mockito.ArgumentMatchers.eq(Order.class));
        return queryCaptor.getValue();
    }

    private static Order order(String id, String buyerId, String sellerId, OrderStatus status) {
        return Order.builder()
                .id(id)
                .buyerId(buyerId)
                .sellerId(sellerId)
                .status(status)
                .items(List.of(OrderItem.builder()
                        .productId("product-1")
                        .productName("Ball")
                        .unitPrice(10.0)
                        .quantity(2)
                        .build()))
                .statusHistory(new ArrayList<>(List.of(new StatusChange(status, Instant.now(), buyerId))))
                .build();
    }

    private static Cart cart(CartItem... items) {
        return Cart.builder()
                .userId(BUYER_ID)
                .items(new ArrayList<>(List.of(items)))
                .build();
    }

    private static CartItem item(String productId, int quantity) {
        return CartItem.builder().productId(productId).quantity(quantity).build();
    }

    private static ProductResponse product(String id, String name, double price, Integer quantity,
            String sellerId, List<String> imagePaths, String category) {
        return new ProductResponse(id, name, name + " description", price, quantity, sellerId, imagePaths, category);
    }

    private static FeignException conflictException() {
        Request request = Request.create(
                Request.HttpMethod.POST,
                "/api/products/product-2/stock/decrease",
                Map.of(),
                null,
                StandardCharsets.UTF_8,
                null);
        Response response = Response.builder()
                .status(409)
                .reason("Conflict")
                .request(request)
                .headers(Map.of())
                .body(new byte[0])
                .build();
        return FeignException.errorStatus("decreaseStock", response);
    }
}
