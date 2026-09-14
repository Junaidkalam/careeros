package com.careeros;

import com.careeros.adzuna.AdzunaClient;
import com.careeros.adzuna.AdzunaClientException;
import com.careeros.adzuna.AdzunaJob;
import com.careeros.dto.JobDiscoveryResponse;
import com.careeros.entity.CandidateProfile;
import com.careeros.entity.CandidateSkill;
import com.careeros.entity.Job;
import com.careeros.entity.Resume;
import com.careeros.entity.User;
import com.careeros.repository.CandidateProfileRepository;
import com.careeros.repository.CandidateSkillRepository;
import com.careeros.repository.JobRepository;
import com.careeros.repository.ResumeRepository;
import com.careeros.service.JobDiscoveryService;
import com.careeros.service.MatchService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

/**
 * Unit tests for JobDiscoveryService.
 *
 * Uses Mockito so no Spring context is needed — Adzuna is always mocked (never called for real).
 *
 * Three cases:
 * 1. Results map correctly from Adzuna → JobRequest, match scoring runs
 * 2. A job whose redirect_url already exists in saved jobs is deduplicated (excluded)
 * 3. Missing credentials → clean empty-state response, no exception
 */
@ExtendWith(MockitoExtension.class)
class JobDiscoveryServiceTest {

    @Mock private AdzunaClient adzunaClient;
    @Mock private ResumeRepository resumeRepository;
    @Mock private CandidateProfileRepository candidateProfileRepository;
    @Mock private CandidateSkillRepository candidateSkillRepository;
    @Mock private JobRepository jobRepository;
    @Mock private MatchService matchService;
    @Mock private com.careeros.service.JobExtractionService jobExtractionService;

    @InjectMocks private JobDiscoveryService discoveryService;

    private User user;
    private Resume resume;
    private CandidateProfile profile;
    private CandidateSkill javaSkill;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setEmail("test@example.com");
        user.setName("Test");

        resume = new Resume();
        resume.setFilename("cv.pdf");

        profile = new CandidateProfile();
        profile.setResume(resume);
        profile.setPrimaryRole("Java Developer");
        profile.setExperienceYears(3.0);

        javaSkill = new CandidateSkill();
        javaSkill.setSkillName("Java");
        javaSkill.setCandidateProfile(profile);

