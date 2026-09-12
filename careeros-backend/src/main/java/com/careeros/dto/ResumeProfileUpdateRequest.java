package com.careeros.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;

/**
 * Body for PUT /api/resumes/{id}/profile.
 * Lets the user correct AI-generated profile data -
 * a core principle: AI output must be user-editable, not authoritative.
 */
public record ResumeProfileUpdateRequest(
        String summary,
        Double experienceYears,
        String primaryRole,
        String education,
        @NotNull List<CandidateSkillDto> skills
) {}