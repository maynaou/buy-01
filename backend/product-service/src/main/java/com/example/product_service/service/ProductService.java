package com.example.product_service.service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;

import org.springframework.cloud.stream.function.StreamBridge;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import com.example.product_service.dto.ProductDTO;
import com.example.product_service.dto.ProductPageDTO;
import com.example.product_service.entities.Product;
import com.example.product_service.enums.EventType;
import com.example.product_service.enums.ProductCategory;
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
    MongoTemplate mongoTemplate;

    public ProductService(ProductRepository productRepository, ProductMapper productMapper , StreamBridge streamBridge, MongoTemplate mongoTemplate) {
        this.productRepository = productRepository;
        this.productMapper = productMapper;
        this.streamBridge = streamBridge;
        this.mongoTemplate = mongoTemplate;
    }

    public ProductDTO createProduct(ProductDTO productRequest, String userId) {
                Product product = Product.builder()
                                         .id(UUID.randomUUID().toString())
                                         .name(productRequest.getName())
                                         .description(productRequest.getDescription())
                                         .price(productRequest.getPrice())
                                         .quantity(productRequest.getQuantity())
                                         .category(productRequest.getCategory())
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

    public ProductPageDTO getProductPage(
            String keyword, ProductCategory category, Double minPrice, Double maxPrice,
            int page, int size) {
        List<Criteria> filters = new ArrayList<>();
        if (keyword != null && !keyword.isBlank()) {
            String literalKeyword = Pattern.quote(keyword.trim());
            filters.add(new Criteria().orOperator(
                    Criteria.where("name").regex(literalKeyword, "i"),
                    Criteria.where("description").regex(literalKeyword, "i")));
        }
        if (category != null) {
            filters.add(Criteria.where("category").is(category));
        }
        if (minPrice != null || maxPrice != null) {
            Criteria priceCriteria = Criteria.where("price");
            if (minPrice != null) {
                priceCriteria.gte(minPrice);
            }
            if (maxPrice != null) {
                priceCriteria.lte(maxPrice);
            }
            filters.add(priceCriteria);
        }

        Query query = filters.isEmpty()
                ? new Query()
                : Query.query(new Criteria().andOperator(filters.toArray(Criteria[]::new)));
        long totalElements = mongoTemplate.count(query, Product.class);
        query.with(Sort.by(Sort.Direction.ASC, "id"))
                .skip((long) page * size)
                .limit(size);
        List<Product> products = mongoTemplate.find(query, Product.class);
        int totalPages = (int) Math.ceil((double) totalElements / size);
        return new ProductPageDTO(
                productMapper.fromProduct(products), page, size, totalElements, totalPages);
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
           product.setCategory(productDTO.getCategory());
           return productMapper.fromProduct(productRepository.save(product));
    }

    public void deleteProduct(String id) {
        Product product = productRepository.findById(id).orElseThrow(() -> new ProductNotFoundException("product not found"));
        productRepository.delete(product);

        streamBridge.send("productProducer-out-0", new ProductCreatedEvent(EventType.DELETED,id,""));
    }


    public List<ProductDTO> getProductsByIds(List<String> ids) {
    if (ids == null || ids.isEmpty()) {
        return List.of();
    }

       return productRepository.findByIdIn(ids)
            .stream()
            .map(productMapper::fromProduct)
            .toList();
    }

    public boolean decreaseStock(String productId, int qty) {
    Query query = new Query(Criteria.where("id").is(productId)
            .and("quantity").gte(qty));
    Update update = new Update().inc("quantity", -qty);
    return mongoTemplate.updateFirst(query, update, Product.class)
            .getModifiedCount() == 1;
}

public void increaseStock(String productId, int qty) {
    mongoTemplate.updateFirst(
            Query.query(Criteria.where("id").is(productId)),
            new Update().inc("quantity", qty), Product.class);
}

    
}
