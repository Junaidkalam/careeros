package com.careeros.service;

import com.careeros.adzuna.AdzunaClient;
import com.careeros.adzuna.AdzunaClientException;
import com.careeros.adzuna.AdzunaJob;
import com.careeros.dto.JobDiscoveryResponse;
import com.careeros.dto.JobRequest;
import com.careeros.dto.MatchResult;
import com.careeros.entity.CandidateProfile;
import com.careeros.entity.CandidateSkill;
import com.careeros.entity.Job;
import com.careeros.entity.JobSkill;
import com.careeros.entity.Resume;
import com.careeros.entity.User;
import com.careeros.repository.CandidateProfileRepository;
import com.careeros.repository.CandidateSkillRepository;
import com.careeros.repository.JobRepository;
import com.careeros.repository.ResumeRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Discovers external job listings via Adzuna, scores them against the user's
 * most-recent CandidateProfile, deduplicates against already-saved jobs, and
 * returns a ranked review-only list — nothing is auto-saved.
 *
 * <p>All edge cases (no resume, no profile, missing credentials, API error)
 * return a structured empty-state response rather than throwing HTTP 500.
 */
@Service
@RequiredArgsConstructor
public class JobDiscoveryService {

    private static final Logger log = LoggerFactory.getLogger(JobDiscoveryService.class);
    private static final int MAX_RESULTS = 20;

    private final AdzunaClient adzunaClient;
    private final ResumeRepository resumeRepository;
    private final CandidateProfileRepository candidateProfileRepository;
    private final CandidateSkillRepository candidateSkillRepository;
    private final JobRepository jobRepository;
    private final MatchService matchService;
    private final JobExtractionService jobExtractionService;

    /**
     * Main entry point.
     *
     * @param user the authenticated user
     * @return ranked discovery results, or a single-item list explaining why results are empty
     */
    public List<JobDiscoveryResponse> discover(User user) {
        // 1. Guard: Adzuna credentials
        if (!adzunaClient.isConfigured()) {
            log.warn("Job discovery requested but Adzuna credentials are not configured");
            return List.of(JobDiscoveryResponse.empty(
                    "notConfigured",
                    "Adzuna credentials are not configured. Set ADZUNA_APP_ID and ADZUNA_APP_KEY."));
        }

        // 2. Most-recent resume
        List<Resume> resumes = resumeRepository.findByUserOrderByCreatedAtDesc(user);
        if (resumes.isEmpty()) {
            return List.of(JobDiscoveryResponse.empty("noResume",
                    "Upload a resume first — discovery uses your skills and role to search."));
        }
        Resume resume = resumes.get(0);

        // 3. CandidateProfile (may be null if AI parsing failed/skipped)
        CandidateProfile profile = candidateProfileRepository
                .findByResumeId(resume.getId()).orElse(null);

        if (profile == null) {
            return List.of(JobDiscoveryResponse.empty("noProfile",
                    "Your resume hasn't been parsed into a candidate profile yet. " +
                    "Re-upload your resume to trigger profile generation."));
        }

        List<CandidateSkill> candidateSkills =
                candidateSkillRepository.findByCandidateProfileId(profile.getId());

        // 4. Build search query: primaryRole + top 2 skills (highest-signal terms)
        String query = buildQuery(profile, candidateSkills);
        log.info("Adzuna discovery query: '{}' for user {}", query, user.getId());

        // 5. Call Adzuna
        List<AdzunaJob> adzunaJobs;
        try {
            adzunaJobs = adzunaClient.search(query, MAX_RESULTS);
        } catch (AdzunaClientException e) {
            log.error("Adzuna API error during discovery: {}", e.getMessage());
            return List.of(JobDiscoveryResponse.empty("apiError",
                    "Adzuna API error: " + e.getMessage()));
        }

        if (adzunaJobs.isEmpty()) {
            return List.of(JobDiscoveryResponse.empty("noResults",
                    "Adzuna returned no jobs for query: \"" + query + "\". Try broadening your skills."));
        }

        // 6. Score and deduplicate
        List<JobDiscoveryResponse> results = adzunaJobs.parallelStream().map(adzunaJob -> {
            // Dedupe: skip if this URL is already in the user's saved jobs
            if (adzunaJob.redirectUrl() != null
                    && jobRepository.existsByUserAndPostingUrl(user, adzunaJob.redirectUrl())) {
                log.debug("Skipping already-saved job: {}", adzunaJob.redirectUrl());
                return null;
            }

            // Map base fields from Adzuna API
            JobRequest baseDraft = toJobRequest(adzunaJob);

            // Extract real skills from raw description using LLM
            com.careeros.dto.JobExtractionResponse extraction = 
                jobExtractionService.extractFromText(adzunaJob.description(), adzunaJob.redirectUrl());

            JobRequest draft;
            Job syntheticJob = toSyntheticJob(adzunaJob, profile);
            List<JobSkill> jobSkills = new ArrayList<>();

            if (extraction.draft() != null && extraction.warning() == null) {
                // Merge LLM skills into the Adzuna draft
                draft = new JobRequest(
                        baseDraft.title(),
                        baseDraft.companyName(),
                        baseDraft.location(),
                        extraction.draft().workMode() != null ? extraction.draft().workMode() : baseDraft.workMode(),
                        baseDraft.employmentType(),
                        baseDraft.description(),
                        baseDraft.postingUrl(),
                        baseDraft.source(),
                        baseDraft.postedDate(),
                        baseDraft.salaryRange(),
                        extraction.draft().requiredExperienceYears(),
                        extraction.draft().requiredSkills(),
                        extraction.draft().preferredSkills()
                );
                
                syntheticJob.setRequiredExperienceYears(extraction.draft().requiredExperienceYears());
                
                // Convert string lists to JobSkill entities for the matcher
                if (draft.requiredSkills() != null) {
                    draft.requiredSkills().forEach(s -> {
                        JobSkill js = new JobSkill();
                        js.setSkillName(s);
                        js.setSkillType(com.careeros.entity.enums.SkillType.REQUIRED);
                        jobSkills.add(js);
                    });
                }
                if (draft.preferredSkills() != null) {
                    draft.preferredSkills().forEach(s -> {
                        JobSkill js = new JobSkill();
                        js.setSkillName(s);
                        js.setSkillType(com.careeros.entity.enums.SkillType.PREFERRED);
                        jobSkills.add(js);
                    });
                }
                
                MatchResult match = matchService.calculate(profile, candidateSkills, syntheticJob, jobSkills);
                String summary = RecommendationService.buildReasonSummary(match);
                return JobDiscoveryResponse.result(draft, match.overallScore(),
                        match.matchedSkills(), match.missingSkills(), summary);
            } else {
                // LLM extraction failed. Yield a result with null matchScore and a specific reason.
                draft = baseDraft;
                String summary = "Insufficient data to score \u2014 job description too short or complex.";
                return new JobDiscoveryResponse(draft, null, List.of(), List.of(), summary, "Adzuna", null, null);
            }
        })
        .filter(java.util.Objects::nonNull)
        .collect(java.util.stream.Collectors.toList());

        if (results.isEmpty()) {
            return List.of(JobDiscoveryResponse.empty("allDeduplicated",
                    "All discovered jobs are already in your tracker."));
        }

        // 7. Sort descending by matchScore
        results.sort(Comparator.comparing((JobDiscoveryResponse j) -> j.matchScore() == null ? -1 : j.matchScore()).reversed());
        return results;
    }

