package com.example.media_service.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.hateoas.PagedModel;
import org.springframework.web.bind.annotation.GetMapping;

import com.example.media_service.dto.ProductDTO;

@FeignClient(name = "product-service")
public interface ProductRestClient {
    
    @GetMapping("/api/products")
    PagedModel<ProductDTO> getAllProducts();
}
