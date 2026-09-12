package com.careeros.dto;

import java.util.List;

/**
 * AI-generated candidate profile, nested inside {@link ResumeResponse}.
 * Null when profile generation failed.
 */
public record CandidateProfileDto(
        String summary,
        Double experienceYears,
        String primaryRole,
        String education,
        List<CandidateSkillDto> skills
) {}