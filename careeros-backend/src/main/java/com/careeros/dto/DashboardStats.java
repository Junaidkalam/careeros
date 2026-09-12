package com.careeros.dto;

public record DashboardStats(
        long totalApplications,
        long activeApplications,
        long interviews,
        long offers,
        long rejected,
        long applicationsThisWeek,
        long applicationsThisMonth,
        Double interviewRate,
        Double offerRate
) {}