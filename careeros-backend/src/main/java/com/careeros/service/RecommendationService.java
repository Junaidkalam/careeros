package com.careeros.service;

import com.careeros.dto.MatchResult;
import com.careeros.dto.RecommendationResponse;
import com.careeros.entity.Application;
import com.careeros.entity.CandidateProfile;
import com.careeros.entity.CandidateSkill;
import com.careeros.entity.Job;
import com.careeros.entity.JobSkill;
import com.careeros.entity.Resume;
import com.careeros.entity.User;
import com.careeros.entity.enums.ApplicationStatus;
import com.careeros.repository.ApplicationRepository;
import com.careeros.repository.CandidateProfileRepository;
import com.careeros.repository.CandidateSkillRepository;
import com.careeros.repository.JobRepository;
import com.careeros.repository.JobSkillRepository;
import com.careeros.repository.ResumeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Produces ranked job recommendations for the current user.
 *
 * <p>Algorithm:
 * <ol>
 *   <li>Find the user's most-recently-uploaded resume (by createdAt desc).</li>
 *   <li>Load its CandidateProfile + CandidateSkills.</li>
 *   <li>Find all saved jobs; exclude any whose Application status is beyond SAVED
 *       (APPLIED, INTERVIEW, OFFER, etc.).</li>
 *   <li>Run {@link MatchService#calculate} for each eligible job.</li>
 *   <li>Sort descending by overallScore.</li>
 * </ol>
 *
 * <p>Edge cases never throw: they return a single-item list with {@code noResultReason} set.
 */
@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final ResumeRepository resumeRepository;
    private final CandidateProfileRepository candidateProfileRepository;
    private final CandidateSkillRepository candidateSkillRepository;
    private final JobRepository jobRepository;
    private final JobSkillRepository jobSkillRepository;
    private final ApplicationRepository applicationRepository;
    private final MatchService matchService;

    public List<RecommendationResponse> getRecommendations(User user) {
        // 1. Most-recent resume
        List<Resume> resumes = resumeRepository.findByUserOrderByCreatedAtDesc(user);
        if (resumes.isEmpty()) {
            return List.of(empty("noResume"));
        }
        Resume resume = resumes.get(0);

        // 2. Profile + skills (profile may be null if AI parsing failed)
        CandidateProfile profile = candidateProfileRepository
                .findByResumeId(resume.getId()).orElse(null);
        List<CandidateSkill> candidateSkills = profile != null
                ? candidateSkillRepository.findByCandidateProfileId(profile.getId())
                : List.of();

        // 3. All saved jobs, filter out already-applied-past-SAVED
        List<Job> allJobs = jobRepository.findByUserOrderByCreatedAtDesc(user);
        if (allJobs.isEmpty()) {
            return List.of(empty("noSavedJobs"));
        }

        // Build a map: jobId -> application status (only for jobs that have applications)
        List<Application> existingApps = applicationRepository.findByUserAndJobIn(user, allJobs);
        Map<UUID, ApplicationStatus> appStatusByJobId = existingApps.stream()
                .collect(Collectors.toMap(
                        a -> a.getJob().getId(),
                        Application::getStatus,
                        // If somehow multiple apps exist per job, keep the most advanced one
                        (s1, s2) -> s1.ordinal() >= s2.ordinal() ? s1 : s2
                ));

        // Eligible = no application yet OR application is still SAVED (not yet submitted)
        List<Job> eligibleJobs = allJobs.stream()
                .filter(job -> {
                    ApplicationStatus status = appStatusByJobId.get(job.getId());
                    return status == null || status == ApplicationStatus.SAVED;
                })
                .toList();

        if (eligibleJobs.isEmpty()) {
            return List.of(empty("noSavedJobs"));
        }

        // 4. Score each eligible job and sort descending
        return eligibleJobs.stream()
                .map(job -> {
                    List<JobSkill> jobSkills = jobSkillRepository.findByJobId(job.getId());
                    MatchResult match = matchService.calculate(profile, candidateSkills, job, jobSkills);
                    String summary = buildReasonSummary(match);
                    return new RecommendationResponse(
                            job.getId(),
                            job.getTitle(),
                            job.getCompany() != null ? job.getCompany().getName() : null,
                            match.overallScore(),
                            match.matchedSkills(),
                            match.missingSkills(),
                            summary,
                            null,
                            resume.getFilename(),
                            resume.getVersionLabel()
                    );
                })
                .sorted(Comparator.comparingInt(RecommendationResponse::matchScore).reversed())
                .toList();
    }

    /**
     * Builds a deterministic, human-readable reason string from the match result.
     * No LLM calls -- purely rule-based. Public to allow direct unit testing.
     */
    public static String buildReasonSummary(MatchResult match) {
        int score = match.overallScore();
        List<String> matched = match.matchedSkills();

        String tier;
        if (score >= 70) {
            tier = "Strong match";
        } else if (score >= 40) {
            tier = "Good match";
        } else {
            tier = "Partial match";
        }

        if (matched.isEmpty()) {
            return tier + " \u2014 review the job requirements to identify skill gaps.";
        }

        // Take the top 3 matched skills for the summary
        List<String> topSkills = matched.stream().limit(3).toList();
        String skillsList;
        if (topSkills.size() == 1) {
            skillsList = topSkills.get(0);
        } else if (topSkills.size() == 2) {
            skillsList = topSkills.get(0) + " and " + topSkills.get(1);
        } else {
            skillsList = topSkills.get(0) + ", " + topSkills.get(1) + ", and " + topSkills.get(2);
        }

        return tier + " \u2014 your " + skillsList + " experience aligns with this role's requirements.";
    }

    private static RecommendationResponse empty(String reason) {
        return new RecommendationResponse(null, null, null, 0, List.of(), List.of(), null, reason, null, null);
    }
}