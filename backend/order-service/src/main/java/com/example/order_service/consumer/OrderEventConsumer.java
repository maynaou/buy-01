package com.example.order_service.consumer;

import java.util.function.Consumer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.example.order_service.dto.ProductEventDTO;
import com.example.order_service.enums.ProductEventType;
import com.example.order_service.service.CartService;

@Configuration
public class OrderEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(OrderEventConsumer.class);

    @Bean
    public Consumer<ProductEventDTO> orderConsumer(CartService cartService) {
        return event -> {
            // if (event == null || event.getEventType() == null || event.getProductId() == null
            //         || event.getProductId().isBlank()) {
            //     log.warn("Ignoring invalid product event: {}", event);
            //     return;
            // }

            if (event.getEventType() == ProductEventType.DELETED) {
                cartService.removeProductFromAllCarts(event.getProductId());
                log.info("Removed deleted product {} from customer carts", event.getProductId());
            }
        };
    }
}
