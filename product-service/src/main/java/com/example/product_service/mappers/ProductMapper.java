package com.example.product_service.mappers;

import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Component;

import com.example.product_service.dto.ProductDTO;
import com.example.product_service.entities.Product;

@Component
public class ProductMapper {
      
    public ProductDTO fromProdcut(Product product) {
        ProductDTO productDTO = new ProductDTO();
        BeanUtils.copyProperties(product, productDTO);
        return productDTO;
    }
}
