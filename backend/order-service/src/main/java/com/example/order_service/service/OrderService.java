package com.example.order_service.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import com.example.order_service.dto.CheckoutRequest;
import com.example.order_service.dto.ProductResponse;
import com.example.order_service.entities.*;
import com.example.order_service.exception.*;
import com.example.order_service.feign.ProductRestClient;
import com.example.order_service.repository.CartRepository;
import com.example.order_service.repository.OrderRepository;

import feign.FeignException;

@Service
public class OrderService {

    private record Line(ProductResponse product, int qty) {}

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final ProductRestClient productRestClient;
    private final MongoTemplate mongoTemplate;

    public OrderService(OrderRepository orderRepository, CartRepository cartRepository,
                        ProductRestClient productRestClient, MongoTemplate mongoTemplate) {
        this.orderRepository = orderRepository;
        this.cartRepository = cartRepository;
        this.productRestClient = productRestClient;
        this.mongoTemplate = mongoTemplate;
    }

    public List<Order> getOrdersBySeller(
            String sellerId, String search, OrderStatus status, LocalDate dateFrom, LocalDate dateTo) {
        return findOrders("sellerId", sellerId, search, status, dateFrom, dateTo, false);
    }

    public List<Order> getOrdersByBuyer(
            String buyerId, String search, OrderStatus status, LocalDate dateFrom, LocalDate dateTo) {
        return findOrders("buyerId", buyerId, search, status, dateFrom, dateTo, true);
    }

    @SuppressWarnings("null")
    private List<Order> findOrders(
            String ownerField, String ownerId, String search, OrderStatus status,
            LocalDate dateFrom, LocalDate dateTo, boolean excludeHidden) {
        List<Criteria> filters = new ArrayList<>();
        filters.add(Criteria.where(ownerField).is(ownerId));
        if (excludeHidden) {
            filters.add(Criteria.where("hiddenByBuyer").ne(true));
        }
        if (status != null) {
            filters.add(Criteria.where("status").is(status));
        }
        if (search != null && !search.isBlank()) {
            String literalSearch = java.util.regex.Pattern.quote(search.trim());
            Criteria searchCriteria = new Criteria().orOperator(
                    Criteria.where("id").regex(literalSearch, "i"),
                    Criteria.where("fullName").regex(literalSearch, "i"),
                    Criteria.where("items.productName").regex(literalSearch, "i"));
            filters.add(searchCriteria);
        }
        if (dateFrom != null || dateTo != null) {
            Criteria dateCriteria = Criteria.where("createdAt");
            if (dateFrom != null) {
                dateCriteria.gte(dateFrom.atStartOfDay().toInstant(ZoneOffset.UTC));
            }
            if (dateTo != null) {
                dateCriteria.lt(dateTo.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC));
            }
            filters.add(dateCriteria);
        }

