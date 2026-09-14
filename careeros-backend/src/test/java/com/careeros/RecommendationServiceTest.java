package com.careeros;

import com.careeros.dto.MatchResult;
import com.careeros.dto.RecommendationResponse;
import com.careeros.entity.Application;
import com.careeros.entity.CandidateProfile;
import com.careeros.entity.CandidateSkill;
import com.careeros.entity.Company;
import com.careeros.entity.Job;
import com.careeros.entity.JobSkill;
import com.careeros.entity.Resume;
import com.careeros.entity.User;
import com.careeros.entity.enums.ApplicationStatus;
import com.careeros.entity.enums.SkillCategory;
import com.careeros.entity.enums.SkillType;
import com.careeros.repository.ApplicationRepository;
import com.careeros.repository.CandidateProfileRepository;
import com.careeros.repository.CandidateSkillRepository;
import com.careeros.repository.JobRepository;
import com.careeros.repository.JobSkillRepository;
import com.careeros.repository.ResumeRepository;
import com.careeros.service.MatchService;
import com.careeros.service.RecommendationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Pure unit test for RecommendationService.
 * No Spring context, no DB -- all dependencies are mocked with Mockito.
 *
 * Verifies:
 *  - 3 saved jobs with different skill overlaps are ranked descending by match score.
 *  - A 4th job with an APPLIED application is correctly excluded.
 *  - Edge cases: no resume -> noResume, no saved jobs -> noSavedJobs.
 *  - buildReasonSummary produces expected tier prefixes.
 */
class RecommendationServiceTest {

    private ResumeRepository resumeRepo;
    private CandidateProfileRepository profileRepo;
    private CandidateSkillRepository skillRepo;
    private JobRepository jobRepo;
    private JobSkillRepository jobSkillRepo;
    private ApplicationRepository appRepo;
    private RecommendationService service;

    private User user;
    private Resume resume;
    private CandidateProfile profile;

    @BeforeEach
    void setUp() {
        resumeRepo   = mock(ResumeRepository.class);
        profileRepo  = mock(CandidateProfileRepository.class);
        skillRepo    = mock(CandidateSkillRepository.class);
        jobRepo      = mock(JobRepository.class);
        jobSkillRepo = mock(JobSkillRepository.class);
        appRepo      = mock(ApplicationRepository.class);

        service = new RecommendationService(
                resumeRepo, profileRepo, skillRepo,
                jobRepo, jobSkillRepo, appRepo,
                new MatchService()  // real rule-based service, no mocking needed
        );

        user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("test@example.com");
        user.setPasswordHash("hash");
        user.setName("Test User");

        resume = new Resume();
        resume.setId(UUID.randomUUID());
        resume.setUser(user);
        resume.setFilename("resume.pdf");
        resume.setFileUrl("path/to/resume.pdf");
        resume.setCreatedAt(Instant.now());

        profile = new CandidateProfile();
        profile.setId(UUID.randomUUID());
        profile.setResume(resume);
        profile.setExperienceYears(4.0);
    }

    // ---- Helpers ----

    private CandidateSkill skill(String name) {
        CandidateSkill s = new CandidateSkill();
        s.setCandidateProfile(profile);
        s.setSkillName(name);
        s.setCategory(SkillCategory.PROGRAMMING_LANGUAGE);
        return s;
    }

    /** Creates a Job with a real UUID so that map lookups by job ID work correctly. */
    private Job job(String title, String company) {
        Job j = new Job();
        j.setId(UUID.randomUUID());
        j.setTitle(title);
        j.setUser(user);
        Company c = new Company();
        c.setId(UUID.randomUUID());
        c.setName(company);
        j.setCompany(c);
        j.setRequiredExperienceYears(3.0);
        return j;
    }

    private JobSkill jobSkill(Job j, String name, SkillType type) {
        JobSkill js = new JobSkill();
        js.setJob(j);
        js.setSkillName(name);
        js.setSkillType(type);
        return js;
    }

    private Application application(User u, Job j, ApplicationStatus status) {
        Application a = new Application();
        a.setId(UUID.randomUUID());
        a.setUser(u);
        a.setJob(j);
        a.setStatus(status);
        return a;
    }

    // ---- Tests ----

