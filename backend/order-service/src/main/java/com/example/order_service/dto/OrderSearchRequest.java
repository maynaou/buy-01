package com.example.order_service.dto;

import java.time.LocalDate;

import com.example.order_service.entities.OrderStatus;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderSearchRequest {

    @Size(max = 100, message = "Search must not exceed 100 characters")
    private String search;
    private OrderStatus status;
    private LocalDate dateFrom;
    private LocalDate dateTo;

    @AssertTrue(message = "dateFrom must be before or equal to dateTo")
    public boolean isDateRangeValid() {
        return dateFrom == null || dateTo == null || !dateFrom.isAfter(dateTo);
    }
}
