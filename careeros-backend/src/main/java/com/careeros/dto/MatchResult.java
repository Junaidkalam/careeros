package com.careeros.dto;

import java.util.List;

public record MatchResult(
        int overallScore,
        List<String> matchedSkills,
        List<String> partialMatches,
        List<String> missingSkills,
        String experienceAssessment
) {}