package com.example.product_service.mappers;

import java.util.List;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Component;
import com.example.product_service.dto.ProductResponse;
import com.example.product_service.entity.Product;

@Component
@SuppressWarnings("null")
public class ProductMapper {
      
    public ProductResponse fromProduct(Product product) {
        ProductResponse productDTO = new ProductResponse();
        BeanUtils.copyProperties(product, productDTO);
        return productDTO;
    }

    public List<ProductResponse> fromProduct(List<Product> products) {
           return products.stream()
                           .map(product -> fromProduct(product))
                           .toList();
          
    }
}
