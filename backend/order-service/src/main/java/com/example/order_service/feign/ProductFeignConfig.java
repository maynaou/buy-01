package com.example.order_service.feign;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import feign.RequestInterceptor;
import feign.codec.ErrorDecoder;

@Configuration
public class ProductFeignConfig {

    @Bean
    public ErrorDecoder productErrorDecoder() {
        return new ProductErrorDecoder();
    }

    @Bean
    public RequestInterceptor feignAuthInterceptor() {
        return new FeignAuthInterceptor();
    }
}