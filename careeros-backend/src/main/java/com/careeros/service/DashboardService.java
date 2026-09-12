package com.careeros.service;

import com.careeros.dto.DashboardStats;
import com.careeros.entity.User;
import com.careeros.entity.enums.ApplicationStatus;
import com.careeros.repository.ApplicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ApplicationRepository applicationRepository;

    @Transactional(readOnly = true)
    public DashboardStats getStats(User user) {
        long totalApplications = applicationRepository.countByUser(user);
        
        long offers = applicationRepository.countByUserAndStatus(user, ApplicationStatus.OFFER);
        long rejected = applicationRepository.countByUserAndStatus(user, ApplicationStatus.REJECTED);
        
        List<ApplicationStatus> terminalAndOffer = List.of(
                ApplicationStatus.REJECTED, 
                ApplicationStatus.WITHDRAWN, 
                ApplicationStatus.POSITION_CLOSED,
                ApplicationStatus.OFFER
        );
        long inactiveCount = applicationRepository.countByUserAndStatusIn(user, terminalAndOffer);
        long activeApplications = totalApplications - inactiveCount;
        
        // For MVP, just count current status == INTERVIEW or OFFER as having reached interview
        long interviews = applicationRepository.countByUserAndStatusIn(user, List.of(
                ApplicationStatus.INTERVIEW,
                ApplicationStatus.OFFER
        ));

        Instant now = Instant.now();
        Instant oneWeekAgo = now.minus(7, ChronoUnit.DAYS);
        Instant thirtyDaysAgo = now.minus(30, ChronoUnit.DAYS);

        long thisWeek = applicationRepository.countByUserAndCreatedAtGreaterThanEqual(user, oneWeekAgo);
        long thisMonth = applicationRepository.countByUserAndCreatedAtGreaterThanEqual(user, thirtyDaysAgo);

        Double interviewRate = totalApplications > 0 ? (double) interviews / totalApplications : null;
        Double offerRate = totalApplications > 0 ? (double) offers / totalApplications : null;

        return new DashboardStats(
                totalApplications,
                activeApplications,
                interviews,
                offers,
                rejected,
                thisWeek,
                thisMonth,
                interviewRate,
                offerRate
        );
    }
}