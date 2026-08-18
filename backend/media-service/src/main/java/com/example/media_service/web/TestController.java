package com.example.media_service.web;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/medias/")
public class TestController {
     
    @GetMapping("/test")
    @PreAuthorize("hasAuthority('ROLE_CLIENT')")
    public void test(Authentication authentication) {
        System.out.println("++++++++++++++++" + authentication.getAuthorities());
    }
}
