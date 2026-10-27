package com.example.order_service.feign;

import com.example.order_service.exception.ProductNotFoundException;

import feign.Response;
import feign.codec.ErrorDecoder;

public class ProductErrorDecoder implements ErrorDecoder {

    private final ErrorDecoder defaultDecoder =
            new ErrorDecoder.Default();

    @Override
    public Exception decode(String methodKey, Response response) {
        if (response.status() == 404) {
            return new ProductNotFoundException("Product not found");
        }
        
        return defaultDecoder.decode(methodKey, response);
    }
}