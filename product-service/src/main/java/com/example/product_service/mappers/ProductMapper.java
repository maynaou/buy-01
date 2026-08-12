package com.example.product_service.mappers;

import java.util.List;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Component;

import com.example.product_service.dto.ProductDTO;
import com.example.product_service.entities.Product;

@Component
public class ProductMapper {
      
    public ProductDTO fromProduct(Product product) {
        ProductDTO productDTO = new ProductDTO();
        BeanUtils.copyProperties(product, productDTO);
        return productDTO;
    }

    public List<ProductDTO> fromProduct(List<Product> products) {
           return products.stream()
                           .map(product -> fromProduct(product))
                           .toList();
          
    }
}
