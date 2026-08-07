package com.example.security_service.web;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestAuthentication {
    
    @GetMapping("/test")
    public String test(Authentication authentication) {
         System.out.println("++++++++++++++++++++ " + authentication.getName() + authentication.getAuthorities());
         return "hello world";
    }
}
