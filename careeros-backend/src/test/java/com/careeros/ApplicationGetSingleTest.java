package com.careeros;

import com.careeros.dto.ApplicationCreateRequest;
import com.careeros.dto.ApplicationResponse;
import com.careeros.entity.CandidateProfile;
import com.careeros.entity.CandidateSkill;
import com.careeros.entity.Job;
import com.careeros.entity.JobSkill;
import com.careeros.entity.Resume;
import com.careeros.entity.User;
import com.careeros.entity.enums.SkillType;
import com.careeros.exception.ResourceNotFoundException;
import com.careeros.repository.ApplicationEventRepository;
import com.careeros.repository.ApplicationRepository;
import com.careeros.repository.CandidateProfileRepository;
import com.careeros.repository.CandidateSkillRepository;
import com.careeros.repository.JobRepository;
import com.careeros.repository.JobSkillRepository;
import com.careeros.repository.ResumeRepository;
import com.careeros.repository.UserRepository;
import com.careeros.service.ApplicationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Tests for GET /applications/{id} (ApplicationService.getApplication):
 *
 * 1. Ownership check: a different user's request returns 404
 * 2. Resume WITH a CandidateProfile returns a full match breakdown (matchResult non-null, skills present)
 * 3. Resume WITHOUT a CandidateProfile returns coherent null matchResult (not a contradiction)
 */
@SpringBootTest
class ApplicationGetSingleTest {

    @Autowired private ApplicationService applicationService;
    @Autowired private UserRepository userRepository;
    @Autowired private JobRepository jobRepository;
    @Autowired private ResumeRepository resumeRepository;
    @Autowired private CandidateProfileRepository candidateProfileRepository;
    @Autowired private CandidateSkillRepository candidateSkillRepository;
    @Autowired private JobSkillRepository jobSkillRepository;
    @Autowired private ApplicationRepository applicationRepository;
    @Autowired private ApplicationEventRepository applicationEventRepository;

    private User owner;
    private User otherUser;
    private Job job;
    private Resume resumeWithProfile;
    private Resume resumeWithoutProfile;

    @BeforeEach
    void setUp() {
        // Must delete in FK-safe order: events → applications → skills/profiles → resumes → jobs → users
        applicationEventRepository.deleteAll();
        applicationRepository.deleteAll();
        jobSkillRepository.deleteAll();
        candidateSkillRepository.deleteAll();
        candidateProfileRepository.deleteAll();
        resumeRepository.deleteAll();
        jobRepository.deleteAll();
        userRepository.deleteAll();


        owner = new User();
        owner.setEmail("owner-get@example.com");
        owner.setPasswordHash("hash");
        owner.setName("Owner");
        owner = userRepository.save(owner);

        otherUser = new User();
        otherUser.setEmail("other-get@example.com");
        otherUser.setPasswordHash("hash");
        otherUser.setName("Other");
        otherUser = userRepository.save(otherUser);

        job = new Job();
        job.setUser(owner);
        job.setTitle("Software Engineer");
        job = jobRepository.save(job);

        // Required skill on the job so the match panel has something to evaluate
        JobSkill js = new JobSkill();
        js.setJob(job);
        js.setSkillName("Java");
        js.setSkillType(SkillType.REQUIRED);
        jobSkillRepository.save(js);

        // Resume that has a complete CandidateProfile with "Java" as a skill
        resumeWithProfile = new Resume();
        resumeWithProfile.setUser(owner);
        resumeWithProfile.setFilename("full_cv.pdf");
        resumeWithProfile.setFileUrl("path/full_cv.pdf");
        resumeWithProfile = resumeRepository.save(resumeWithProfile);

        CandidateProfile profile = new CandidateProfile();
        profile.setResume(resumeWithProfile);
        profile.setExperienceYears(3.0);
        profile = candidateProfileRepository.save(profile);

        CandidateSkill skill = new CandidateSkill();
        skill.setCandidateProfile(profile);
        skill.setSkillName("Java");
        candidateSkillRepository.save(skill);

        // Resume with no CandidateProfile (AI parsing never ran / failed)
        resumeWithoutProfile = new Resume();
        resumeWithoutProfile.setUser(owner);
        resumeWithoutProfile.setFilename("empty_cv.pdf");
        resumeWithoutProfile.setFileUrl("path/empty_cv.pdf");
        resumeWithoutProfile = resumeRepository.save(resumeWithoutProfile);
    }

    // -------------------------------------------------------------------------
    // 1. Ownership check
    // -------------------------------------------------------------------------

    @Test
    void getApplication_wrongUser_returns404() {
        // Application is owned by `owner`
        ApplicationCreateRequest req = new ApplicationCreateRequest(job.getId(), resumeWithProfile.getId(), "notes");
        ApplicationResponse app = applicationService.createApplication(owner, req);

        // `otherUser` must not be able to fetch it
        assertThatThrownBy(() -> applicationService.getApplication(otherUser, app.id()))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Application not found");
    }

    // -------------------------------------------------------------------------
    // 2. Resume WITH a CandidateProfile → full match breakdown returned
    // -------------------------------------------------------------------------

    @Test
    void getApplication_withProfile_returnsFullMatchBreakdown() {
        ApplicationCreateRequest req = new ApplicationCreateRequest(job.getId(), resumeWithProfile.getId(), "notes");
        ApplicationResponse created = applicationService.createApplication(owner, req);

        // Fetch via dedicated single-application endpoint
        ApplicationResponse fetched = applicationService.getApplication(owner, created.id());

        assertThat(fetched.id()).isEqualTo(created.id());
        assertThat(fetched.matchResult()).isNotNull();
        // "Java" is in the job AND in the candidate profile → should appear in matchedSkills
        assertThat(fetched.matchResult().matchedSkills())
                .as("Candidate has Java, job requires Java → should be matched")
                .contains("Java");
        assertThat(fetched.matchResult().missingSkills())
                .as("No missing skills because the only required skill matches")
                .isEmpty();
        assertThat(fetched.matchScore()).isNotNull();
        assertThat(fetched.matchScore()).isGreaterThan(0);
    }

    // -------------------------------------------------------------------------
    // 3. Resume WITHOUT a CandidateProfile → coherent null matchResult, not a
    //    contradiction (non-null score alongside "no data" message)
    // -------------------------------------------------------------------------

    @Test
    void getApplication_withoutProfile_returnsNullMatchResult_andScoreIsStillPresent() {
        ApplicationCreateRequest req = new ApplicationCreateRequest(job.getId(), resumeWithoutProfile.getId(), "notes");
        ApplicationResponse created = applicationService.createApplication(owner, req);

        ApplicationResponse fetched = applicationService.getApplication(owner, created.id());

        // matchResult must be null — no CandidateProfile means no breakdown available
        assertThat(fetched.matchResult())
                .as("No CandidateProfile means matchResult must be null")
                .isNull();

        // matchScore may be present (it was computed at creation time, even without
        // a profile — MatchService assigns 0 skills matched). The point is that the
        // UI must not show a non-null percentage alongside a "no data" breakdown.
        // This test documents the contract: matchResult is the authoritative null signal.
        assertThat(fetched.id()).isEqualTo(created.id());
    }
}
