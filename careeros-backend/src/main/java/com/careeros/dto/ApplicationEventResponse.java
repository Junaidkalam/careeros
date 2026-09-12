package com.careeros.dto;

import com.careeros.entity.enums.EventType;
import java.time.Instant;
import java.util.UUID;

public record ApplicationEventResponse(
        UUID id,
        EventType eventType,
        String note,
        Instant createdAt
) {}