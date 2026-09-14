package com.careeros.service;

import com.careeros.dto.JobRequest;
import com.careeros.dto.JobResponse;
import com.careeros.entity.Application;
import com.careeros.entity.Company;
import com.careeros.entity.Job;
import com.careeros.entity.JobSkill;
import com.careeros.entity.User;
import com.careeros.entity.enums.SkillType;
import com.careeros.entity.enums.WorkMode;
import com.careeros.repository.ApplicationRepository;
import com.careeros.repository.CompanyRepository;
import com.careeros.repository.JobRepository;
import com.careeros.repository.JobSkillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;
    private final CompanyRepository companyRepository;
    private final JobSkillRepository jobSkillRepository;
    private final ApplicationRepository applicationRepository;

    @Transactional
    public JobResponse createJob(User user, JobRequest request) {
        if (request.postingUrl() != null
                && jobRepository.existsByUserAndPostingUrl(user, request.postingUrl())) {
            throw new IllegalStateException("This job appears to already exist in your tracker.");
        }

        Company company = resolveCompany(request.companyName());

        Job job = new Job();
        job.setUser(user);
        job.setCompany(company);
        job.setTitle(request.title());
        job.setLocation(request.location());
        job.setWorkMode(request.workMode());
        job.setEmploymentType(request.employmentType());
        job.setDescription(request.description());
        job.setPostingUrl(request.postingUrl());
        job.setSource(request.source() != null ? request.source() : "Manual");
        job.setPostedDate(request.postedDate());
        job.setSalaryRange(request.salaryRange());
        job.setRequiredExperienceYears(request.requiredExperienceYears());
        job.setReviewed(true); 

        Job saved = jobRepository.save(job);
        saveSkills(saved, request.requiredSkills(), SkillType.REQUIRED);
        saveSkills(saved, request.preferredSkills(), SkillType.PREFERRED);

        return toResponse(saved);
    }

    public List<JobResponse> listJobs(User user) {
        return listJobs(user, null, null, null, null);
    }

    public List<JobResponse> listJobs(User user, String search, WorkMode workMode, String employmentType, Integer minMatchScore) {
        List<Job> jobs;
        
        if (search == null && workMode == null && employmentType == null) {
            jobs = jobRepository.findByUserOrderByCreatedAtDesc(user);
        } else {
            jobs = jobRepository.findWithFilters(user, search, workMode, employmentType);
        }

        if (minMatchScore != null && !jobs.isEmpty()) {
            List<Application> apps = applicationRepository.findByUserAndJobIn(user, jobs);
            
            // Map each Job ID to its most recently created Application
            Map<UUID, Application> latestAppByJob = apps.stream()
                .collect(Collectors.toMap(
                    a -> a.getJob().getId(),
                    a -> a,
                    (a1, a2) -> a1.getCreatedAt().isAfter(a2.getCreatedAt()) ? a1 : a2
                ));
                
            jobs = jobs.stream()
                .filter(j -> {
                    Application latest = latestAppByJob.get(j.getId());
                    if (latest == null) return false;
                    return latest.getMatchScore() != null && latest.getMatchScore() >= minMatchScore;
                })
                .toList();
        }

        return jobs.stream().map(this::toResponse).toList();
    }

    private Company resolveCompany(String companyName) {
        if (companyName == null || companyName.isBlank()) return null;
        return companyRepository.findByNameIgnoreCase(companyName)
                .orElseGet(() -> {
                    Company c = new Company();
                    c.setName(companyName);
                    return companyRepository.save(c);
                });
    }

    private void saveSkills(Job job, List<String> skillNames, SkillType type) {
        if (skillNames == null) return;
        for (String name : skillNames) {
            if (name == null || name.isBlank()) continue;
            JobSkill skill = new JobSkill();
            skill.setJob(job);
            skill.setSkillName(name.trim());
            skill.setSkillType(type);
            jobSkillRepository.save(skill);
        }
    }

    private JobResponse toResponse(Job job) {
        List<JobSkill> skills = jobSkillRepository.findByJobId(job.getId());
        List<String> required = skills.stream()
                .filter(s -> s.getSkillType() == SkillType.REQUIRED)
                .map(JobSkill::getSkillName).toList();
        List<String> preferred = skills.stream()
                .filter(s -> s.getSkillType() == SkillType.PREFERRED)
                .map(JobSkill::getSkillName).toList();

        return new JobResponse(
                job.getId(),
                job.getTitle(),
                job.getCompany() != null ? job.getCompany().getName() : null,
                job.getLocation(),
                job.getWorkMode(),
                job.getEmploymentType(),
                job.getDescription(),
                job.getPostingUrl(),
                job.getSource(),
                job.getPostedDate(),
                job.getSalaryRange(),
                job.isReviewed(),
                job.getRequiredExperienceYears(),
                required,
                preferred
        );
    }
}