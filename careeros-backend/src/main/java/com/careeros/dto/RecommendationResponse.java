package com.careeros.dto;

import java.util.List;
import java.util.UUID;

/**
 * One entry in the recommendations list returned by GET /api/recommendations.
 *
 * <p>When there are no recommendations due to a setup issue (no resume, no saved jobs),
 * a single entry is returned with the lists empty, matchScore 0, and {@code noResultReason}
 * explaining why.
 *
 * @param noResultReason "noResume" | "noSavedJobs" | null (null means a real recommendation)
 */
public record RecommendationResponse(
        UUID jobId,
        String jobTitle,
        String companyName,
        int matchScore,
        List<String> matchedSkills,
        List<String> missingSkills,
        String reasonSummary,
        String noResultReason,
        String resumeFilename,
        String resumeVersionLabel
) {}