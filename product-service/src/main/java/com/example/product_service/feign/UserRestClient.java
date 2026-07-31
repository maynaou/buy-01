package com.example.product_service.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.hateoas.PagedModel;
import org.springframework.web.bind.annotation.GetMapping;

import com.example.product_service.dto.UserDTO;

@FeignClient(name = "USER-SERVICE")
public interface UserRestClient {
    @GetMapping("/api/users") 
    PagedModel<UserDTO> getAllUsers();
}