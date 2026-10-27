package com.example.order_service.mapper;

import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Component;
import java.util.List;
import com.example.order_service.dto.CartResponse;
import com.example.order_service.entities.Cart;

@Component
public class CartMapper {
    public CartResponse fromCart(Cart cart) {
        CartResponse cartResponse = new CartResponse();
        BeanUtils.copyProperties(cart, cartResponse);
        return cartResponse;
    }

}
