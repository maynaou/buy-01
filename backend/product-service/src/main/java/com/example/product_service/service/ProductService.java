package com.example.product_service.service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import com.example.product_service.dto.ProductDTO;
import com.example.product_service.entities.Product;
import com.example.product_service.exception.ProductNotFoundException;
import com.example.product_service.feign.MediaRestClient;
import com.example.product_service.mappers.ProductMapper;
import com.example.product_service.repository.ProductRepository;

@Service
@SuppressWarnings("null")
public class ProductService {
    
    ProductRepository productRepository;
    ProductMapper productMapper;
    MediaRestClient mediaRestClient;
    public ProductService(ProductRepository productRepository, ProductMapper productMapper,MediaRestClient mediaRestClient) {
        this.productRepository = productRepository;
        this.productMapper = productMapper;
        this.mediaRestClient = mediaRestClient;
    }

    public ProductDTO createProduct(ProductDTO productRequest, String userId) {
                Product product = Product.builder()
                                         .id(UUID.randomUUID().toString())
                                         .name(productRequest.getName())
                                         .description(productRequest.getDescription())
                                         .price(productRequest.getPrice())
                                         .quantity(productRequest.getQuantity())
                                         .userId(userId)
                                         .imagePaths(new ArrayList<>())
                                         .build();

                        productRepository.save(product);
              
                return productMapper.fromProduct(product);
    }

    public ProductDTO getProductById(String id) {
          Product product = productRepository.findById(id).orElseThrow(() -> new ProductNotFoundException("Produc not found"));
          return productMapper.fromProduct(product);
    }

    public List<ProductDTO>  getProducts() {
          List<Product> products = productRepository.findAll();
          return productMapper.fromProduct(products);
    }

    public ProductDTO updateProduct(String id, ProductDTO productDTO) {
           Product product = productRepository.findById(id).orElseThrow(() -> new ProductNotFoundException("product not found"));
           product.setName(productDTO.getName());
           product.setDescription(productDTO.getDescription());
           product.setPrice(productDTO.getPrice());
           product.setQuantity(productDTO.getQuantity());
           return productMapper.fromProduct(productRepository.save(product));
    }

    public void deleteProduct(String id) {
        Product product = productRepository.findById(id).orElseThrow(() -> new ProductNotFoundException("product not found"));
        productRepository.delete(product);
    }
}
