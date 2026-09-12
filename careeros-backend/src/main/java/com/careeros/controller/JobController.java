package com.careeros.controller;

import com.careeros.dto.JobExtractionResponse;
import com.careeros.dto.JobImportRequest;
import com.careeros.dto.JobRequest;
import com.careeros.dto.JobResponse;
import com.careeros.entity.User;
import com.careeros.service.JobExtractionService;
import com.careeros.service.JobService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Reference controller pattern: thin adapter, service does the work,
 * DTOs in/out (JPA entities never exposed directly).
 *
 * <p>Endpoints:
 * <ul>
 *   <li>{@code POST /api/jobs}        - persist a reviewed job</li>
 *   <li>{@code GET  /api/jobs}        - list the user's jobs</li>
 *   <li>{@code POST /api/jobs/import} - extract a draft from a URL (does NOT persist)</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobService jobService;
    private final JobExtractionService jobExtractionService;

    @PostMapping
    public ResponseEntity<JobResponse> createJob(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody JobRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(jobService.createJob(user, request));
    }

    @GetMapping
    public ResponseEntity<List<JobResponse>> listJobs(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(jobService.listJobs(user));
    }

    /**
     * Extracts job details from the given URL and returns a pre-filled draft.
     * <strong>Nothing is persisted.</strong> The client shows the draft for the
     * user to review/edit, then calls {@code POST /api/jobs} to actually save it.
     *
     * <p>Always returns HTTP 200 - extraction failures are reported in
     * {@link JobExtractionResponse#warning()}, never as 4xx/5xx errors.
     */
    @PostMapping("/import")
    public ResponseEntity<JobExtractionResponse> importJob(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody JobImportRequest request) {
        return ResponseEntity.ok(jobExtractionService.extractFromUrl(request.url()));
    }
}