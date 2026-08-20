package com.example.media_service.exception;

public class MediaNotFoundException extends RuntimeException {
     public MediaNotFoundException(String message) {
           super(message);
     }
}
