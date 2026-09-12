package com.careeros.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record ApplicationCreateRequest(
        @NotNull UUID jobId,
        @NotNull UUID resumeId,
        String notes
) {}