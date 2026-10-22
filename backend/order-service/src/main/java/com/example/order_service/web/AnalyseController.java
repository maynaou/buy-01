package com.example.order_service.web;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.example.order_service.dto.CustomerProfileAnalyticsDTO;
import com.example.order_service.dto.TopSellingProductDTO;
import com.example.order_service.service.AnalyseService;
import org.springframework.security.core.Authentication;


@RestController
@RequestMapping("/api/orders")
public class AnalyseController {
     
    AnalyseService analyseService;
    AnalyseController(AnalyseService analyseService) {
        this.analyseService = analyseService;
    }

    @GetMapping("/my-analytics")
    @PreAuthorize("hasAuthority('ROLE_CLIENT')")
    public ResponseEntity<CustomerProfileAnalyticsDTO> getMyAnalytics(Authentication authentication) {
        return ResponseEntity.ok(analyseService.getBuyerAnalytics(authentication.getName()));
    }

    @GetMapping("/seller/top-products")
    @PreAuthorize("hasAuthority('ROLE_SELLER')")
    public ResponseEntity<List<TopSellingProductDTO>> getSellerTopProducts(
            Authentication authentication) {
        return ResponseEntity.ok(analyseService.getTopSellingProductsBySeller(authentication.getName()));
    }
}