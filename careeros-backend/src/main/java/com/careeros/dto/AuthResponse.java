package com.careeros.dto;

/**
 * Response body returned by both /api/auth/register and /api/auth/login.
 */
public record AuthResponse(
        String token,
        String email,
        String name
) {}