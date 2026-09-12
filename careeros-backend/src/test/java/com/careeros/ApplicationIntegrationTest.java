package com.careeros;

import com.careeros.dto.ApplicationCreateRequest;
import com.careeros.dto.ApplicationEventResponse;
import com.careeros.dto.ApplicationResponse;
import com.careeros.dto.ApplicationStatusUpdateRequest;
import com.careeros.entity.Job;
import com.careeros.entity.Resume;
import com.careeros.entity.User;
import com.careeros.entity.enums.ApplicationStatus;
import com.careeros.entity.enums.EventType;
import com.careeros.exception.ResourceNotFoundException;
import com.careeros.repository.JobRepository;
import com.careeros.repository.ResumeRepository;
import com.careeros.repository.UserRepository;
import com.careeros.service.ApplicationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
public class ApplicationIntegrationTest {

    @Autowired
    private ApplicationService applicationService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private ResumeRepository resumeRepository;

    private User userA;
    private User userB;
    private Job jobA;
    private Resume resumeA;

    @BeforeEach
    void setUp() {
        userA = new User();
        userA.setEmail("usera-app@example.com");
        userA.setPasswordHash("hash");
        userA.setName("User A");
        userA = userRepository.save(userA);

        userB = new User();
        userB.setEmail("userb-app@example.com");
        userB.setPasswordHash("hash");
        userB.setName("User B");
        userB = userRepository.save(userB);

        jobA = new Job();
        jobA.setUser(userA);
        jobA.setTitle("Job A");
        jobA = jobRepository.save(jobA);

        resumeA = new Resume();
        resumeA.setUser(userA);
        resumeA.setFilename("res.pdf");
        resumeA.setFileUrl("path/to/res.pdf");
        resumeA = resumeRepository.save(resumeA);
    }

    @Test
    void createApplication_succeeds_and_updateStatus_createsEvent() {
        ApplicationCreateRequest req = new ApplicationCreateRequest(jobA.getId(), resumeA.getId(), "Test notes");
        ApplicationResponse app = applicationService.createApplication(userA, req);

        assertThat(app.jobTitle()).isEqualTo("Job A");
        assertThat(app.status()).isEqualTo(ApplicationStatus.SAVED);
        assertThat(app.matchResult()).isNotNull();

        // Update status
        ApplicationStatusUpdateRequest statusReq = new ApplicationStatusUpdateRequest(ApplicationStatus.APPLIED, "Applied on site");
        ApplicationResponse updated = applicationService.updateStatus(userA, app.id(), statusReq);

        assertThat(updated.status()).isEqualTo(ApplicationStatus.APPLIED);

        // Check timeline
        List<ApplicationEventResponse> timeline = applicationService.getTimeline(userA, app.id());
        assertThat(timeline).hasSize(2);
        
        // Newest first
        assertThat(timeline.get(0).eventType()).isEqualTo(EventType.STATUS_CHANGED);
        assertThat(timeline.get(0).note()).contains("SAVED to APPLIED");
        assertThat(timeline.get(0).note()).contains("Applied on site");

        assertThat(timeline.get(1).eventType()).isEqualTo(EventType.APPLICATION_SUBMITTED);
    }

    @Test
    void updateStatus_withWrongUser_throwsNotFound() {
        ApplicationCreateRequest req = new ApplicationCreateRequest(jobA.getId(), resumeA.getId(), "Test");
        ApplicationResponse app = applicationService.createApplication(userA, req);

        ApplicationStatusUpdateRequest statusReq = new ApplicationStatusUpdateRequest(ApplicationStatus.APPLIED, null);

        assertThatThrownBy(() -> applicationService.updateStatus(userB, app.id(), statusReq))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}