package com.careeros;

import com.careeros.dto.JobResponse;
import com.careeros.entity.*;
import com.careeros.entity.enums.ApplicationStatus;
import com.careeros.entity.enums.WorkMode;
import com.careeros.repository.*;
import com.careeros.service.JobService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
public class JobServiceFilterTest {

    @Autowired private JobService jobService;
    @Autowired private UserRepository userRepository;
    @Autowired private JobRepository jobRepository;
    @Autowired private CompanyRepository companyRepository;
    @Autowired private ApplicationRepository applicationRepository;

    private User user;

    @BeforeEach
    void setup() {
        applicationRepository.deleteAll();
        jobRepository.deleteAll();
        userRepository.deleteAll();
        companyRepository.deleteAll();

        user = new User();
        user.setEmail(UUID.randomUUID().toString() + "@test.com");
        user.setPasswordHash("hash");
        user.setName("Test User");
        user = userRepository.save(user);
    }

    @Test
    void testFilters() {
        Company compA = new Company();
        compA.setName("TechNova");
        compA = companyRepository.save(compA);

        Company compB = new Company();
        compB.setName("CloudOps Inc");
        compB = companyRepository.save(compB);

        Job j1 = new Job();
        j1.setUser(user);
        j1.setTitle("Data Engineer");
        j1.setCompany(compA);
        j1.setWorkMode(WorkMode.REMOTE);
        j1.setEmploymentType("Full-time");
        j1 = jobRepository.save(j1);

        Job j2 = new Job();
        j2.setUser(user);
        j2.setTitle("Senior CloudOps");
        j2.setCompany(compB);
        j2.setWorkMode(WorkMode.ONSITE);
        j2 = jobRepository.save(j2);

        Job j3 = new Job();
        j3.setUser(user);
        j3.setTitle("Backend Dev");
        j3.setCompany(compA);
        j3.setWorkMode(WorkMode.REMOTE);
        j3 = jobRepository.save(j3);

        Application app1 = new Application();
        app1.setUser(user);
        app1.setJob(j1);
        app1.setStatus(ApplicationStatus.SAVED);
        app1.setMatchScore(80);
        applicationRepository.save(app1);

        Application app2 = new Application();
        app2.setUser(user);
        app2.setJob(j2);
        app2.setStatus(ApplicationStatus.SAVED);
        app2.setMatchScore(20);
        applicationRepository.save(app2);

        // j3 has NO application

        // 1. Search by partial title
        List<JobResponse> r1 = jobService.listJobs(user, "Data", null, null, null);
        assertThat(r1).hasSize(1).extracting(JobResponse::title).containsExactly("Data Engineer");

        // 2. Search by partial company name
        List<JobResponse> r2 = jobService.listJobs(user, "cloudops", null, null, null);
        assertThat(r2).hasSize(1).extracting(JobResponse::title).containsExactly("Senior CloudOps");

        // 3. Combine workMode + minMatchScore
        List<JobResponse> r3 = jobService.listJobs(user, null, WorkMode.REMOTE, null, 50);
        assertThat(r3).hasSize(1).extracting(JobResponse::title).containsExactly("Data Engineer");

        // 4. Exclude jobs with no application when minMatchScore is set
        List<JobResponse> r4 = jobService.listJobs(user, null, null, null, 10);
        assertThat(r4).hasSize(2).extracting(JobResponse::title).contains("Data Engineer", "Senior CloudOps");
    }
}