package com.safety.womensafety.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(org.springframework.web.bind.MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationExceptions(org.springframework.web.bind.MethodArgumentNotValidException ex) {
        String errorMsg = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .findFirst()
                .orElse("Validation failed");
        return ResponseEntity.badRequest().body(Map.of("message", errorMsg));
    }

    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> handleDataIntegrityViolationException(org.springframework.dao.DataIntegrityViolationException ex) {
        return ResponseEntity.badRequest().body(Map.of("message", "Email is already registered"));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
        String message = ex.getMessage();
        System.out.println("Exception caught: " + ex.getClass().getName());
        if (message == null) {
            message = "An error occurred";
        }
        return ResponseEntity.badRequest().body(Map.of("message", message));
    }
}
