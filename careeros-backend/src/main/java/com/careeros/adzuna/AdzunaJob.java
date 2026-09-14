package com.careeros.adzuna;

import java.time.LocalDate;

/**
 * Parsed result from a single Adzuna job listing.
 * This is an internal model; the service maps it to {@link com.careeros.dto.JobRequest}.
 */
public record AdzunaJob(
        String title,
        String company,
        String location,
        String employmentType,
        String description,
        String redirectUrl,    // used as postingUrl — also the dedupe key
        String salaryRange,
        LocalDate postedDate
) {}
