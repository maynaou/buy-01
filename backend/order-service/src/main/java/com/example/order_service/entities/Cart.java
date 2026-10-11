
package com.example.order_service.entities;


import java.util.List;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

@Document
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class Cart {
    private String id;
    private String userId;
    private List<CartItem> items;
    private Instant createdAt;
    private Instant updatedAt;
}
