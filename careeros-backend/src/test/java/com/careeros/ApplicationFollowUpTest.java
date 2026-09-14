package com.careeros;

import com.careeros.dto.ApplicationCreateRequest;
import com.careeros.dto.ApplicationFollowUpRequest;
import com.careeros.dto.ApplicationResponse;
import com.careeros.dto.ApplicationStatusUpdateRequest;
import com.careeros.entity.Job;
import com.careeros.entity.Resume;
import com.careeros.entity.User;
import com.careeros.entity.enums.ApplicationStatus;
import com.careeros.repository.ApplicationRepository;
import com.careeros.repository.JobRepository;
import com.careeros.repository.ResumeRepository;
import com.careeros.repository.UserRepository;
import com.careeros.service.ApplicationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class ApplicationFollowUpTest {

    @Autowired private ApplicationService applicationService;
    @Autowired private UserRepository userRepository;
    @Autowired private JobRepository jobRepository;
    @Autowired private ResumeRepository resumeRepository;
    @Autowired private ApplicationRepository applicationRepository;

    private User user;
    private Job job1;
    private Job job2;
    private Resume resume;

    @BeforeEach
    void setup() {
        applicationRepository.deleteAll();
        jobRepository.deleteAll();
        resumeRepository.deleteAll();
        userRepository.deleteAll();

        user = new User();
        user.setEmail("followup@example.com");
        user.setPasswordHash("hash");
        user.setName("Test User");
        user = userRepository.save(user);

        job1 = new Job();
        job1.setUser(user);
        job1.setTitle("Job 1");
        job1 = jobRepository.save(job1);

        job2 = new Job();
        job2.setUser(user);
        job2.setTitle("Job 2");
        job2 = jobRepository.save(job2);

        resume = new Resume();
        resume.setUser(user);
        resume.setFilename("test.pdf");
        resume.setFileUrl("http://example.com/test.pdf");
        resume = resumeRepository.save(resume);
    }

    @Test
    void testFollowUpLogic() {
        // 1. Create an application
        ApplicationResponse app1 = applicationService.createApplication(user, new ApplicationCreateRequest(job1.getId(), resume.getId(), ""));
        assertThat(app1.followUpDate()).isNull();

        // 2. Move to APPLIED, should auto-set follow-up to +14 days
        app1 = applicationService.updateStatus(user, app1.id(), new ApplicationStatusUpdateRequest(ApplicationStatus.APPLIED, ""));
        assertThat(app1.followUpDate()).isEqualTo(LocalDate.now().plusDays(14));

        // 3. Manually set a follow-up date for app2
        ApplicationResponse app2 = applicationService.createApplication(user, new ApplicationCreateRequest(job2.getId(), resume.getId(), ""));
        LocalDate manualDate = LocalDate.now().minusDays(1);
        app2 = applicationService.updateFollowUpDate(user, app2.id(), new ApplicationFollowUpRequest(manualDate));
        assertThat(app2.followUpDate()).isEqualTo(manualDate);

        // 4. Move app2 to APPLIED, manual date shouldn't be overwritten
        app2 = applicationService.updateStatus(user, app2.id(), new ApplicationStatusUpdateRequest(ApplicationStatus.APPLIED, ""));
        assertThat(app2.followUpDate()).isEqualTo(manualDate);

        // 5. Test getDueFollowUps
        // app1 is 14 days in future (not due)
        // app2 is 1 day in past (due), status is APPLIED
        List<ApplicationResponse> due = applicationService.getDueFollowUps(user);
        assertThat(due).hasSize(1);
        assertThat(due.get(0).id()).isEqualTo(app2.id());

        // 6. Change app2 to REJECTED, should no longer be due
        applicationService.updateStatus(user, app2.id(), new ApplicationStatusUpdateRequest(ApplicationStatus.REJECTED, ""));
        due = applicationService.getDueFollowUps(user);
        assertThat(due).isEmpty();
    }
}