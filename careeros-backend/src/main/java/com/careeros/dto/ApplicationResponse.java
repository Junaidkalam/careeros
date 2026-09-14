package com.careeros.dto;

import com.careeros.entity.enums.ApplicationStatus;
import java.time.Instant;
import java.util.UUID;

public record ApplicationResponse(
        UUID id,
        UUID jobId,
        String jobTitle,
        String companyName,
        UUID resumeId,
        ApplicationStatus status,
        Integer matchScore,
        MatchResult matchResult,
        String notes,
        java.time.LocalDate followUpDate,
        Instant createdAt
) {}