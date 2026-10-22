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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.product_service.dto.ProductDTO;
import com.example.product_service.dto.ProductPageDTO;
import com.example.product_service.enums.ProductCategory;
import com.example.product_service.service.ProductService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @PostMapping("/product")
    @PreAuthorize("hasAuthority('ROLE_SELLER')")
    public ResponseEntity<ProductDTO> createProduct(@RequestBody @Valid ProductDTO productRequest,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(productService.createProduct(productRequest, authentication.getName()));
    }

    @GetMapping("/product/{id}")
    public ResponseEntity<ProductDTO> getProductById(@PathVariable String id) {
        return ResponseEntity.status(HttpStatus.OK).body(productService.getProductById(id));
    }

    @GetMapping("/catalog")
    public ResponseEntity<ProductPageDTO> getProductPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        if (!isValidPage(page, size)) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(productService.getProductPage(null, null, null, null, page, size));
    }

    @GetMapping("/search")
    public ResponseEntity<ProductPageDTO> searchProducts(
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "category", required = false) ProductCategory category,
            @RequestParam(value = "minPrice", required = false) Double minPrice,
            @RequestParam(value = "maxPrice", required = false) Double maxPrice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        String normalizedKeyword = keyword == null ? null : keyword.trim();
        if ((normalizedKeyword != null
                    && (normalizedKeyword.isEmpty() || normalizedKeyword.length() > 100))
                || !isValidPrice(minPrice)
                || !isValidPrice(maxPrice)
                || (minPrice != null && maxPrice != null && minPrice > maxPrice)
                || !isValidPage(page, size)) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(
                productService.getProductPage(normalizedKeyword, category, minPrice, maxPrice, page, size));
    }

    private boolean isValidPage(int page, int size) {
        return page >= 0 && size >= 1 && size <= 48;
    }

    private boolean isValidPrice(Double price) {
        return price == null || (Double.isFinite(price) && price >= 0 && price <= 999999.99);
    }

    @GetMapping("/my-products")
    @PreAuthorize("hasAuthority('ROLE_SELLER')")
    public ResponseEntity<List<ProductDTO>> getMyProducts(Authentication authentication) {
        return ResponseEntity.status(HttpStatus.OK).body(productService.getMyProducts(authentication.getName()));
    }

    @PutMapping("/product/{id}")
    @PreAuthorize("hasAuthority('ROLE_SELLER') and @productSecurity.isOwner(#id,authentication.name)")
    public ResponseEntity<ProductDTO> updateProduct(@PathVariable String id,
            @RequestBody @Valid ProductDTO productDTO) {
        return ResponseEntity.status(HttpStatus.OK).body(productService.updateProduct(id, productDTO));
    }

    @DeleteMapping("/product/{id}")
    @PreAuthorize("hasAuthority('ROLE_SELLER') and @productSecurity.isOwner(#id,authentication.name)")
    public ResponseEntity<Void> deleteProduct(@PathVariable String id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/stock/decrease")
    @PreAuthorize("hasAnyAuthority('ROLE_CLIENT','ROLE_SELLER')")
    public ResponseEntity<Void> decrease(@PathVariable String id, @RequestParam int quantity) {
        if (quantity < 1)
            return ResponseEntity.badRequest().build();
        boolean ok = productService.decreaseStock(id, quantity);
        return ok ? ResponseEntity.ok().build()
                : ResponseEntity.status(HttpStatus.CONFLICT).build();
    }

    @PostMapping("/{id}/stock/increase")
    @PreAuthorize("hasAnyAuthority('ROLE_CLIENT','ROLE_SELLER')")
    public ResponseEntity<Void> increase(@PathVariable String id, @RequestParam int quantity) {
        if (quantity < 1)
            return ResponseEntity.badRequest().build();
        productService.increaseStock(id, quantity);
        return ResponseEntity.ok().build();
    }

}
