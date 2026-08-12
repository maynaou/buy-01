package com.example.api_gateway.config;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;

import reactor.core.publisher.Mono;

@Component
public class AddHeadersFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        return exchange.getPrincipal()
                       .cast(JwtAuthenticationToken.class)
                       .map(auth -> {
                            Jwt jwt = auth.getToken();
                            System.out.println("user : " + jwt.getSubject());
                            ServerHttpRequest mRequest = exchange.getRequest()
                                                                 .mutate()
                                                                 .header("X-User-Id", jwt.getSubject())
                                                                 .header("X-User-Role", jwt.getClaimAsString("scope"))
                                                                 .build();
                            return exchange.mutate().request(mRequest).build();
                       })
                       .defaultIfEmpty(exchange)
                       .flatMap(chain::filter);
    }

    @Override
    public int getOrder() {
        return -1;
    }
}
