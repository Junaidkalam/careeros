package com.careeros;

import com.careeros.dto.DashboardStats;
import com.careeros.entity.Application;
import com.careeros.entity.Job;
import com.careeros.entity.Resume;
import com.careeros.entity.User;
import com.careeros.entity.enums.ApplicationStatus;
import com.careeros.repository.ApplicationRepository;
import com.careeros.repository.JobRepository;
import com.careeros.repository.ResumeRepository;
import com.careeros.repository.UserRepository;
import com.careeros.service.DashboardService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
public class DashboardIntegrationTest {

    @Autowired
    private DashboardService dashboardService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private ResumeRepository resumeRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private User userA;
    private User userB;
    private Job jobA;
    private Resume resumeA;

    @BeforeEach
    void setUp() {
        userA = new User();
        userA.setEmail("usera-dash@example.com");
        userA.setPasswordHash("hash");
        userA.setName("User A");
        userA = userRepository.save(userA);

        userB = new User();
        userB.setEmail("userb-dash@example.com");
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
        resumeA.setFileUrl("path");
        resumeA = resumeRepository.save(resumeA);
    }

    @Test
    void getStats_calculatesAccuratelyAndScopesToUser() {
        // App 1: INTERVIEW, 2 days ago
        Application app1 = createApp(userA, ApplicationStatus.INTERVIEW);
        backdateApp(app1, 2);

        // App 2: OFFER, 10 days ago (this month but not this week)
        Application app2 = createApp(userA, ApplicationStatus.OFFER);
        backdateApp(app2, 10);

        // App 3: REJECTED, 40 days ago (neither this week nor this month)
        Application app3 = createApp(userA, ApplicationStatus.REJECTED);
        backdateApp(app3, 40);

        // App 4: APPLIED, 0 days ago (active)
        Application app4 = createApp(userA, ApplicationStatus.APPLIED);

        // App 5: User B's application (should not affect User A's stats)
        createApp(userB, ApplicationStatus.OFFER);

        DashboardStats stats = dashboardService.getStats(userA);

        // Total = 4
        assertThat(stats.totalApplications()).isEqualTo(4);

        // Active = Total (4) - terminal (REJECTED, OFFER) = 4 - 2 = 2
        assertThat(stats.activeApplications()).isEqualTo(2);

        // Interviews = INTERVIEW (1) + OFFER (1) = 2
        assertThat(stats.interviews()).isEqualTo(2);

        // Offers = 1
        assertThat(stats.offers()).isEqualTo(1);

        // Rejected = 1
        assertThat(stats.rejected()).isEqualTo(1);

        // This week = 2 (app1, app4)
        assertThat(stats.applicationsThisWeek()).isEqualTo(2);

        // This month = 3 (app1, app2, app4)
        assertThat(stats.applicationsThisMonth()).isEqualTo(3);

        // Rates
        assertThat(stats.interviewRate()).isEqualTo(0.5); // 2/4
        assertThat(stats.offerRate()).isEqualTo(0.25); // 1/4
    }

    private Application createApp(User user, ApplicationStatus status) {
        Job job = new Job();
        job.setUser(user);
        job.setTitle("Test Job");
        job = jobRepository.save(job);

        Resume resume = new Resume();
        resume.setUser(user);
        resume.setFilename("res.pdf");
        resume.setFileUrl("path");
        resume = resumeRepository.save(resume);

        Application app = new Application();
        app.setUser(user);
        app.setJob(job);
        app.setResume(resume);
        app.setStatus(status);
        return applicationRepository.save(app);
    }

    private void backdateApp(Application app, int daysAgo) {
        applicationRepository.flush();
        Instant past = Instant.now().minus(daysAgo, ChronoUnit.DAYS);
        jdbcTemplate.update("UPDATE application SET created_at = ? WHERE id = ?", past, app.getId());
    }
}