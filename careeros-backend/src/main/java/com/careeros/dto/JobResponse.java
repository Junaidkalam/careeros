package com.careeros.dto;

import com.careeros.entity.enums.WorkMode;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record JobResponse(
        UUID id,
        String title,
        String companyName,
        String location,
        WorkMode workMode,
        String employmentType,
        String description,
        String postingUrl,
        String source,
        LocalDate postedDate,
        String salaryRange,
        boolean reviewed,
        Double requiredExperienceYears,
        List<String> requiredSkills,
        List<String> preferredSkills
) {}
