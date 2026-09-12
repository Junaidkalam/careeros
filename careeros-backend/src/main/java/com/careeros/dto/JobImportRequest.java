package com.careeros.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request body for POST /api/jobs/import.
 * The URL is validated for presence only; reachability is checked in the service.
 */
public record JobImportRequest(@NotBlank String url) {}