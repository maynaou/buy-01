package com.example.order_service.service;


import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.ArithmeticOperators;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import com.example.order_service.dto.CustomerProfileAnalyticsDTO;
import com.example.order_service.dto.MostPurchasedProductDTO;
import com.example.order_service.dto.PurchasedCategoryDTO;
import com.example.order_service.dto.TopSellingProductDTO;
import com.example.order_service.entities.*;


@Service 
public class AnalyseService {
    // This class is currently empty and can be implemented with analysis-related methods in the future.

    private record ProductKey(String id, String name) {}

    private record PurchaseTotals(long units, double amountSpent) {
        private PurchaseTotals add(long quantity, double amount) {
            return new PurchaseTotals(units + quantity, amountSpent + amount);
        }
    }

    private final MongoTemplate mongoTemplate;

    public AnalyseService(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

     @SuppressWarnings("null")
    public List<TopSellingProductDTO> getTopSellingProductsBySeller(String sellerId) {
        Aggregation aggregation = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("sellerId").is(sellerId)
                        .and("status").is(OrderStatus.DELIVERED.name())),
                Aggregation.unwind("items"),
                Aggregation.group("items.productId", "items.productName")
                        .sum("items.quantity").as("units")
                        .sum(ArithmeticOperators.Multiply.valueOf("items.unitPrice")
                                .multiplyBy("items.quantity"))
                        .as("revenue"),
                Aggregation.project("units", "revenue")
                        .and("_id.productId").as("productId")
                        .and("_id.productName").as("name")
                        .andExclude("_id"),
                Aggregation.sort(Sort.Direction.DESC, "units", "revenue"),
                Aggregation.limit(5));

        return mongoTemplate.aggregate(aggregation, Order.class, TopSellingProductDTO.class)
                .getMappedResults();
    }

    public CustomerProfileAnalyticsDTO getBuyerAnalytics(String buyerId) {
        Query query = Query.query(Criteria.where("buyerId").is(buyerId)
                .and("status").is(OrderStatus.DELIVERED.name()));
        query.fields()
                .include("total")
                .include("items.productId")
                .include("items.productName")
                .include("items.unitPrice")
                .include("items.quantity")
                .include("items.category");

        List<Order> deliveredOrders = mongoTemplate.find(query, Order.class);
        Map<ProductKey, PurchaseTotals> products = new HashMap<>();
        Map<String, PurchaseTotals> categories = new HashMap<>();
        double totalSpent = 0;

        for (Order order : deliveredOrders) {
            totalSpent += order.getTotal();
            if (order.getItems() == null) {
                continue;
            }
            for (OrderItem item : order.getItems()) {
                double amount = item.getUnitPrice() * item.getQuantity();
                ProductKey productKey = new ProductKey(item.getProductId(), item.getProductName());
                products.compute(productKey, (key, totals) -> totals == null
                        ? new PurchaseTotals(item.getQuantity(), amount)
                        : totals.add(item.getQuantity(), amount));

                String category = item.getCategory() == null || item.getCategory().isBlank()
                        ? "Uncategorized"
                        : item.getCategory();
                categories.compute(category, (key, totals) -> totals == null
                        ? new PurchaseTotals(item.getQuantity(), amount)
                        : totals.add(item.getQuantity(), amount));
            }
        }

        List<MostPurchasedProductDTO> mostBoughtProducts = products.entrySet().stream()
                .sorted((left, right) -> {
                    int unitsComparison = Long.compare(
                            right.getValue().units(), left.getValue().units());
                    return unitsComparison != 0
                            ? unitsComparison
                            : Double.compare(right.getValue().amountSpent(), left.getValue().amountSpent());
                })
                .limit(5)
                .map(entry -> new MostPurchasedProductDTO(
                        entry.getKey().id(),
                        entry.getKey().name(),
                        entry.getValue().units(),
                        entry.getValue().amountSpent()))
                .toList();

        List<PurchasedCategoryDTO> topCategories = categories.entrySet().stream()
                .sorted((left, right) -> {
                    int unitsComparison = Long.compare(
                            right.getValue().units(), left.getValue().units());
                    return unitsComparison != 0
                            ? unitsComparison
                            : Double.compare(right.getValue().amountSpent(), left.getValue().amountSpent());
                })
                .limit(5)
                .map(entry -> new PurchasedCategoryDTO(
                        entry.getKey(),
                        entry.getValue().units(),
                        entry.getValue().amountSpent()))
                .toList();

        return new CustomerProfileAnalyticsDTO(totalSpent, mostBoughtProducts, topCategories);
    }
}