package com.careeros.dto;

/**
 * Result of job-posting URL extraction.
 *
 * <ul>
 *   <li>{@code draft} - pre-filled {@link JobRequest} for the user to review/edit,
 *       always non-null (may be a stub when extraction failed).</li>
 *   <li>{@code extractedFromJsonLd} - true when reliable schema.org JSON-LD was found.</li>
 *   <li>{@code warning} - null on full success; a human-readable reason string when
 *       extraction was partial or failed (URL unreachable, no content, LLM error).</li>
 * </ul>
 */
public record JobExtractionResponse(
        JobRequest draft,
        boolean extractedFromJsonLd,
        String warning
) {}