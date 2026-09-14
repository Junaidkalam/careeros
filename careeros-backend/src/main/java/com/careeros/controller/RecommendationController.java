package com.careeros.controller;

import com.careeros.dto.RecommendationResponse;
import com.careeros.entity.User;
import com.careeros.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * GET /api/recommendations
 *
 * <p>Returns the current user's saved jobs ranked by AI match score against their
 * most recently uploaded resume. Edge cases (no resume, no saved jobs) are returned
 * as an empty list with a {@code noResultReason} field rather than HTTP errors.
 */
@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping
    public ResponseEntity<List<RecommendationResponse>> getRecommendations(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(recommendationService.getRecommendations(user));
    }
}