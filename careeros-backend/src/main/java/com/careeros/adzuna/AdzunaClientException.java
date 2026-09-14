package com.careeros.adzuna;

/** Thrown when the Adzuna API returns an error or cannot be reached. */
public class AdzunaClientException extends RuntimeException {
    public AdzunaClientException(String message) {
        super(message);
    }

    public AdzunaClientException(String message, Throwable cause) {
        super(message, cause);
    }
}
