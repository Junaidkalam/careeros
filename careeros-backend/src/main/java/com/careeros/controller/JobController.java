package com.careeros.controller;

import com.careeros.dto.JobDiscoveryResponse;
import com.careeros.dto.JobExtractionResponse;
import com.careeros.dto.JobImportRequest;
import com.careeros.dto.JobRequest;
import com.careeros.dto.JobResponse;
import com.careeros.entity.User;
import com.careeros.entity.enums.WorkMode;
import com.careeros.service.JobDiscoveryService;
import com.careeros.service.JobExtractionService;
import com.careeros.service.JobService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobService jobService;
    private final JobExtractionService jobExtractionService;
    private final JobDiscoveryService jobDiscoveryService;

    @PostMapping
    public ResponseEntity<JobResponse> createJob(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody JobRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(jobService.createJob(user, request));
    }

    @GetMapping
    public ResponseEntity<List<JobResponse>> listJobs(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) WorkMode workMode,
            @RequestParam(required = false) String employmentType,
            @RequestParam(required = false) Integer minMatchScore) {
        return ResponseEntity.ok(jobService.listJobs(user, search, workMode, employmentType, minMatchScore));
    }

    @PostMapping("/import")
    public ResponseEntity<JobExtractionResponse> importJob(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody JobImportRequest request) {
        return ResponseEntity.ok(jobExtractionService.extractFromUrl(request.url()));
    }

    /**
     * GET /api/jobs/discover
     *
     * <p>Returns a ranked list of Adzuna job listings matched against the user's
     * most-recent candidate profile. Results are review-only — nothing is saved automatically.
     * Edge cases (no resume, no profile, credentials missing, API error) are surfaced as
     * structured empty-state entries, never as HTTP 500.
     */
    @GetMapping("/discover")
    public ResponseEntity<List<JobDiscoveryResponse>> discoverJobs(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(jobDiscoveryService.discover(user));
    }
}