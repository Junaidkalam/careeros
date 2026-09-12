package com.careeros.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

/**
 * Structured profile derived from parsing a Resume. One-to-one with
 * Resume for MVP simplicity - each resume version gets its own profile,
 * since skills/experience genuinely differ between tailored resumes.
 */
@Getter
@Setter
@Entity
@Table(name = "candidate_profile")
public class CandidateProfile extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "resume_id", nullable = false, unique = true)
    private Resume resume;

    @Column(columnDefinition = "TEXT")
    private String summary;

    private Double experienceYears;

    private String primaryRole; // e.g. "Backend Developer"

    private String education; // free text for MVP: "B.Tech CS, GNIT, 2022-2026"
}
