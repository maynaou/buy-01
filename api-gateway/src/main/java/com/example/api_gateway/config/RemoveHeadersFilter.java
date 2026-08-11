package com.example.api_gateway.config;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;

import reactor.core.publisher.Mono;

@Component
public class RemoveHeadersFilter implements GlobalFilter, Ordered { 

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
           ServerHttpRequest request = exchange.getRequest().mutate().headers(header -> {
                     header.remove("X-Username");
                     header.remove("X-User-Role");
           }).build();
           return chain.filter(exchange.mutate().request(request).build());
    } 

    @Override
    public int getOrder() {
        return -2;
    }
    
}