        Query query = Query.query(new Criteria().andOperator(filters.toArray(Criteria[]::new)));
        query.with(Sort.by(Sort.Direction.DESC, "createdAt"));
        return mongoTemplate.find(query, Order.class);
    }

    public Order cancelOrderByBuyer(String orderId, String buyerId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException("Order not found: " + orderId));

        if (!order.getBuyerId().equals(buyerId)) {
            throw new org.springframework.security.access.AccessDeniedException("You are not allowed to cancel this order");
        }

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new IllegalStateException("Only pending orders can be cancelled by the buyer");
        }

        for (OrderItem item : order.getItems()) {
            try {
                productRestClient.increaseStock(item.getProductId(), item.getQuantity());
            } catch (RuntimeException ignored) {
            }
        }

        order.setStatus(OrderStatus.CANCELLED);
        if (order.getStatusHistory() == null) {
            order.setStatusHistory(new ArrayList<>());
        }
        order.getStatusHistory().add(new StatusChange(OrderStatus.CANCELLED, Instant.now(), buyerId));

        return orderRepository.save(order);
    }

    public void hideOrderByBuyer(String orderId, String buyerId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException("Order not found: " + orderId));

        if (!order.getBuyerId().equals(buyerId)) {
            throw new org.springframework.security.access.AccessDeniedException("You are not allowed to delete this order");
        }

        if (order.getStatus() != OrderStatus.DELIVERED && order.getStatus() != OrderStatus.CANCELLED) {
            throw new IllegalStateException("Only delivered or cancelled orders can be removed from history");
        }

        order.setHiddenByBuyer(true);
        orderRepository.save(order);
    }

    public Order updateOrderStatus(String orderId, OrderStatus nextStatus, String sellerId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException("Order not found: " + orderId));

        if (!order.getSellerId().equals(sellerId)) {
            throw new org.springframework.security.access.AccessDeniedException("You are not allowed to update this order");
        }

        if (!order.getStatus().canGoTo(nextStatus)) {
            throw new IllegalStateException("Cannot transition status from " + order.getStatus() + " to " + nextStatus);
        }

        if (nextStatus == OrderStatus.CANCELLED) {
            for (OrderItem item : order.getItems()) {
                try {
                    productRestClient.increaseStock(item.getProductId(), item.getQuantity());
                } catch (RuntimeException ignored) {
                }
            }
        }

        order.setStatus(nextStatus);
        if (order.getStatusHistory() == null) {
            order.setStatusHistory(new ArrayList<>());
        }
        order.getStatusHistory().add(new StatusChange(nextStatus, Instant.now(), sellerId));

        return orderRepository.save(order);
    }

    public List<Order> checkout(CheckoutRequest req, String buyerId) {

        // 1. le panier ne doit pas être vide
        Cart cart = cartRepository.findByUserId(buyerId)
                .filter(c -> c.getItems() != null && !c.getItems().isEmpty())
                .orElseThrow(() -> new EmptyCartException("Cart is empty"));

        // 2. relire chaque produit et vérifier (rien n'est encore modifié)
        List<Line> lines = new ArrayList<>();
        for (CartItem item : cart.getItems()) {
            ProductResponse p = productRestClient.getProductById(item.getProductId())
                    .orElseThrow(() -> new ProductNotFoundException(
                            "Product not found: " + item.getProductId()));
            // if (p.userId() == null) {
            //     throw new IllegalStateException("Product has no owner: " + p.id());
            // }
            if (p.quantity() == null || p.quantity() < item.getQuantity()) {
                throw new InsufficientStockException("Not enough stock for " + p.name());
            }
            lines.add(new Line(p, item.getQuantity()));
        }

        // 3. baisser le stock, en défaisant ce qui est déjà fait si une ligne échoue
        List<Line> done = new ArrayList<>();
        try {
            for (Line l : lines) {
                productRestClient.decreaseStock(l.product().id(), l.qty());
                done.add(l);
            }
        } catch (FeignException.Conflict e) {
            restoreStock(done);
            throw new InsufficientStockException("Stock changed during checkout, please retry");
        } catch (RuntimeException e) {
            restoreStock(done);
            throw e;
        }

        // 4. une commande par vendeur
        List<Order> orders;
        try {
            orders = lines.stream()
                    .collect(Collectors.groupingBy(l -> l.product().userId()))
                    .entrySet().stream()
                    .map(e -> buildOrder(buyerId, e.getKey(), e.getValue(), req))
                    .toList();
            orderRepository.saveAll(orders);
        } catch (RuntimeException e) {
            restoreStock(lines);
            throw e;
        }

        // 5. vider le panier en dernier
        cart.getItems().clear();
        cartRepository.save(cart);

        return orders;
    }

    private void restoreStock(List<Line> lines) {
        for (Line l : lines) {
            try {
                productRestClient.increaseStock(l.product().id(), l.qty());
            } catch (RuntimeException ignored) {
                // à logger : si ça arrive, le stock est faux et il faut le corriger à la main
            }
        }
    }

    private Order buildOrder(String buyerId, String sellerId, List<Line> lines,
                             CheckoutRequest req) {
        List<OrderItem> items = lines.stream().map(l -> OrderItem.builder()
                .productId(l.product().id())
                .productName(l.product().name())
                .unitPrice(l.product().price())
                .quantity(l.qty())
                .image(l.product().imagePaths() == null || l.product().imagePaths().isEmpty()
                        ? null : l.product().imagePaths().get(0))
                .build()).toList();

        double total = Math.round(items.stream()
                .mapToDouble(i -> i.getUnitPrice() * i.getQuantity()).sum() * 100.0) / 100.0;
        Instant now = Instant.now();

        return Order.builder()
                .id(UUID.randomUUID().toString())
                .buyerId(buyerId)
                .sellerId(sellerId)
                .status(OrderStatus.PENDING)
                .paymentMethod("PAY_ON_DELIVERY")
                .fullName(req.getFullName())
                .address(req.getAddress())
                .phone(req.getPhone())
                .items(items)
                .total(total)
                .statusHistory(new ArrayList<>(List.of(
                        new StatusChange(OrderStatus.PENDING, now, buyerId))))
                .hiddenByBuyer(false)
                .createdAt(now)
                .build();
    }
}