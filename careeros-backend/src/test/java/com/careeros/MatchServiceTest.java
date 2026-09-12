package com.careeros;

import com.careeros.dto.MatchResult;
import com.careeros.entity.CandidateProfile;
import com.careeros.entity.CandidateSkill;
import com.careeros.entity.Job;
import com.careeros.entity.JobSkill;
import com.careeros.entity.enums.SkillType;
import com.careeros.service.MatchService;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

public class MatchServiceTest {

    private final MatchService matchService = new MatchService();

    @Test
    void calculate_withAllRequiredSkillsAndExperience_returnsHighHighScore() {
        CandidateProfile profile = new CandidateProfile();
        profile.setExperienceYears(4.0);

        CandidateSkill c1 = new CandidateSkill(); c1.setSkillName("Java");
        CandidateSkill c2 = new CandidateSkill(); c2.setSkillName("Spring Boot");

        Job job = new Job();
        job.setRequiredExperienceYears(3.0);

        JobSkill j1 = new JobSkill(); j1.setSkillName("Java"); j1.setSkillType(SkillType.REQUIRED);
        JobSkill j2 = new JobSkill(); j2.setSkillName("Spring Boot"); j2.setSkillType(SkillType.REQUIRED);

        MatchResult result = matchService.calculate(profile, List.of(c1, c2), job, List.of(j1, j2));

        assertThat(result.overallScore()).isEqualTo(100);
        assertThat(result.matchedSkills()).containsExactly("Java", "Spring Boot");
        assertThat(result.missingSkills()).isEmpty();
        assertThat(result.experienceAssessment()).contains("Strong");
    }

    @Test
    void calculate_withSomeMissingSkills_returnsLowerScore() {
        CandidateProfile profile = new CandidateProfile();
        profile.setExperienceYears(1.0);

        CandidateSkill c1 = new CandidateSkill(); c1.setSkillName("Java");

        Job job = new Job();
        job.setRequiredExperienceYears(3.0);

        JobSkill j1 = new JobSkill(); j1.setSkillName("Java"); j1.setSkillType(SkillType.REQUIRED);
        JobSkill j2 = new JobSkill(); j2.setSkillName("AWS"); j2.setSkillType(SkillType.REQUIRED);
        JobSkill j3 = new JobSkill(); j3.setSkillName("Docker"); j3.setSkillType(SkillType.PREFERRED);

        MatchResult result = matchService.calculate(profile, List.of(c1), job, List.of(j1, j2, j3));

        // 50% required match = 35 score, 0% preferred = 0 score. Total skill = 35. 
        // 35 * 0.8 = 28. Exp = 1/3 = 33.3 * 0.2 = 6.66. Overall ~ 35
        assertThat(result.overallScore()).isLessThan(50);
        assertThat(result.missingSkills()).containsExactlyInAnyOrder("AWS", "Docker");
        assertThat(result.experienceAssessment()).contains("Weak");
    }

    @Test
    void calculate_withNoJobSkills_handlesZeroDivision() {
        CandidateProfile profile = new CandidateProfile();
        Job job = new Job();

        MatchResult result = matchService.calculate(profile, List.of(), job, List.of());

        assertThat(result.overallScore()).isEqualTo(100);
        assertThat(result.matchedSkills()).isEmpty();
        assertThat(result.missingSkills()).isEmpty();
        assertThat(result.experienceAssessment()).isEqualTo("Not specified");
    }
}