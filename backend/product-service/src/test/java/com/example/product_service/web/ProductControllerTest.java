package com.example.product_service.web;

import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.example.product_service.dto.ProductDTO;
import com.example.product_service.service.ProductService;
import com.fasterxml.jackson.databind.ObjectMapper;

@ExtendWith(MockitoExtension.class)
class ProductControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ProductService productService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private ProductController productController;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(productController).build();
        objectMapper = new ObjectMapper();
    }

    private void setupAuthenticationMock() {
        when(authentication.getName()).thenReturn("seller123");
    }

    // ==================== POST Tests ====================

    @Test
    @DisplayName("POST /api/products/product - crée un nouveau produit")
    void createProduct_ShouldReturnCreatedProductDTO() throws Exception {
        setupAuthenticationMock();
        ProductDTO requestDTO = new ProductDTO();
        requestDTO.setName("Laptop Dell");
        requestDTO.setDescription("High-performance laptop for professionals");
        requestDTO.setPrice(999.99);
        requestDTO.setQuantity(5);

        ProductDTO createdDTO = new ProductDTO();
        createdDTO.setId("prod-123");
        createdDTO.setName("Laptop Dell");
        createdDTO.setDescription("High-performance laptop for professionals");
        createdDTO.setPrice(999.99);
        createdDTO.setQuantity(5);

        when(productService.createProduct(requestDTO, "seller123")).thenReturn(createdDTO);

        mockMvc.perform(post("/api/products/product")
                        .principal(authentication)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDTO)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("prod-123"))
                .andExpect(jsonPath("$.name").value("Laptop Dell"))
                .andExpect(jsonPath("$.price").value(999.99));

        verify(productService, times(1)).createProduct(requestDTO, "seller123");
    }

    // ==================== GET Tests ====================

    @Test
    @DisplayName("GET /api/products/product/{id} - retourne un produit par ID")
    void getProductById_ShouldReturnProductDTO() throws Exception {
        ProductDTO productDTO = new ProductDTO();
        productDTO.setId("prod-123");
        productDTO.setName("Laptop Dell");
        productDTO.setPrice(999.99);

        when(productService.getProductById("prod-123")).thenReturn(productDTO);

        mockMvc.perform(get("/api/products/product/prod-123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("prod-123"))
                .andExpect(jsonPath("$.name").value("Laptop Dell"))
                .andExpect(jsonPath("$.price").value(999.99));

        verify(productService, times(1)).getProductById("prod-123");
    }

    @Test
    @DisplayName("GET /api/products/product - retourne tous les produits")
    void getProducts_ShouldReturnProductList() throws Exception {
        ProductDTO product1 = new ProductDTO();
        product1.setId("prod-1");
        product1.setName("Laptop");
        product1.setPrice(999.99);

        ProductDTO product2 = new ProductDTO();
        product2.setId("prod-2");
        product2.setName("Mouse");
        product2.setPrice(29.99);

        List<ProductDTO> products = Arrays.asList(product1, product2);

        when(productService.getProducts()).thenReturn(products);

        mockMvc.perform(get("/api/products/product"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("prod-1"))
                .andExpect(jsonPath("$[0].name").value("Laptop"))
                .andExpect(jsonPath("$[1].id").value("prod-2"))
                .andExpect(jsonPath("$[1].name").value("Mouse"));

        verify(productService, times(1)).getProducts();
    }

    @Test
    @DisplayName("GET /api/products/my-products - retourne les produits du vendeur")
    void getMyProducts_ShouldReturnSellerProducts() throws Exception {
        setupAuthenticationMock();
        ProductDTO product1 = new ProductDTO();
        product1.setId("prod-1");
        product1.setName("My Laptop");
        product1.setPrice(999.99);

        ProductDTO product2 = new ProductDTO();
        product2.setId("prod-2");
        product2.setName("My Mouse");
        product2.setPrice(29.99);

        List<ProductDTO> sellerProducts = Arrays.asList(product1, product2);

        when(productService.getMyProducts("seller123")).thenReturn(sellerProducts);

        mockMvc.perform(get("/api/products/my-products")
                        .principal(authentication))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("prod-1"))
                .andExpect(jsonPath("$[0].name").value("My Laptop"))
                .andExpect(jsonPath("$[1].id").value("prod-2"));

        verify(productService, times(1)).getMyProducts("seller123");
    }

    // ==================== PUT Tests ====================

    @Test
    @DisplayName("PUT /api/products/product/{id} - met à jour un produit")
    void updateProduct_ShouldReturnUpdatedProductDTO() throws Exception {
        setupAuthenticationMock();
        ProductDTO updateDTO = new ProductDTO();
        updateDTO.setName("Updated Laptop");
        updateDTO.setDescription("Updated description for professionals");
        updateDTO.setPrice(1099.99);
        updateDTO.setQuantity(3);

        ProductDTO updatedDTO = new ProductDTO();
        updatedDTO.setId("prod-123");
        updatedDTO.setName("Updated Laptop");
        updatedDTO.setDescription("Updated description for professionals");
        updatedDTO.setPrice(1099.99);
        updatedDTO.setQuantity(3);

        when(productService.updateProduct("prod-123", updateDTO)).thenReturn(updatedDTO);

        mockMvc.perform(put("/api/products/product/prod-123")
                        .principal(authentication)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("prod-123"))
                .andExpect(jsonPath("$.name").value("Updated Laptop"))
                .andExpect(jsonPath("$.price").value(1099.99));

        verify(productService, times(1)).updateProduct("prod-123", updateDTO);
    }

    // ==================== DELETE Tests ====================

    @Test
    @DisplayName("DELETE /api/products/product/{id} - supprime un produit")
    void deleteProduct_ShouldReturnNoContent() throws Exception {
        setupAuthenticationMock();
        mockMvc.perform(delete("/api/products/product/prod-123")
                        .principal(authentication))
                .andExpect(status().isNoContent());

        verify(productService, times(1)).deleteProduct("prod-123");
    }
}
