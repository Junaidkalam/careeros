package com.careeros.repository;

import com.careeros.entity.JobSkill;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface JobSkillRepository extends JpaRepository<JobSkill, UUID> {
    List<JobSkill> findByJobId(UUID jobId);
}
