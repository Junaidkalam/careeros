package com.careeros.repository;

import com.careeros.entity.Resume;
import com.careeros.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ResumeRepository extends JpaRepository<Resume, UUID> {
    List<Resume> findByUserOrderByCreatedAtDesc(User user);

    /** Ownership-safe lookup - returns empty if the resume exists but belongs to a different user. */
    Optional<Resume> findByIdAndUser(UUID id, User user);
}
