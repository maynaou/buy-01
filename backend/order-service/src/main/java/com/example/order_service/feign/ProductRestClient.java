package com.example.order_service.feign;

import java.util.Optional;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.example.order_service.dto.ProductResponse;

@FeignClient(name = "product-service", configuration = ProductFeignConfig.class)
public interface ProductRestClient {

    @GetMapping("/api/products/product/{id}")
    Optional<ProductResponse> getProductById(@PathVariable("id") String id);

    @PostMapping("/api/products/{id}/stock/decrease")
    void decreaseStock(@PathVariable("id") String id, @RequestParam("quantity") int quantity);

    @PostMapping("/api/products/{id}/stock/increase")
    void increaseStock(@PathVariable("id") String id, @RequestParam("quantity") int quantity);
}