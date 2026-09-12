package com.careeros.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * Response shape for all resume endpoints.
 *
 * <ul>
 *   <li>{@code profileGenerated} - false if the AI call failed or has not run yet</li>
 *   <li>{@code warning} - human-readable reason when {@code profileGenerated} is false</li>
 *   <li>{@code candidateProfile} - null when {@code profileGenerated} is false</li>
 * </ul>
 */
public record ResumeResponse(
        UUID id,
        String filename,
        String versionLabel,
        Instant createdAt,
        boolean profileGenerated,
        String warning,
        CandidateProfileDto candidateProfile
) {}