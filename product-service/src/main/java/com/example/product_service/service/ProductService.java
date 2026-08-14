package com.example.product_service.service;

import java.util.UUID;

// import org.springframework.cloud.stream.function.StreamBridge;
import org.springframework.stereotype.Service;
import java.util.List;

import com.example.product_service.dto.ProductRequest;
import com.example.product_service.dto.ProductResponse;
import com.example.product_service.entity.Product;
import com.example.product_service.mappers.ProductMapper;
import com.example.product_service.repository.ProductRepository;

@Service
public class ProductService {

    ProductRepository productRepository;
    ProductMapper productMapper;
    // StreamBridge streamBridge;

    public ProductService(ProductRepository productRepository, ProductMapper productMapper) {
        this.productRepository = productRepository;
        this.productMapper = productMapper;
        // this.streamBridge = streamBridge;
    }

    public ProductResponse createProduct(ProductRequest productRequest, String userId) {
        Product product = Product.builder()
                .id(UUID.randomUUID().toString())
                .name(productRequest.getName())
                .description(productRequest.getDescription())
                .price(productRequest.getPrice())
                .quantity(productRequest.getQuantity())
                .sellerId(userId)
                .build();

        productRepository.save(product);

        // streamBridge.send("productProducer-out-0", new ProductCreatedEvent(product.getId(), product.getSellerId()));

        return productMapper.fromProduct(product);
    }

    public ProductResponse getProductById(String id) {
        Product product = productRepository.findById(id).orElseThrow(() -> new RuntimeException("Produc not found"));
        return productMapper.fromProduct(product);
    }

    public List<ProductResponse> getProducts() {
        List<Product> products = productRepository.findAll();
        return productMapper.fromProduct(products);
    }

    public ProductResponse updateProduct(String id, ProductRequest productDTO) {
        Product product = productRepository.findById(id).orElseThrow(() -> new RuntimeException("product not found"));
        product.setName(productDTO.getName());
        product.setDescription(productDTO.getDescription());
        product.setPrice(productDTO.getPrice());
        product.setQuantity(productDTO.getQuantity());
        return productMapper.fromProduct(productRepository.save(product));
    }

    public ProductResponse addImage(String productId, List<String> imageUrl) {

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        product.getImageUrls().addAll(imageUrl);

        return productMapper.fromProduct(productRepository.save(product));
    }
}
