package com.example.product_service;

import java.util.Collection;
import java.util.UUID;
import java.util.stream.Stream;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.annotation.Bean;

import com.example.product_service.dto.UserDTO;
import com.example.product_service.entities.Product;
import com.example.product_service.feign.UserRestClient;
import com.example.product_service.repository.ProductRepository;
import org.springframework.hateoas.PagedModel;

@SpringBootApplication
@EnableFeignClients
public class ProductServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(ProductServiceApplication.class, args);
	}
    
	@Bean
	CommandLineRunner commandLineRunner(ProductRepository productRepository,UserRestClient userRestClient) {
		return args ->  {
			    PagedModel<UserDTO> users = userRestClient.getAllUsers();
				System.out.println(users);
                 users.forEach( user -> {
					    Product product = Product.builder()
						                  .id(UUID.randomUUID().toString())
						                  .name("djaja")
						                  .description("djaja lamli7 saffy")
										  .price(10000 + Math.random()*90000)
                                          .quantity(20)
										  .userId(user.getId())
						                  .build();
						productRepository.save(product);
				 });
		};
	}

}
