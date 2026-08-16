package com.example.security_service.exception;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<Map<String, String>> handleValidationErrors(
                        MethodArgumentNotValidException ex) {

                Map<String, String> errors = new HashMap<>();

                ex.getBindingResult()
                                .getFieldErrors()
                                .forEach(error -> errors.put(error.getField(), error.getDefaultMessage()));

                return ResponseEntity
                                .status(HttpStatus.BAD_REQUEST)
                                .body(errors);
        }

        @ExceptionHandler(UserAlreadyExistsException.class)
        public ResponseEntity<ApiError> handleUsernameExists(UserAlreadyExistsException ex) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                                .body(new ApiError("USER_TAKEN", ex.getMessage()));
        }

        @ExceptionHandler(UserNotFoundException.class)
        public ResponseEntity<ApiError> handleUserNotFound(UserNotFoundException ex) {
                return ResponseEntity
                                .status(HttpStatus.UNAUTHORIZED)
                                .body(new ApiError("UNAUTHORIZED", ex.getMessage()));
        }

        @ExceptionHandler(InvalidRefreshTokenException.class)
        public ResponseEntity<ApiError> handleInvalidRefreshToken(InvalidRefreshTokenException ex) {
                return ResponseEntity
                                .status(HttpStatus.UNAUTHORIZED)
                                .body(new ApiError("UNAUTHORIZED", ex.getMessage()));
        }
}
