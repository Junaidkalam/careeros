package com.careeros.dto;

import java.util.List;

/**
 * One entry in the job-discovery response from GET /api/jobs/discover.
 *
 * <p>{@code draft} is a pre-filled {@link JobRequest} that the user can review,
 * edit, and then POST to {@code /api/jobs} to save it permanently.
 * Nothing is auto-saved by the discovery endpoint itself.
 *
 * <p>When there are no results due to a setup issue, a single entry is returned
 * with {@code noResultReason} set and {@code draft} null.
 *
 * @param noResultReason "noResume" | "noProfile" | "notConfigured" | "apiError" | null
 * @param warning        non-fatal advisory message (e.g. "Adzuna credentials missing")
 */
public record JobDiscoveryResponse(
        JobRequest draft,          // null when noResultReason is set
        Integer matchScore,
        List<String> matchedSkills,
        List<String> missingSkills,
        String reasonSummary,
        String source,             // always "Adzuna" for now
        String noResultReason,
        String warning
) {
    /** Convenience factory for empty-state responses. */
    public static JobDiscoveryResponse empty(String reason, String warning) {
        return new JobDiscoveryResponse(null, null, List.of(), List.of(), null, null, reason, warning);
    }

    /** Convenience factory for a real discovery result. */
    public static JobDiscoveryResponse result(JobRequest draft, Integer matchScore,
                                               List<String> matched, List<String> missing,
                                               String summary) {
        return new JobDiscoveryResponse(draft, matchScore, matched, missing, summary, "Adzuna", null, null);
    }
}
