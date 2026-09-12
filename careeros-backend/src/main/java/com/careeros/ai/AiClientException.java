package com.careeros.ai;

/**
 * Thrown by {@link AiClient} when the API call cannot complete successfully.
 * Deliberately a runtime exception so callers can choose to catch it selectively
 * (e.g. JobExtractionService) without forcing every call site to declare it.
 */
public class AiClientException extends RuntimeException {

    public AiClientException(String message) {
        super(message);
    }

    public AiClientException(String message, Throwable cause) {
        super(message, cause);
    }
}