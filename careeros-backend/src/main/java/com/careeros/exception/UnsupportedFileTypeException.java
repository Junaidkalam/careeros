package com.careeros.exception;

/**
 * Thrown when a resume file is uploaded with an unsupported extension or MIME type.
 * Mapped to HTTP 400 in {@link GlobalExceptionHandler}.
 */
public class UnsupportedFileTypeException extends RuntimeException {
    public UnsupportedFileTypeException(String message) {
        super(message);
    }
}