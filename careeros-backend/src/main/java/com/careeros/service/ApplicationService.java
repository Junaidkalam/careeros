package com.careeros.service;

import com.careeros.dto.ApplicationCreateRequest;
import com.careeros.dto.ApplicationEventResponse;
import com.careeros.dto.ApplicationResponse;
import com.careeros.dto.ApplicationStatusUpdateRequest;
import com.careeros.dto.MatchResult;
import com.careeros.entity.Application;
import com.careeros.entity.ApplicationEvent;
import com.careeros.entity.CandidateProfile;
import com.careeros.entity.CandidateSkill;
import com.careeros.entity.Job;
import com.careeros.entity.JobSkill;
import com.careeros.entity.Resume;
import com.careeros.entity.User;
import com.careeros.entity.enums.ApplicationStatus;
import com.careeros.entity.enums.EventType;
import com.careeros.exception.ResourceNotFoundException;
import com.careeros.repository.ApplicationEventRepository;
import com.careeros.repository.ApplicationRepository;
import com.careeros.repository.CandidateProfileRepository;
import com.careeros.repository.CandidateSkillRepository;
import com.careeros.repository.JobRepository;
import com.careeros.repository.JobSkillRepository;
import com.careeros.repository.ResumeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final ApplicationEventRepository applicationEventRepository;
    private final JobRepository jobRepository;
    private final ResumeRepository resumeRepository;
    private final JobSkillRepository jobSkillRepository;
    private final CandidateProfileRepository candidateProfileRepository;
    private final CandidateSkillRepository candidateSkillRepository;
    private final MatchService matchService;

    @Transactional
    public ApplicationResponse createApplication(User user, ApplicationCreateRequest req) {
        Job job = jobRepository.findById(req.jobId())
                .orElseThrow(() -> new ResourceNotFoundException("Job not found"));
        if (!job.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Job not found");
        }

        Resume resume = resumeRepository.findByIdAndUser(req.resumeId(), user)
                .orElseThrow(() -> new ResourceNotFoundException("Resume not found"));

        // Match calculation
        CandidateProfile profile = candidateProfileRepository.findByResumeId(resume.getId()).orElse(null);
        List<CandidateSkill> candSkills = profile != null ? candidateSkillRepository.findByCandidateProfileId(profile.getId()) : List.of();
        List<JobSkill> jobSkills = jobSkillRepository.findByJobId(job.getId());

        MatchResult matchResult = matchService.calculate(profile, candSkills, job, jobSkills);

        Application app = new Application();
        app.setUser(user);
        app.setJob(job);
        app.setResume(resume);
        app.setStatus(ApplicationStatus.SAVED);
        app.setMatchScore(matchResult.overallScore());
        app.setNotes(req.notes());
        
        app = applicationRepository.save(app);

        // Record creation event
        ApplicationEvent event = new ApplicationEvent();
        event.setApplication(app);
        event.setEventType(EventType.APPLICATION_SUBMITTED);
        event.setNote("Application created with match score " + matchResult.overallScore());
        applicationEventRepository.save(event);

        return toResponse(app, matchResult);
    }

    public List<ApplicationResponse> list(User user) {
        return applicationRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(app -> toResponse(app, null))
                .toList();
    }

    @Transactional
    public ApplicationResponse updateStatus(User user, UUID id, ApplicationStatusUpdateRequest req) {
        Application app = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));
        if (!app.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Application not found");
        }

        ApplicationStatus oldStatus = app.getStatus();
        app.setStatus(req.status());
        app = applicationRepository.save(app);

        ApplicationEvent event = new ApplicationEvent();
        event.setApplication(app);
        event.setEventType(EventType.STATUS_CHANGED);
        String baseNote = "Status changed from " + oldStatus + " to " + req.status();
        event.setNote(req.note() != null && !req.note().isBlank() ? baseNote + ": " + req.note() : baseNote);
        applicationEventRepository.save(event);

        return toResponse(app, null); // Skip recalculating matchResult on status update for MVP
    }

    public List<ApplicationEventResponse> getTimeline(User user, UUID id) {
        Application app = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));
        if (!app.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Application not found");
        }
        
        return applicationEventRepository.findByApplicationIdOrderByCreatedAtDesc(id).stream()
                .map(e -> new ApplicationEventResponse(e.getId(), e.getEventType(), e.getNote(), e.getCreatedAt()))
                .toList();
    }

    private ApplicationResponse toResponse(Application app, MatchResult matchResult) {
        return new ApplicationResponse(
                app.getId(),
                app.getJob().getId(),
                app.getJob().getTitle(),
                app.getJob().getCompany() != null ? app.getJob().getCompany().getName() : null,
                app.getResume() != null ? app.getResume().getId() : null,
                app.getStatus(),
                app.getMatchScore(),
                matchResult,
                app.getNotes(),
                app.getCreatedAt()
        );
    }
}