    @Test
    void getRecommendations_returnsJobsRankedByScoreAndExcludesApplied() {
        // Candidate skills: Java, Spring Boot, SQL
        List<CandidateSkill> candSkills = List.of(
                skill("Java"), skill("Spring Boot"), skill("SQL")
        );

        // Job A: HIGH match -- requires Java, Spring Boot, SQL (all 3 match)
        Job jobA = job("Senior Backend Engineer", "Acme");
        List<JobSkill> skillsA = List.of(
                jobSkill(jobA, "Java",        SkillType.REQUIRED),
                jobSkill(jobA, "Spring Boot",  SkillType.REQUIRED),
                jobSkill(jobA, "SQL",          SkillType.REQUIRED)
        );

        // Job B: MEDIUM match -- requires Java, Python (1 of 2 required matches)
        Job jobB = job("Software Engineer", "Beta Corp");
        List<JobSkill> skillsB = List.of(
                jobSkill(jobB, "Java",   SkillType.REQUIRED),
                jobSkill(jobB, "Python", SkillType.REQUIRED)
        );

        // Job C: LOW match -- requires Go, Rust, Kubernetes (no candidate overlap)
        Job jobC = job("Systems Engineer", "Gamma Ltd");
        List<JobSkill> skillsC = List.of(
                jobSkill(jobC, "Go",         SkillType.REQUIRED),
                jobSkill(jobC, "Rust",        SkillType.REQUIRED),
                jobSkill(jobC, "Kubernetes",  SkillType.PREFERRED)
        );

        // Job D: APPLIED -- must be excluded from recommendations
        Job jobD = job("Already Applied Job", "Delta Inc");
        Application appliedApp = application(user, jobD, ApplicationStatus.APPLIED);
        List<JobSkill> skillsD = List.of(jobSkill(jobD, "Java", SkillType.REQUIRED));

        when(resumeRepo.findByUserOrderByCreatedAtDesc(user)).thenReturn(List.of(resume));
        when(profileRepo.findByResumeId(any())).thenReturn(Optional.of(profile));
        when(skillRepo.findByCandidateProfileId(any())).thenReturn(candSkills);
        when(jobRepo.findByUserOrderByCreatedAtDesc(user)).thenReturn(List.of(jobA, jobB, jobC, jobD));
        when(appRepo.findByUserAndJobIn(eq(user), any())).thenReturn(List.of(appliedApp));
        when(jobSkillRepo.findByJobId(jobA.getId())).thenReturn(skillsA);
        when(jobSkillRepo.findByJobId(jobB.getId())).thenReturn(skillsB);
        when(jobSkillRepo.findByJobId(jobC.getId())).thenReturn(skillsC);
        when(jobSkillRepo.findByJobId(jobD.getId())).thenReturn(skillsD);

        List<RecommendationResponse> results = service.getRecommendations(user);

        // Job D (APPLIED) must be excluded -> exactly 3 results
        assertThat(results).hasSize(3);
        assertThat(results).noneMatch(r -> "Already Applied Job".equals(r.jobTitle()));

        // Results must be sorted descending by matchScore
        assertThat(results.get(0).matchScore()).isGreaterThanOrEqualTo(results.get(1).matchScore());
        assertThat(results.get(1).matchScore()).isGreaterThanOrEqualTo(results.get(2).matchScore());

        // Job A (all 3 skills matched) must be first with a high score
        assertThat(results.get(0).jobTitle()).isEqualTo("Senior Backend Engineer");
        assertThat(results.get(0).matchScore()).isGreaterThan(60);

        // Job C (no skills matched) must be last
        assertThat(results.get(2).jobTitle()).isEqualTo("Systems Engineer");

        // All real recommendations have no noResultReason and a non-null reasonSummary
        assertThat(results).allMatch(r -> r.noResultReason() == null);
        assertThat(results).allMatch(r -> r.reasonSummary() != null);
    }

    @Test
    void getRecommendations_withSavedStatusApplication_includesJob() {
        Job jobSaved = job("Saved But Unapplied", "Epsilon");
        Application savedApp = application(user, jobSaved, ApplicationStatus.SAVED);

        when(resumeRepo.findByUserOrderByCreatedAtDesc(user)).thenReturn(List.of(resume));
        when(profileRepo.findByResumeId(any())).thenReturn(Optional.of(profile));
        when(skillRepo.findByCandidateProfileId(any())).thenReturn(List.of(skill("Java")));
        when(jobRepo.findByUserOrderByCreatedAtDesc(user)).thenReturn(List.of(jobSaved));
        when(appRepo.findByUserAndJobIn(eq(user), any())).thenReturn(List.of(savedApp));
        when(jobSkillRepo.findByJobId(jobSaved.getId())).thenReturn(
                List.of(jobSkill(jobSaved, "Java", SkillType.REQUIRED)));

        List<RecommendationResponse> results = service.getRecommendations(user);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).jobTitle()).isEqualTo("Saved But Unapplied");
        assertThat(results.get(0).noResultReason()).isNull();
    }

    @Test
    void getRecommendations_noResume_returnsNoResumeReason() {
        when(resumeRepo.findByUserOrderByCreatedAtDesc(user)).thenReturn(List.of());

        List<RecommendationResponse> results = service.getRecommendations(user);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).noResultReason()).isEqualTo("noResume");
        assertThat(results.get(0).matchScore()).isEqualTo(0);
    }

    @Test
    void getRecommendations_noSavedJobs_returnsNoSavedJobsReason() {
        when(resumeRepo.findByUserOrderByCreatedAtDesc(user)).thenReturn(List.of(resume));
        when(profileRepo.findByResumeId(any())).thenReturn(Optional.of(profile));
        when(skillRepo.findByCandidateProfileId(any())).thenReturn(List.of());
        when(jobRepo.findByUserOrderByCreatedAtDesc(user)).thenReturn(List.of());

        List<RecommendationResponse> results = service.getRecommendations(user);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).noResultReason()).isEqualTo("noSavedJobs");
    }

    @Test
    void buildReasonSummary_strongMatch_startsWithStrong() {
        MatchResult high = new MatchResult(80, List.of("Java", "Spring Boot", "SQL"), List.of(), List.of(), "Strong");
        String summary = RecommendationService.buildReasonSummary(high);
        assertThat(summary).startsWith("Strong match");
        assertThat(summary).contains("Java");
    }

    @Test
    void buildReasonSummary_goodMatch_startsWithGood() {
        MatchResult mid = new MatchResult(55, List.of("Java"), List.of(), List.of("Python"), "Marginal");
        String summary = RecommendationService.buildReasonSummary(mid);
        assertThat(summary).startsWith("Good match");
    }

    @Test
    void buildReasonSummary_partialMatch_startsWithPartial() {
        MatchResult low = new MatchResult(25, List.of("Go"), List.of(), List.of("Java", "Rust"), "Weak");
        String summary = RecommendationService.buildReasonSummary(low);
        assertThat(summary).startsWith("Partial match");
    }

    @Test
    void buildReasonSummary_noMatchedSkills_containsSkillGaps() {
        MatchResult none = new MatchResult(0, List.of(), List.of(), List.of("Go", "Rust"), "Weak");
        String summary = RecommendationService.buildReasonSummary(none);
        assertThat(summary).contains("skill gaps");
    }
}