    /**
     * Builds the Adzuna search query from the user's profile.
     * Uses primaryRole as the anchor, augmented with the first 2 candidate skills.
     */
    public String buildQuery(CandidateProfile profile, List<CandidateSkill> skills) {
        StringBuilder sb = new StringBuilder();

        if (profile.getPrimaryRole() != null && !profile.getPrimaryRole().isBlank()) {
            sb.append(profile.getPrimaryRole().trim());
        }

        // Append up to 2 top skills to sharpen the query
        int added = 0;
        for (CandidateSkill skill : skills) {
            if (added >= 2) break;
            if (skill.getSkillName() != null && !skill.getSkillName().isBlank()) {
                if (!sb.isEmpty()) sb.append(" ");
                sb.append(skill.getSkillName().trim());
                added++;
            }
        }

        // Fallback if profile has no role and no skills
        if (sb.isEmpty()) {
            sb.append("software developer");
        }

        return sb.toString();
    }

    private JobRequest toJobRequest(AdzunaJob aj) {
        return new JobRequest(
                aj.title(),
                aj.company(),
                aj.location(),
                null,                    // workMode — Adzuna doesn't reliably provide this
                aj.employmentType(),
                aj.description(),
                aj.redirectUrl(),        // postingUrl
                "Adzuna",               // source
                aj.postedDate(),
                aj.salaryRange(),
                null,                    // requiredExperienceYears — not in Adzuna response
                List.of(),              // requiredSkills — inferred from description by user
                List.of()               // preferredSkills
        );
    }

    /**
     * Creates a transient (unsaved) Job entity from an Adzuna result so MatchService
     * can compute experience-alignment without persisting anything.
     */
    private Job toSyntheticJob(AdzunaJob aj, CandidateProfile profile) {
        Job j = new Job();
        j.setTitle(aj.title());
        j.setDescription(aj.description());
        // No requiredExperienceYears from Adzuna → MatchService treats it as "not specified"
        // which scores 100 on the experience dimension
        return j;
    }
}
