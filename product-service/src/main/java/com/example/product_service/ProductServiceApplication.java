package com.example.product_service;

// import java.util.UUID;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

// import com.example.product_service.dto.UserDTO;
// import com.example.product_service.entities.Product;
// import com.example.product_service.feign.UserRestClient;
import com.example.product_service.repository.ProductRepository;
// import org.springframework.hateoas.PagedModel;

@SpringBootApplication
@EnableFeignClients
public class ProductServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(ProductServiceApplication.class, args);
	}
    
	// @Bean
	CommandLineRunner commandLineRunner(ProductRepository productRepository) {
		return args ->  {

		};
	}

}
