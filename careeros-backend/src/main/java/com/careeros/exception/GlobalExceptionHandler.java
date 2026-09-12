package com.careeros.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;
import java.util.stream.Collectors;

/**
 * Maps exceptions to HTTP error responses so controllers stay clean.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /** Validation failures from @Valid. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        String detail = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return ResponseEntity.badRequest().body(Map.of(
                "status", 400,
                "error", "Validation failed",
                "detail", detail
        ));
    }

    /** Duplicate email or other domain constraint violations. */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                "status", 409,
                "error", "Conflict",
                "detail", ex.getMessage()
        ));
    }

    /** Duplicate job URL or other state conflicts in existing services. */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalState(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                "status", 409,
                "error", "Conflict",
                "detail", ex.getMessage()
        ));
    }

    /** Wrong email or password during login. */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentials(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                "status", 401,
                "error", "Unauthorized",
                "detail", ex.getMessage()
        ));
    }

    /** Resource not found or not owned by user. */
    @ExceptionHandler(com.careeros.exception.ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleResourceNotFound(com.careeros.exception.ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "status", 404,
                "error", "Not Found",
                "detail", ex.getMessage()
        ));
    }

    /** Unsupported file type uploaded. */
    @ExceptionHandler(com.careeros.exception.UnsupportedFileTypeException.class)
    public ResponseEntity<Map<String, Object>> handleUnsupportedFileType(com.careeros.exception.UnsupportedFileTypeException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "status", 400,
                "error", "Bad Request",
                "detail", ex.getMessage()
        ));
    }

    /**
     * Catch-all for any unhandled exception. Returns a structured 500 so the frontend
     * receives consistent JSON (status/error/detail) rather than Spring's default HTML page.
     * The full stack trace is logged server-side for debugging.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        // Log at ERROR so it appears prominently in the console even without file logging
        org.slf4j.LoggerFactory.getLogger(GlobalExceptionHandler.class)
                .error("Unhandled exception: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "status", 500,
                "error", "Internal Server Error",
                "detail", ex.getMessage() != null ? ex.getMessage() : "An unexpected error occurred"
        ));
    }
}