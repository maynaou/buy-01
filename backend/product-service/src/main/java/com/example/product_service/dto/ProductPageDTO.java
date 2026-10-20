package com.example.product_service.dto;

import java.util.List;

public class ProductPageDTO {
    private List<ProductDTO> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;

    public ProductPageDTO(
            List<ProductDTO> content, int page, int size, long totalElements, int totalPages) {
        this.content = content;
        this.page = page;
        this.size = size;
        this.totalElements = totalElements;
        this.totalPages = totalPages;
    }

    public List<ProductDTO> getContent() {
        return content;
    }

    public int getPage() {
        return page;
    }

    public int getSize() {
        return size;
    }

    public long getTotalElements() {
        return totalElements;
    }

    public int getTotalPages() {
        return totalPages;
    }
}
