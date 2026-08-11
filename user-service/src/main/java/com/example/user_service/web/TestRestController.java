package com.example.user_service.web;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class TestRestController {
        
    @GetMapping("/test")
    @PreAuthorize("hasAuthority('ROLE_CLIENT')")
    public void test(Authentication authentication) {
        System.out.println("*************" + authentication.getAuthorities());
    }
    @GetMapping("/test2")
    public void test2(Authentication authentication) {
                System.out.println("*************" + authentication.getAuthorities());

    }


    @GetMapping("/test1") 
    @PreAuthorize("hasAuthority('SELLER')")
    public void test1() {
        System.out.println("------------------");
    }

}
