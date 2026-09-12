package com.careeros.repository;

import com.careeros.entity.Application;
import com.careeros.entity.User;
import com.careeros.entity.enums.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ApplicationRepository extends JpaRepository<Application, UUID> {
    List<Application> findByUserOrderByCreatedAtDesc(User user);
    List<Application> findByUserAndStatus(User user, ApplicationStatus status);
    
    long countByUser(User user);
    long countByUserAndStatus(User user, ApplicationStatus status);
    long countByUserAndStatusIn(User user, List<ApplicationStatus> statuses);
    long countByUserAndCreatedAtGreaterThanEqual(User user, java.time.Instant from);
}
