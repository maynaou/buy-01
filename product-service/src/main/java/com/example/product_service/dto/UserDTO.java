package com.example.product_service.dto;

import lombok.Data;

@Data
public class UserDTO {
       private String id;
       private String name;
       private String email;
       private String password;
       private String role;
       private String avatar;
}
