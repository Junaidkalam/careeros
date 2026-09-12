package com.careeros.service;

import com.careeros.dto.MatchResult;
import com.careeros.entity.CandidateProfile;
import com.careeros.entity.CandidateSkill;
import com.careeros.entity.Job;
import com.careeros.entity.JobSkill;
import com.careeros.entity.enums.SkillType;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Calculates a rule-based matching score between a CandidateProfile and a Job.
 */
@Service
public class MatchService {

    private static final double WEIGHT_REQUIRED = 0.70;
    private static final double WEIGHT_PREFERRED = 0.30;
    
    private static final double WEIGHT_SKILLS_OVERALL = 0.80;
    private static final double WEIGHT_EXPERIENCE_OVERALL = 0.20;

    public MatchResult calculate(CandidateProfile profile, List<CandidateSkill> candidateSkills, Job job, List<JobSkill> jobSkills) {
        Set<String> normalizedCandidateSkills = candidateSkills.stream()
                .map(s -> normalize(s.getSkillName()))
                .collect(Collectors.toSet());

        List<String> matchedSkills = new ArrayList<>();
        List<String> missingSkills = new ArrayList<>();
        
        int requiredTotal = 0;
        int requiredMatched = 0;
        int preferredTotal = 0;
        int preferredMatched = 0;

        for (JobSkill js : jobSkills) {
            String original = js.getSkillName();
            String norm = normalize(original);
            boolean isRequired = js.getSkillType() == SkillType.REQUIRED;
            
            if (isRequired) requiredTotal++;
            else preferredTotal++;

            if (normalizedCandidateSkills.contains(norm)) {
                matchedSkills.add(original);
                if (isRequired) requiredMatched++;
                else preferredMatched++;
            } else {
                missingSkills.add(original);
            }
        }

        double skillScore = 0.0;
        if (requiredTotal == 0 && preferredTotal == 0) {
            skillScore = 100.0;
        } else if (requiredTotal > 0 && preferredTotal > 0) {
            skillScore = (((double) requiredMatched / requiredTotal) * WEIGHT_REQUIRED +
                          ((double) preferredMatched / preferredTotal) * WEIGHT_PREFERRED) * 100;
        } else if (requiredTotal > 0) {
            skillScore = ((double) requiredMatched / requiredTotal) * 100;
        } else {
            skillScore = ((double) preferredMatched / preferredTotal) * 100;
        }

        double jobExp = job.getRequiredExperienceYears() != null ? job.getRequiredExperienceYears() : 0.0;
        double candExp = (profile != null && profile.getExperienceYears() != null) ? profile.getExperienceYears() : 0.0;
        
        String experienceAssessment;
        double expScore = 0.0;
        
        if (job.getRequiredExperienceYears() == null) {
            experienceAssessment = "Not specified";
            expScore = 100.0;
        } else {
            if (candExp >= jobExp) {
                experienceAssessment = String.format("Required: %.1f years, Candidate: %.1f years \u2014 Strong", jobExp, candExp);
                expScore = 100.0;
            } else if (candExp >= jobExp * 0.5) {
                experienceAssessment = String.format("Required: %.1f years, Candidate: %.1f years \u2014 Marginal", jobExp, candExp);
                expScore = (candExp / jobExp) * 100;
            } else {
                experienceAssessment = String.format("Required: %.1f years, Candidate: %.1f years \u2014 Weak", jobExp, candExp);
                expScore = (candExp / jobExp) * 100;
            }
        }
        
        int overallScore = (int) Math.round((skillScore * WEIGHT_SKILLS_OVERALL) + (expScore * WEIGHT_EXPERIENCE_OVERALL));
        // Clamp overall score
        overallScore = Math.min(100, Math.max(0, overallScore));
        
        return new MatchResult(
                overallScore,
                matchedSkills,
                List.of(), // Partial matches MVP
                missingSkills,
                experienceAssessment
        );
    }

    private String normalize(String skill) {
        if (skill == null) return "";
        return skill.trim().toLowerCase();
    }
}