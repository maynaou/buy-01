package com.example.order_service.exception;

import java.util.HashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<Map<String, String>> handleValidationErrors(
                        MethodArgumentNotValidException ex) {

                Map<String, String> errors = new HashMap<>();

                ex.getBindingResult()
                                .getFieldErrors()
                                .forEach(error -> errors.put(error.getField(), error.getDefaultMessage()));

                return ResponseEntity
                                .status(HttpStatus.BAD_REQUEST)
                                .body(errors);
        }

        @ExceptionHandler(ProductNotFoundException.class)
        public ResponseEntity<ApiError> handleProductNotFound(ProductNotFoundException ex) {
                return ResponseEntity
                                .status(HttpStatus.NOT_FOUND)
                                .body(new ApiError("PRODUCT_NOT_FOUND", ex.getMessage()));

        }

        @ExceptionHandler(CartNotFoundException.class)
        public ResponseEntity<ApiError> handleCartNotFound(CartNotFoundException ex) {
                return ResponseEntity
                                .status(HttpStatus.NOT_FOUND)
                                .body(new ApiError("CART_NOT_FOUND", ex.getMessage()));
        }

        @ExceptionHandler(EmptyCartException.class)
        public ResponseEntity<ApiError> handleEmptyCart(EmptyCartException ex) {
                return ResponseEntity
                                .status(HttpStatus.BAD_REQUEST)
                                .body(new ApiError("EMPTY_CART", ex.getMessage()));
        }

        @ExceptionHandler(InsufficientStockException.class)
        public ResponseEntity<ApiError> handleInsufficientStock(InsufficientStockException ex) {
                return ResponseEntity
                                .status(HttpStatus.BAD_REQUEST)
                                .body(new ApiError("INSUFFICIENT_STOCK", ex.getMessage()));
        }

        @ExceptionHandler(OrderNotFoundException.class)
        public ResponseEntity<ApiError> handleOrderNotFound(OrderNotFoundException ex) {
                return ResponseEntity
                                .status(HttpStatus.NOT_FOUND)
                                .body(new ApiError("ORDER_NOT_FOUND", ex.getMessage()));
        }

        @ExceptionHandler(IllegalStateException.class)
        public ResponseEntity<ApiError> handleIllegalState(IllegalStateException ex) {
                return ResponseEntity
                                .status(HttpStatus.BAD_REQUEST)
                                .body(new ApiError("INVALID_STATE", ex.getMessage()));
        }
}