        com.careeros.dto.JobRequest extractionDraft = new com.careeros.dto.JobRequest(
                null, null, null, null, null, null, null, null, null, null, 3.0, List.of("Java"), List.of("Spring Boot")
        );
        com.careeros.dto.JobExtractionResponse extractionResp = new com.careeros.dto.JobExtractionResponse(extractionDraft, false, null);
        org.mockito.Mockito.lenient().when(jobExtractionService.extractFromText(anyString(), any())).thenReturn(extractionResp);
    }

    // -------------------------------------------------------------------------
    // 1. Happy path: results map correctly, match scoring runs
    // -------------------------------------------------------------------------

    @Test
    void discover_mapsAdzunaJobsToJobRequestAndScoresThem() {
        AdzunaJob adzunaJob = new AdzunaJob(
                "Java Developer",
                "Acme Corp",
                "London",
                "Full-time",
                "Looking for a Java developer with Spring Boot experience.",
                "https://adzuna.com/jobs/123",
                "£50k – £65k",
                LocalDate.of(2026, 9, 1)
        );

        when(adzunaClient.isConfigured()).thenReturn(true);
        when(resumeRepository.findByUserOrderByCreatedAtDesc(user)).thenReturn(List.of(resume));
        when(candidateProfileRepository.findByResumeId(any())).thenReturn(Optional.of(profile));
        when(candidateSkillRepository.findByCandidateProfileId(any())).thenReturn(List.of(javaSkill));
        when(adzunaClient.search(anyString(), anyInt())).thenReturn(List.of(adzunaJob));
        when(jobRepository.existsByUserAndPostingUrl(any(), any())).thenReturn(false);

        // Mock LLM extraction
        com.careeros.dto.JobRequest extractionDraft = new com.careeros.dto.JobRequest(
                null, null, null, null, null, null, null, null, null, null, 3.0, List.of("Java"), List.of("Spring Boot")
        );
        com.careeros.dto.JobExtractionResponse extractionResp = new com.careeros.dto.JobExtractionResponse(extractionDraft, false, null);
        when(jobExtractionService.extractFromText(anyString(), anyString())).thenReturn(extractionResp);

        // Return a dummy MatchResult — tests that it gets wired through correctly
        com.careeros.dto.MatchResult fakeMatch = new com.careeros.dto.MatchResult(
                75, List.of("Java"), List.of(), List.of("Spring Boot"), "Required: 3.0 years — Strong");
        when(matchService.calculate(any(), anyList(), any(), anyList())).thenReturn(fakeMatch);

        List<JobDiscoveryResponse> results = discoveryService.discover(user);

        assertThat(results).hasSize(1);
        JobDiscoveryResponse r = results.get(0);

        // noResultReason must be null (this is a real result)
        assertThat(r.noResultReason()).isNull();
        assertThat(r.source()).isEqualTo("Adzuna");
        assertThat(r.matchScore()).isEqualTo(75);
        assertThat(r.matchedSkills()).containsExactly("Java");
        assertThat(r.missingSkills()).containsExactly("Spring Boot");

        // Verify the draft JobRequest is correctly mapped
        assertThat(r.draft()).isNotNull();
        assertThat(r.draft().title()).isEqualTo("Java Developer");    // HTML stripped
        assertThat(r.draft().companyName()).isEqualTo("Acme Corp");
        assertThat(r.draft().location()).isEqualTo("London");
        assertThat(r.draft().employmentType()).isEqualTo("Full-time");
        assertThat(r.draft().postingUrl()).isEqualTo("https://adzuna.com/jobs/123");
        assertThat(r.draft().source()).isEqualTo("Adzuna");
        assertThat(r.draft().salaryRange()).isEqualTo("£50k – £65k");
        assertThat(r.draft().postedDate()).isEqualTo(LocalDate.of(2026, 9, 1));
    }

    // -------------------------------------------------------------------------
    // 2. Deduplication: job whose URL is already saved must be excluded
    // -------------------------------------------------------------------------

    @Test
    void discover_excludesJobsAlreadySavedByUrl() {
        String savedUrl = "https://adzuna.com/jobs/already-saved";
        String newUrl = "https://adzuna.com/jobs/new-job";

        AdzunaJob alreadySaved = new AdzunaJob("Old Role", "Old Co", "Leeds", null,
                "desc", savedUrl, null, null);
        AdzunaJob newJob = new AdzunaJob("New Role", "New Co", "Manchester", "Full-time",
                "desc", newUrl, null, null);

        when(adzunaClient.isConfigured()).thenReturn(true);
        when(resumeRepository.findByUserOrderByCreatedAtDesc(user)).thenReturn(List.of(resume));
        when(candidateProfileRepository.findByResumeId(any())).thenReturn(Optional.of(profile));
        when(candidateSkillRepository.findByCandidateProfileId(any())).thenReturn(List.of(javaSkill));
        when(adzunaClient.search(anyString(), anyInt())).thenReturn(List.of(alreadySaved, newJob));

        // First URL is already saved; second is new
        when(jobRepository.existsByUserAndPostingUrl(user, savedUrl)).thenReturn(true);
        when(jobRepository.existsByUserAndPostingUrl(user, newUrl)).thenReturn(false);

        com.careeros.dto.MatchResult fakeMatch = new com.careeros.dto.MatchResult(
                50, List.of(), List.of(), List.of(), "Not specified");
        when(matchService.calculate(any(), anyList(), any(), anyList())).thenReturn(fakeMatch);

        List<JobDiscoveryResponse> results = discoveryService.discover(user);

        // Only the new (non-duplicate) job should be returned
        assertThat(results).hasSize(1);
        assertThat(results.get(0).draft().postingUrl()).isEqualTo(newUrl);
        assertThat(results.get(0).draft().title()).isEqualTo("New Role");
    }

    // -------------------------------------------------------------------------
    // 3. Missing credentials → structured empty-state, no exception
    // -------------------------------------------------------------------------

    @Test
    void discover_missingCredentials_returnsEmptyStateResponse() {
        when(adzunaClient.isConfigured()).thenReturn(false);

        List<JobDiscoveryResponse> results = discoveryService.discover(user);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).noResultReason()).isEqualTo("notConfigured");
        assertThat(results.get(0).draft()).isNull();
        assertThat(results.get(0).warning()).isNotBlank();
    }

    // -------------------------------------------------------------------------
    // 4. Adzuna API error → structured empty-state, no exception
    // -------------------------------------------------------------------------

    @Test
    void discover_adzunaApiError_returnsEmptyStateResponse() {
        when(adzunaClient.isConfigured()).thenReturn(true);
        when(resumeRepository.findByUserOrderByCreatedAtDesc(user)).thenReturn(List.of(resume));
        when(candidateProfileRepository.findByResumeId(any())).thenReturn(Optional.of(profile));
        when(candidateSkillRepository.findByCandidateProfileId(any())).thenReturn(List.of());
        when(adzunaClient.search(anyString(), anyInt()))
                .thenThrow(new AdzunaClientException("HTTP 401 Unauthorized"));

        List<JobDiscoveryResponse> results = discoveryService.discover(user);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).noResultReason()).isEqualTo("apiError");
        assertThat(results.get(0).warning()).contains("HTTP 401");
    }

    // -------------------------------------------------------------------------
    // 5. Query builder — verify primaryRole + top skills are combined
    // -------------------------------------------------------------------------

    @Test
    void buildQuery_combinesPrimaryRoleAndTopTwoSkills() {
        CandidateSkill spring = new CandidateSkill();
        spring.setSkillName("Spring Boot");
        CandidateSkill k8s = new CandidateSkill();
        k8s.setSkillName("Kubernetes");
        CandidateSkill sql = new CandidateSkill();
        sql.setSkillName("SQL");

        String query = discoveryService.buildQuery(profile, List.of(spring, k8s, sql));

        // Should be "Java Developer Spring Boot Kubernetes" — primary role + first 2 skills only
        assertThat(query).isEqualTo("Java Developer Spring Boot Kubernetes");
    }
}
