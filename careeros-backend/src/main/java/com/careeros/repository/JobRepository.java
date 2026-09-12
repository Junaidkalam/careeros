package com.careeros.repository;

import com.careeros.entity.Job;
import com.careeros.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface JobRepository extends JpaRepository<Job, UUID> {
    List<Job> findByUserOrderByCreatedAtDesc(User user);

    // Cheap duplicate-detection signal for Phase 1: same user + same posting URL.
    boolean existsByUserAndPostingUrl(User user, String postingUrl);
}
