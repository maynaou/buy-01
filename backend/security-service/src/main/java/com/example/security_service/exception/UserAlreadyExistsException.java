package com.example.security_service.exception;

public class UserAlreadyExistsException extends RuntimeException {
    
    public UserAlreadyExistsException(String message) {
         super(message);
    }
    
}
