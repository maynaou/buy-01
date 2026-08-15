package com.example.product_service.web;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
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

    @GetMapping("/product/{id}")
    public ResponseEntity<ProductDTO> getProductById(@PathVariable String id) {
            return ResponseEntity.status(HttpStatus.OK).body(productService.getProductById(id));
    }

    @GetMapping("/product")
    public ResponseEntity<List<ProductDTO>> getProducts() {
        return ResponseEntity.status(HttpStatus.OK).body(productService.getProducts());
    }

    @PutMapping("/product/{id}")
    @PreAuthorize("hasAuthority('ROLE_SELLER') and @productSecurity.isOwner(#id,authentication.name)")
    public ResponseEntity<ProductDTO> updateProduct(@PathVariable String id, @RequestBody ProductDTO productDTO) {
        return ResponseEntity.status(HttpStatus.OK).body(productService.updateProduct(id,productDTO));
    }

    @DeleteMapping("/product/{id}")
    @PreAuthorize("hasAuthority('ROLE_SELLER') and @productSecurity.isOwner(#id,authentication.name)")
    public ResponseEntity<Void> deleteProduct(@PathVariable String id) {
              productService.deleteProduct(id);
        return ResponseEntity.noContent().build();  
    }

}
