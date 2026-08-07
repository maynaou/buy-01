// package com.example.security_service.config;

// import com.example.security_service.entities.Auth;

// import org.springframework.security.core.GrantedAuthority;
// import org.springframework.security.core.authority.SimpleGrantedAuthority;
// import org.springframework.security.core.userdetails.UserDetails;

// import java.util.Collection;
// import java.util.List;

// public class CustomUserDetails implements UserDetails {
    
//     private final Auth user;

//     public CustomUserDetails(Auth user) {
//         this.user = user;
//     }

//     public String getId() {
//         return user.getId();
//     }

//     // public String getRole() {
//     //     return user.getRole();
//     // }

//     @Override
//     public Collection<? extends GrantedAuthority> getAuthorities() {
//         return List.of(
//                 new SimpleGrantedAuthority("ROLE_" + user.getRole())
//         );
//     }

//     @Override
//     public String getPassword() {
//         return user.getPassword();
//     }

//     @Override
//     public String getUsername() {
//         return user.getUsername();
//     }

// }
