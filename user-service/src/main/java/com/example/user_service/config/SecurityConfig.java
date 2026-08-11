package com.example.user_service.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {


    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, AuthenticationFilter authentication) { 

        return http
               .csrf(csrf -> csrf.disable())
               .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
               .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))
             //    .httpBasic(basic -> basic.disable())
               .authorizeHttpRequests(auth -> auth.requestMatchers("/h2-console/**",   "/v3/api-docs/**",
                            "/swagger-ui/**").permitAll()
               .anyRequest().authenticated())
               .addFilterBefore(authentication, UsernamePasswordAuthenticationFilter.class)
            //    .formLogin(form -> form.disable()) 
               .build();

    }
    
}
