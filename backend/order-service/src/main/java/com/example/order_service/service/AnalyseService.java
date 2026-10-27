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
import com.example.order_service.dto.MostPurchasedProductDTO;
import com.example.order_service.dto.ProfileAnalyticsDTO;
import com.example.order_service.dto.PurchasedCategoryDTO;
import com.example.order_service.dto.TopSellingProductDTO;
import com.example.order_service.entities.*;

@Service
public class AnalyseService {

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

        public ProfileAnalyticsDTO getBuyerAnalytics(String buyerId) {
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
                        for (OrderItem item : order.getItems()) {
                                double amount = item.getUnitPrice() * item.getQuantity();
                                ProductKey productKey = new ProductKey(item.getProductId(), item.getProductName());
                                products.compute(productKey, (key, totals) -> totals == null
                                                ? new PurchaseTotals(item.getQuantity(), amount)
                                                : totals.add(item.getQuantity(), amount));

                                String category = item.getCategory();
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
                                                        : Double.compare(right.getValue().amountSpent(),
                                                                        left.getValue().amountSpent());
                                })
                                .limit(5)
                                .map(entry -> MostPurchasedProductDTO.builder()
                                                .productId(entry.getKey().id())
                                                .name(entry.getKey().name())
                                                .units(entry.getValue().units())
                                                .amountSpent(entry.getValue().amountSpent())
                                                .build())
                                .toList();

                List<PurchasedCategoryDTO> topCategories = categories.entrySet().stream()
                                .sorted((left, right) -> {
                                        int unitsComparison = Long.compare(
                                                        right.getValue().units(), left.getValue().units());
                                        return unitsComparison != 0
                                                        ? unitsComparison
                                                        : Double.compare(right.getValue().amountSpent(),
                                                                        left.getValue().amountSpent());
                                })
                                .limit(5)
                                .map(entry -> PurchasedCategoryDTO.builder()
                                                .category(entry.getKey())
                                                .units(entry.getValue().units())
                                                .amountSpent(entry.getValue().amountSpent())
                                                .build())
                                .toList();

                return ProfileAnalyticsDTO.builder()
                                .totalSpent(totalSpent)
                                .mostBoughtProducts(mostBoughtProducts)
                                .topCategories(topCategories)
                                .build();
        }

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
}