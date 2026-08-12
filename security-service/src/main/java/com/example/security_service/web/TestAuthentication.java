package com.example.security_service.web;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestAuthentication {
    
    @GetMapping("/test")
    @PreAuthorize("hasAuthority('SCOPE_ROLE_CLIENT')")
    public String test(Authentication authentication) {
         System.out.println("++++++++++++++++++++ " + authentication.getName() + authentication.getAuthorities());
         return "hello world";
    }

    @GetMapping("/test2")
    public void test2(Authentication authentication) {
              System.out.println("++++++++++++++++++++ " + authentication.getName() + authentication.getAuthorities());

    }

    @GetMapping("/test1")
    @PreAuthorize("hasAuthority('SCOPE_SELLER')")
    public String test1(Authentication authentication) {
         System.out.println("++++++++++++++++++++ " + authentication.getName() + authentication.getAuthorities());
         return "hello world";
    }
}
