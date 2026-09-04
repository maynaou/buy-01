package com.example.product_service.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cloud.stream.function.StreamBridge;

import com.example.product_service.dto.ProductDTO;
import com.example.product_service.entities.Product;
import com.example.product_service.events.ProductCreatedEvent;
import com.example.product_service.exception.ProductNotFoundException;
import com.example.product_service.mappers.ProductMapper;
import com.example.product_service.repository.ProductRepository;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductMapper productMapper;

    @Mock
    private StreamBridge streamBridge;

    @InjectMocks
    private ProductService productService;

    private Product testProduct;
    private ProductDTO testProductDTO;

    @BeforeEach
    void setUp() {
        testProduct = Product.builder()
                .id("prod-123")
                .name("Laptop Dell")
                .description("High-performance laptop for professionals")
                .price(999.99)
                .quantity(5)
                .userId("seller123")
                .build();

        testProductDTO = new ProductDTO();
        testProductDTO.setId("prod-123");
        testProductDTO.setName("Laptop Dell");
        testProductDTO.setDescription("High-performance laptop for professionals");
        testProductDTO.setPrice(999.99);
        testProductDTO.setQuantity(5);
    }

    // ==================== CREATE Tests ====================

    @Test
    @DisplayName("createProduct - devrait créer et retourner un produit")
    void createProduct_ShouldCreateAndReturnProduct() {
        // Arrange
        ProductDTO requestDTO = new ProductDTO();
        requestDTO.setName("Laptop Dell");
        requestDTO.setDescription("High-performance laptop for professionals");
        requestDTO.setPrice(999.99);
        requestDTO.setQuantity(5);

        when(productMapper.fromProduct(any(Product.class))).thenReturn(testProductDTO);
        when(streamBridge.send(eq("productProducer-out-0"), any(ProductCreatedEvent.class))).thenReturn(true);
        when(productRepository.save(any(Product.class))).thenReturn(testProduct);

        // Act
        ProductDTO result = productService.createProduct(requestDTO, "seller123");

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("Laptop Dell");
        assertThat(result.getPrice()).isEqualTo(999.99);
        verify(productRepository, times(1)).save(any(Product.class));
        verify(streamBridge, times(1)).send(eq("productProducer-out-0"), any(ProductCreatedEvent.class));
    }

    // ==================== READ Tests ====================

    @Test
    @DisplayName("getProductById - retourne un produit par ID")
    void getProductById_ShouldReturnProductDTO() {
        // Arrange
        when(productRepository.findById("prod-123")).thenReturn(Optional.of(testProduct));
        when(productMapper.fromProduct(testProduct)).thenReturn(testProductDTO);

        // Act
        ProductDTO result = productService.getProductById("prod-123");

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo("prod-123");
        assertThat(result.getName()).isEqualTo("Laptop Dell");
        verify(productRepository, times(1)).findById("prod-123");
    }

    @Test
    @DisplayName("getProductById - lève exception si produit non trouvé")
    void getProductById_ShouldThrowExceptionWhenNotFound() {
        // Arrange
        when(productRepository.findById("unknown-id")).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> productService.getProductById("unknown-id"))
                .isInstanceOf(ProductNotFoundException.class)
                .hasMessageContaining("not found");

        verify(productRepository, times(1)).findById("unknown-id");
    }

    @Test
    @DisplayName("getProducts - retourne tous les produits")
    void getProducts_ShouldReturnAllProducts() {
        // Arrange
        Product product2 = Product.builder()
                .id("prod-2")
                .name("Mouse")
                .description("Wireless mouse for computers")
                .price(29.99)
                .quantity(50)
                .userId("seller123")
                .build();

        List<Product> products = Arrays.asList(testProduct, product2);
        List<ProductDTO> productDTOs = Arrays.asList(testProductDTO);

        when(productRepository.findAll()).thenReturn(products);
        when(productMapper.fromProduct(products)).thenReturn(productDTOs);

        // Act
        List<ProductDTO> result = productService.getProducts();

        // Assert
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        verify(productRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("getMyProducts - retourne les produits du vendeur")
    void getMyProducts_ShouldReturnSellerProducts() {
        // Arrange
        Product sellerProduct2 = Product.builder()
                .id("prod-200")
                .name("My Mouse")
                .description("Wireless mouse by me")
                .price(25.99)
                .quantity(100)
                .userId("seller123")
                .build();

        List<Product> sellerProducts = Arrays.asList(testProduct, sellerProduct2);
        List<ProductDTO> sellerProductDTOs = Arrays.asList(testProductDTO);

        when(productRepository.findByUserId("seller123")).thenReturn(sellerProducts);
        when(productMapper.fromProduct(sellerProducts)).thenReturn(sellerProductDTOs);

        // Act
        List<ProductDTO> result = productService.getMyProducts("seller123");

        // Assert
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        verify(productRepository, times(1)).findByUserId("seller123");
    }

    // ==================== UPDATE Tests ====================

    @Test
    @DisplayName("updateProduct - met à jour et retourne le produit")
    void updateProduct_ShouldUpdateAndReturnProduct() {
        // Arrange
        ProductDTO updateDTO = new ProductDTO();
        updateDTO.setName("Updated Laptop");
        updateDTO.setDescription("Updated description for professionals");
        updateDTO.setPrice(1099.99);
        updateDTO.setQuantity(3);

        Product updatedProduct = Product.builder()
                .id("prod-123")
                .name("Updated Laptop")
                .description("Updated description for professionals")
                .price(1099.99)
                .quantity(3)
                .userId("seller123")
                .build();

        ProductDTO updatedDTO = new ProductDTO();
        updatedDTO.setId("prod-123");
        updatedDTO.setName("Updated Laptop");
        updatedDTO.setDescription("Updated description for professionals");
        updatedDTO.setPrice(1099.99);
        updatedDTO.setQuantity(3);

        when(productRepository.findById("prod-123")).thenReturn(Optional.of(testProduct));
        when(productRepository.save(any(Product.class))).thenReturn(updatedProduct);
        when(productMapper.fromProduct(updatedProduct)).thenReturn(updatedDTO);

        // Act
        ProductDTO result = productService.updateProduct("prod-123", updateDTO);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("Updated Laptop");
        assertThat(result.getPrice()).isEqualTo(1099.99);
        verify(productRepository, times(1)).findById("prod-123");
        verify(productRepository, times(1)).save(any(Product.class));
    }

    @Test
    @DisplayName("updateProduct - lève exception si produit non trouvé")
    void updateProduct_ShouldThrowExceptionWhenNotFound() {
        // Arrange
        ProductDTO updateDTO = new ProductDTO();
        updateDTO.setName("Updated Name");

        when(productRepository.findById("unknown-id")).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> productService.updateProduct("unknown-id", updateDTO))
                .isInstanceOf(ProductNotFoundException.class)
                .hasMessageContaining("not found");

        verify(productRepository, times(1)).findById("unknown-id");
        verify(productRepository, never()).save(any(Product.class));
    }

    // ==================== DELETE Tests ====================

    @Test
    @DisplayName("deleteProduct - supprime le produit et envoie événement")
    void deleteProduct_ShouldDeleteAndSendEvent() {
        // Arrange
        when(productRepository.findById("prod-123")).thenReturn(Optional.of(testProduct));
        when(streamBridge.send(eq("productProducer-out-0"), any(ProductCreatedEvent.class))).thenReturn(true);

        // Act
        productService.deleteProduct("prod-123");

        // Assert
        verify(productRepository, times(1)).findById("prod-123");
        verify(productRepository, times(1)).delete(testProduct);
        verify(streamBridge, times(1)).send(eq("productProducer-out-0"), any(ProductCreatedEvent.class));
    }

    @Test
    @DisplayName("deleteProduct - lève exception si produit non trouvé")
    void deleteProduct_ShouldThrowExceptionWhenNotFound() {
        // Arrange
        when(productRepository.findById("unknown-id")).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> productService.deleteProduct("unknown-id"))
                .isInstanceOf(ProductNotFoundException.class)
                .hasMessageContaining("not found");

        verify(productRepository, times(1)).findById("unknown-id");
        verify(productRepository, never()).delete(any(Product.class));
        verify(streamBridge, never()).send(anyString(), any(ProductCreatedEvent.class));
    }
}
