package com.example.api_gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.ReactiveDiscoveryClient;
import org.springframework.cloud.gateway.discovery.DiscoveryClientRouteDefinitionLocator;
import org.springframework.cloud.gateway.discovery.DiscoveryLocatorProperties;

@SpringBootApplication
public class ApiGatewayApplication {

	public static void main(String[] args) {
		SpringApplication.run(ApiGatewayApplication.class, args);
	}


	// @Bean
	DiscoveryClientRouteDefinitionLocator Locator(ReactiveDiscoveryClient rdc, DiscoveryLocatorProperties dlp) {
           return new DiscoveryClientRouteDefinitionLocator(rdc, dlp);
	}
	

}
