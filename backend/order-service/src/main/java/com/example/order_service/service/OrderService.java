package com.example.order_service.service;

import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;

import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;

import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import com.example.order_service.dto.CheckoutRequest;

import com.example.order_service.dto.OrderDTO;
import com.example.order_service.dto.OrderSearchRequest;
import com.example.order_service.dto.ProductResponse;
import com.example.order_service.entities.*;
import com.example.order_service.exception.*;
import com.example.order_service.feign.ProductRestClient;
import com.example.order_service.mapper.OrderMapper;
import com.example.order_service.repository.CartRepository;
import com.example.order_service.repository.OrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import feign.FeignException;

@Service
public class OrderService {

    private record Line(ProductResponse product, int qty) {}


    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final ProductRestClient productRestClient;
    private final MongoTemplate mongoTemplate;
    private final OrderMapper orderMapper;

    public OrderService(OrderRepository orderRepository, CartRepository cartRepository,
            ProductRestClient productRestClient, MongoTemplate mongoTemplate, OrderMapper orderMapper) {
        this.orderRepository = orderRepository;
        this.cartRepository = cartRepository;
        this.productRestClient = productRestClient;
        this.mongoTemplate = mongoTemplate;
        this.orderMapper = orderMapper;
    }

    public List<OrderDTO> checkout(CheckoutRequest req, String buyerId) {

        Cart cart = cartRepository.findByUserId(buyerId).filter(c -> c.getItems() != null && !c.getItems().isEmpty())
                .orElseThrow(() -> new EmptyCartException("Cart is empty"));

        List<Line> lines = new ArrayList<>();
        for (CartItem item : cart.getItems()) {
            ProductResponse p = productRestClient.getProductById(item.getProductId())
                    .orElseThrow(() -> new ProductNotFoundException("Product not found: " + item.getProductId()));
            if (p.userId() == null) {
                throw new IllegalStateException("Product has no owner: " + p.id());
            }

            if (p.quantity() == null || p.quantity() < item.getQuantity()) {
                throw new InsufficientStockException("Not enough stock for " + p.name());
            }
            lines.add(new Line(p, item.getQuantity()));
        }

        List<Line> done = new ArrayList<>();
        try {
            for (Line l : lines) {
                productRestClient.decreaseStock(l.product().id(), l.qty());
                done.add(l);
            }
        } catch (RuntimeException e) {
            restoreStock(done);

            if (e instanceof FeignException.Conflict) {
                throw new InsufficientStockException(
                        "Stock changed during checkout, please retry");
            }

            throw e;
        }

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

        cart.getItems().clear();
        cartRepository.save(cart);

        return orderMapper.toDTOs(orders);
    }

    private void restoreStock(List<Line> lines) {
        for (Line l : lines) {
            try {
                productRestClient.increaseStock(l.product().id(), l.qty());
            } catch (RuntimeException ignored) {
                // à logger : si ça arrive, le stock est faux et il faut le corriger à la main
                log.error(
                        "Stock restoration failed for product {}. Quantity: {}. Manual correction may be required.",
                        l.product().id(),
                        l.qty(),
                        ignored);
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
                        ? null
                        : l.product().imagePaths().get(0))
                .category(l.product().category())
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

    public List<OrderDTO> getOrdersByBuyer(String buyerId, OrderSearchRequest filters) {
        return findOrders("buyerId", buyerId, filters, true);
    }

    public List<OrderDTO> getOrdersBySeller(String sellerId, OrderSearchRequest filters) {
        return findOrders("sellerId", sellerId, filters, false);
    }

    @SuppressWarnings("null")
    private List<OrderDTO> findOrders(String ownerField, String ownerId, OrderSearchRequest filters,
            boolean excludeHidden) {
        List<Criteria> criteriaList = new ArrayList<>();

        criteriaList.add(Criteria.where(ownerField).is(ownerId));
        if (excludeHidden) {
            criteriaList.add(Criteria.where("hiddenByBuyer").is(false));
        }
        if (filters.getStatus() != null) {
            criteriaList.add(Criteria.where("status").is(filters.getStatus().name()));
        }
        if (filters.getSearch() != null && !filters.getSearch().isBlank()) {
            String literalSearch = Pattern.quote(filters.getSearch().trim());
            Criteria searchCriteria = new Criteria().orOperator(
                    Criteria.where("id").regex(literalSearch, "i"),
                    Criteria.where("fullName").regex(literalSearch, "i"),
                    Criteria.where("items.productName").regex(literalSearch, "i"));
            criteriaList.add(searchCriteria);
        }
        if (filters.getDateFrom() != null || filters.getDateTo() != null) {
            Criteria dateCriteria = Criteria.where("createdAt");
            if (filters.getDateFrom() != null) {
                dateCriteria.gte(filters.getDateFrom().atStartOfDay().toInstant(ZoneOffset.UTC));
            }
            if (filters.getDateTo() != null) {
                dateCriteria.lt(filters.getDateTo().plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC));
            }
            criteriaList.add(dateCriteria);
        }

        Query query = Query.query(new Criteria().andOperator(criteriaList.toArray(Criteria[]::new)));
        query.with(Sort.by(Sort.Direction.DESC, "createdAt"));
        return orderMapper.toDTOs(mongoTemplate.find(query, Order.class));
    }

    public OrderDTO cancelOrderByBuyer(String orderId, String buyerId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException("Order not found: " + orderId));

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new InvalidOrderStateException("Only pending orders can be cancelled by the buyer");
        }

        for (OrderItem item : order.getItems()) {
            try {
                productRestClient.increaseStock(item.getProductId(), item.getQuantity());
            } catch (RuntimeException ignored) {
                log.error(
                        "Stock restoration failed for product {}. Quantity: {}. Manual correction may be required.",
                        item.getProductId(),
                        item.getQuantity(),
                        ignored);
            }
        }

        order.setStatus(OrderStatus.CANCELLED);
        order.getStatusHistory().add(new StatusChange(OrderStatus.CANCELLED, Instant.now(), buyerId));
        return orderMapper.toDTO(orderRepository.save(order));
    }


    public void hideOrderByBuyer(String orderId, String buyerId) {
        Order order = orderRepository.findById(orderId).orElseThrow(() -> new OrderNotFoundException("Order not found: " + orderId));

        if (order.getStatus() != OrderStatus.DELIVERED && order.getStatus() != OrderStatus.CANCELLED) {
            throw new InvalidOrderStateException("Only delivered or cancelled orders can be removed from history");
        }
        order.setHiddenByBuyer(true);
        orderRepository.save(order);
    }


    public OrderDTO updateOrderStatus(String orderId, OrderStatus nextStatus, String sellerId) {
        Order order = orderRepository.findById(orderId).orElseThrow(() -> new OrderNotFoundException("Order not found: " + orderId));

        if (!order.getStatus().canGoTo(nextStatus)) {
            throw new InvalidOrderStateException("Cannot transition status from " + order.getStatus() + " to " + nextStatus);
        }

        if (nextStatus == OrderStatus.CANCELLED) {
            for (OrderItem item : order.getItems()) {
                try {
                    productRestClient.increaseStock(item.getProductId(), item.getQuantity());
                } catch (RuntimeException ignored) {
                    log.error(
                            "Stock restoration failed for product {}. Quantity: {}. Manual correction may be required.",
                            item.getProductId(),
                            item.getQuantity(),
                            ignored);
                }
            }
        }

        order.setStatus(nextStatus);
        order.getStatusHistory().add(new StatusChange(nextStatus, Instant.now(), sellerId));
        return orderMapper.toDTO(orderRepository.save(order));
    }

}