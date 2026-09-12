package com.careeros.entity;

import com.careeros.entity.enums.WorkMode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

/**
 * A job posting the user has saved/imported. `source` distinguishes
 * whether it was pasted as a URL, entered manually, or (later) captured
 * via the browser extension.
 */
@Getter
@Setter
@Entity
@Table(name = "job")
public class Job extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

    @Column(nullable = false)
    private String title;

    private String location;

    @Enumerated(EnumType.STRING)
    private WorkMode workMode;

    private String employmentType; // e.g. Full-time, Internship

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "posting_url")
    private String postingUrl;

    private String source; // e.g. "LinkedIn", "Manual", "Company site"

    private LocalDate postedDate;

    private String salaryRange;

    private Double requiredExperienceYears;

    /** True once the extraction result has been reviewed/edited by the user. */
    private boolean reviewed = false;
}
