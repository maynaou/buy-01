package com.example.product_service.web;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
// import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.product_service.dto.ProductDTO;
import com.example.product_service.service.ProductService;

@RestController
@RequestMapping("/api/products")
public class ProductController {
     
    ProductService productService;

    public ProductController(ProductService productService) {
              this.productService = productService;
    }
    
    @PostMapping("/product")
    @PreAuthorize("hasAuthority('ROLE_SELLER')")
    public ResponseEntity<ProductDTO> createProduct(@RequestBody ProductDTO productRequest, Authentication authentication) {
           return ResponseEntity.status(HttpStatus.CREATED).body(productService.createProduct(productRequest, authentication.getName()));
    }
}
