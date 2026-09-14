package com.careeros.controller;

import com.careeros.dto.ApplicationCreateRequest;
import com.careeros.dto.ApplicationEventResponse;
import com.careeros.dto.ApplicationResponse;
import com.careeros.dto.ApplicationStatusUpdateRequest;
import com.careeros.entity.User;
import com.careeros.service.ApplicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService applicationService;

    @PostMapping
    public ResponseEntity<ApplicationResponse> create(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ApplicationCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(applicationService.createApplication(user, request));
    }

    @GetMapping
    public ResponseEntity<List<ApplicationResponse>> list(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(applicationService.list(user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApplicationResponse> getApplication(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        return ResponseEntity.ok(applicationService.getApplication(user, id));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApplicationResponse> updateStatus(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @Valid @RequestBody ApplicationStatusUpdateRequest request) {
        return ResponseEntity.ok(applicationService.updateStatus(user, id, request));
    }

    @PutMapping("/{id}/follow-up")
    public ResponseEntity<ApplicationResponse> updateFollowUpDate(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @RequestBody com.careeros.dto.ApplicationFollowUpRequest request) {
        return ResponseEntity.ok(applicationService.updateFollowUpDate(user, id, request));
    }

    @GetMapping("/due-followups")
    public ResponseEntity<List<ApplicationResponse>> getDueFollowUps(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(applicationService.getDueFollowUps(user));
    }

    @GetMapping("/{id}/timeline")
    public ResponseEntity<List<ApplicationEventResponse>> getTimeline(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        return ResponseEntity.ok(applicationService.getTimeline(user, id));
    }
}