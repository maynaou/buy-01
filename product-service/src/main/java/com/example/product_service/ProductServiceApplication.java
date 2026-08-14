package com.example.product_service;

// import java.util.UUID;

// import java.util.UUID;
// import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;
// import org.springframework.context.annotation.Bean;

// import com.example.product_service.entity.Product;
// import com.example.product_service.dto.UserDTO;
// import com.example.product_service.entities.Product;
// import com.example.product_service.feign.UserRestClient;
// import com.example.product_service.repository.ProductRepository;
// import org.springframework.hateoas.PagedModel;

@SpringBootApplication
@EnableFeignClients
public class ProductServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(ProductServiceApplication.class, args);
	}
    
	// @Bean
	// CommandLineRunner commandLineRunner(ProductRepository productRepository) {
	// 	return args ->  {
    //              Product product = Product.builder()
	// 			                          .id(UUID.randomUUID().toString())
	// 									  .name("djaja")
	// 									  .description("djaja top")
	// 									  .price(123.5)
	// 									  .quantity(150)
	// 									  .sellerId(UUID.randomUUID().toString())
	// 			                          .build();
	// 			 productRepository.save(product);
	// 			  Product product1 = Product.builder()
	// 			                          .id(UUID.randomUUID().toString())
	// 									  .name("djaja")
	// 									  .description("djaja top")
	// 									  .price(123.5)
	// 									  .quantity(150)
	// 									  .sellerId(UUID.randomUUID().toString())
	// 			                          .build();
	// 			 productRepository.save(product1);
	// 			  Product product2 = Product.builder()
	// 			                          .id(UUID.randomUUID().toString())
	// 									  .name("djaja")
	// 									  .description("djaja top")
	// 									  .price(123.5)
	// 									  .quantity(150)
	// 									  .sellerId(UUID.randomUUID().toString())
	// 			                          .build();
	// 			 productRepository.save(product2);
	// 	};
	// }

}
