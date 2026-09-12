package com.careeros.dto;

import com.careeros.entity.enums.WorkMode;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;
import java.util.List;

/** Payload for creating/updating a job - used for both manual entry and the
 *  post-extraction review form (same shape, since the user can edit either way). */
public record JobRequest(
        @NotBlank String title,
        String companyName,
        String location,
        WorkMode workMode,
        String employmentType,
        String description,
        String postingUrl,
        String source,
        LocalDate postedDate,
        String salaryRange,
        Double requiredExperienceYears,
        List<String> requiredSkills,
        List<String> preferredSkills
) {}
