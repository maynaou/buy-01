package com.example.product_service.service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.cloud.stream.function.StreamBridge;
import org.springframework.stereotype.Service;
import com.example.product_service.dto.ProductDTO;
import com.example.product_service.entities.Product;
import com.example.product_service.enums.EventType;
import com.example.product_service.events.ProductCreatedEvent;
import com.example.product_service.exception.ProductNotFoundException;
import com.example.product_service.mappers.ProductMapper;
import com.example.product_service.repository.ProductRepository;

@Service
@SuppressWarnings("null")
public class ProductService {
    
    ProductRepository productRepository;
    ProductMapper productMapper;
    StreamBridge streamBridge;
    public ProductService(ProductRepository productRepository, ProductMapper productMapper , StreamBridge streamBridge) {
        this.productRepository = productRepository;
        this.productMapper = productMapper;
        this.streamBridge = streamBridge;
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

                streamBridge.send("productProducer-out-0", new ProductCreatedEvent(EventType.CREATED, product.getId(), product.getUserId()));
              
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

    /** The products owned by one seller — backs the seller dashboard. */
    public List<ProductDTO> getMyProducts(String userId) {
          return productMapper.fromProduct(productRepository.findByUserId(userId));
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

        streamBridge.send("productProducer-out-0", new ProductCreatedEvent(EventType.DELETED,id,""));
    }
}
