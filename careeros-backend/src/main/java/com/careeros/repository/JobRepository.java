package com.careeros.repository;

import com.careeros.entity.Job;
import com.careeros.entity.User;
import com.careeros.entity.enums.WorkMode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface JobRepository extends JpaRepository<Job, UUID> {
    List<Job> findByUserOrderByCreatedAtDesc(User user);

    @Query("SELECT j FROM Job j LEFT JOIN j.company c WHERE j.user = :user " +
           "AND (:search IS NULL OR LOWER(j.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:workMode IS NULL OR j.workMode = :workMode) " +
           "AND (:employmentType IS NULL OR j.employmentType = :employmentType) " +
           "ORDER BY j.createdAt DESC")
    List<Job> findWithFilters(@Param("user") User user, 
                              @Param("search") String search, 
                              @Param("workMode") WorkMode workMode, 
                              @Param("employmentType") String employmentType);

    // Cheap duplicate-detection signal for Phase 1: same user + same posting URL.
    boolean existsByUserAndPostingUrl(User user, String postingUrl);
}