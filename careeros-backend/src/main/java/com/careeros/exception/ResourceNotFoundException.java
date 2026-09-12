package com.careeros.exception;

/**
 * Thrown when a requested resource does not exist or is not owned by the
 * requesting user. Always maps to HTTP 404 - intentionally indistinguishable
 * from "not found" to prevent ownership leakage.
 */
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}