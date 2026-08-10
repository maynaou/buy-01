package com.example.user_service.web;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class TestRestController {
        
    @GetMapping("/test")
    @PreAuthorize("hasRole('CLIENT')")
    public void test() {
        System.out.println("*************");
    }


    @GetMapping("/test1") 
    @PreAuthorize("hasAuthority('SELLER')")
    public void test1() {
        System.out.println("------------------");
    }

}
