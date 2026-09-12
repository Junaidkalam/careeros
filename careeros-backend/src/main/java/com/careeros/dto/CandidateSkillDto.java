package com.careeros.dto;

import com.careeros.entity.enums.SkillCategory;

/**
 * Skill entry within a {@link CandidateProfileDto}.
 * Used both as response and as the editable update body.
 */
public record CandidateSkillDto(
        String skillName,
        SkillCategory category
) {}