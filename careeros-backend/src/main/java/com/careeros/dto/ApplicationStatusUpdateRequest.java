package com.careeros.dto;

import com.careeros.entity.enums.ApplicationStatus;
import jakarta.validation.constraints.NotNull;

public record ApplicationStatusUpdateRequest(
        @NotNull ApplicationStatus status,
        String note
) {}