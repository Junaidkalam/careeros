package com.careeros.controller;

import com.careeros.dto.ResumeProfileUpdateRequest;
import com.careeros.dto.ResumeResponse;
import com.careeros.entity.User;
import com.careeros.service.ResumeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

/**
 * Resume endpoints - thin controller, all logic in {@link ResumeService}.
 *
 * <ul>
 *   <li>{@code POST   /api/resumes}             - upload PDF/DOCX, extract text, generate profile</li>
 *   <li>{@code GET    /api/resumes}             - list current user's resumes, newest first</li>
 *   <li>{@code GET    /api/resumes/{id}}         - get one resume (404 if not owned)</li>
 *   <li>{@code PUT    /api/resumes/{id}/profile} - edit AI-generated profile</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/resumes")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;

    /**
     * Upload a resume file.
     * Returns HTTP 201 even when AI profile generation failed -
     * the file is always saved; check {@code profileGenerated} and {@code warning}.
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResumeResponse> upload(
            @AuthenticationPrincipal User user,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "versionLabel", required = false) String versionLabel) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(resumeService.upload(user, file, versionLabel));
    }

    @GetMapping
    public ResponseEntity<List<ResumeResponse>> list(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(resumeService.list(user));
    }

    /** Returns 404 if the resume does not exist or belongs to a different user. */
    @GetMapping("/{id}")
    public ResponseEntity<ResumeResponse> getById(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        return ResponseEntity.ok(resumeService.getById(user, id));
    }

    /**
     * Edit the AI-generated candidate profile for a resume.
     * The entire skills list is replaced with the provided list.
     */
    @PutMapping("/{id}/profile")
    public ResponseEntity<ResumeResponse> updateProfile(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @Valid @RequestBody ResumeProfileUpdateRequest request) {
        return ResponseEntity.ok(resumeService.updateProfile(user, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResume(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        resumeService.delete(user, id);
        return ResponseEntity.noContent().build();
    }
}