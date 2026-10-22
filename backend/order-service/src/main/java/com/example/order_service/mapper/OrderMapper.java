package com.example.order_service.mapper;

import java.util.List;
import java.util.Objects;

import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Component;

import com.example.order_service.dto.OrderDTO;
import com.example.order_service.entities.Order;

@Component
public class OrderMapper {

    public OrderDTO toDTO(Order order) {
        OrderDTO orderDTO = new OrderDTO();
        BeanUtils.copyProperties(order, orderDTO);
        return orderDTO;
    }

    public List<OrderDTO> toDTOs(List<Order> orders) {
        return orders.stream()
                .map(this::toDTO)
                .toList();
    }
}
