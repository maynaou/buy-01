package com.example.order_service.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import com.example.order_service.dto.ProductResponse;

@FeignClient(name = "product-service")
public interface ProductRestClient {

    @GetMapping("/api/products/product/{id}")
    ProductResponse getProductById(@PathVariable("id") String id);
}