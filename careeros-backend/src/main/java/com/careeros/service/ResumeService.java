package com.careeros.service;

import com.careeros.ai.AiClient;
import com.careeros.ai.AiClientException;
import com.careeros.dto.CandidateProfileDto;
import com.careeros.dto.CandidateSkillDto;
import com.careeros.dto.ResumeProfileUpdateRequest;
import com.careeros.dto.ResumeResponse;
import com.careeros.entity.CandidateProfile;
import com.careeros.entity.CandidateSkill;
import com.careeros.entity.Resume;
import com.careeros.entity.User;
import com.careeros.entity.enums.SkillCategory;
import com.careeros.exception.ResourceNotFoundException;
import com.careeros.repository.CandidateProfileRepository;
import com.careeros.repository.CandidateSkillRepository;
import com.careeros.repository.ResumeRepository;
import com.careeros.storage.FileStorageService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Orchestrates resume upload, text extraction, AI profile generation,
 * and persistence. Follows the same service-layer pattern as JobService and
 * the same LLM handling pattern as JobExtractionService.
 *
 * <p>AI failures never abort the upload - the resume (with raw text) is always
 * saved; {@link ResumeResponse#profileGenerated()} and {@link ResumeResponse#warning()}
 * communicate partial success to the caller.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ResumeService {

    private static final int MAX_RESUME_TEXT_CHARS = 12_000;

    private final ResumeRepository resumeRepository;
    private final CandidateProfileRepository candidateProfileRepository;
    private final CandidateSkillRepository candidateSkillRepository;
    private final com.careeros.repository.ApplicationRepository applicationRepository;
    private final FileStorageService fileStorageService;
    private final ResumeTextExtractor textExtractor;
    private final AiClient aiClient;
    private final ObjectMapper objectMapper;

    // ------------------------------------------------
    // Upload
    // ------------------------------------------------

    @Transactional
    public ResumeResponse upload(User user, MultipartFile file, String versionLabel) {
        String originalFilename = file.getOriginalFilename() != null
                ? file.getOriginalFilename() : "resume";

        // 1. Extract text (throws UnsupportedFileTypeException - 400 if type invalid)
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new RuntimeException("Failed to read uploaded file: " + e.getMessage(), e);
        }
        
        String rawText;
        try {
            rawText = textExtractor.extract(originalFilename, bytes);
        } catch (IOException e) {
            throw new RuntimeException("Failed to extract text from file: " + e.getMessage(), e);
        }

        // 2. Store file
        String fileUrl;
        try {
            fileUrl = fileStorageService.store(originalFilename, bytes);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store uploaded file: " + e.getMessage(), e);
        }

        // 3. Persist Resume
        Resume resume = new Resume();
        resume.setUser(user);
        resume.setFilename(originalFilename);
        resume.setFileUrl(fileUrl);
        resume.setVersionLabel(versionLabel);
        resume.setRawText(rawText);
        resumeRepository.save(resume);

        // 4. Attempt AI profile generation (failure - warning, resume still saved)
        try {
            CandidateProfile profile = generateAndSaveProfile(resume, rawText);
            List<CandidateSkill> skills = candidateSkillRepository
                    .findByCandidateProfileId(profile.getId());
            return toResponse(resume, profile, skills, null);
        } catch (AiClientException e) {
            log.warn("AI profile generation failed for resume {}: {}", resume.getId(), e.getMessage());
            return toResponse(resume, null, List.of(),
                    "AI profile generation failed: " + e.getMessage());
        }
    }

    // ------------------------------------------------
    // List / Get
    // ------------------------------------------------

    public List<ResumeResponse> list(User user) {
        return resumeRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(r -> {
                    CandidateProfile profile = candidateProfileRepository
                            .findByResumeId(r.getId()).orElse(null);
                    List<CandidateSkill> skills = profile != null
                            ? candidateSkillRepository.findByCandidateProfileId(profile.getId())
                            : List.of();
                    return toResponse(r, profile, skills, null);
                })
                .toList();
    }

    public ResumeResponse getById(User user, UUID id) {
        Resume resume = resumeRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Resume not found: " + id));
        CandidateProfile profile = candidateProfileRepository
                .findByResumeId(resume.getId()).orElse(null);
        List<CandidateSkill> skills = profile != null
                ? candidateSkillRepository.findByCandidateProfileId(profile.getId())
                : List.of();
        return toResponse(resume, profile, skills, null);
    }

    // ------------------------------------------------
    // Update profile
    // ------------------------------------------------

    @Transactional
    public ResumeResponse updateProfile(User user, UUID id, ResumeProfileUpdateRequest req) {
        Resume resume = resumeRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Resume not found: " + id));

        // Upsert profile
        CandidateProfile profile = candidateProfileRepository
                .findByResumeId(resume.getId())
                .orElseGet(() -> {
                    CandidateProfile p = new CandidateProfile();
                    p.setResume(resume);
                    return p;
                });
        profile.setSummary(req.summary());
        profile.setExperienceYears(req.experienceYears());
        profile.setPrimaryRole(req.primaryRole());
        profile.setEducation(req.education());
        candidateProfileRepository.save(profile);

        // Replace skills wholesale
        List<CandidateSkill> existing =
                candidateSkillRepository.findByCandidateProfileId(profile.getId());
        candidateSkillRepository.deleteAll(existing);

        List<CandidateSkill> saved = new ArrayList<>();
        if (req.skills() != null) {
            for (CandidateSkillDto dto : req.skills()) {
                CandidateSkill skill = new CandidateSkill();
                skill.setCandidateProfile(profile);
                skill.setSkillName(dto.skillName());
                skill.setCategory(dto.category());
                saved.add(candidateSkillRepository.save(skill));
            }
        }
        return toResponse(resume, profile, saved, null);
    }

    // ------------------------------------------------
    // Delete
    // ------------------------------------------------

    @Transactional
    public void delete(User user, UUID id) {
        Resume resume = resumeRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Resume not found: " + id));
        
        // Disassociate from any applications
        List<com.careeros.entity.Application> apps = applicationRepository.findByResume(resume);
        for (com.careeros.entity.Application app : apps) {
            app.setResume(null);
            applicationRepository.save(app);
        }

        // CandidateProfile and CandidateSkills are handled by JPA cascade if configured,
        // but we can manually delete profile to be safe.
        candidateProfileRepository.findByResumeId(resume.getId()).ifPresent(profile -> {
            List<CandidateSkill> skills = candidateSkillRepository.findByCandidateProfileId(profile.getId());
            candidateSkillRepository.deleteAll(skills);
            candidateProfileRepository.delete(profile);
        });

        resumeRepository.delete(resume);
    }

    // ------------------------------------------------
    // AI profile generation (private)
    // ------------------------------------------------

    private CandidateProfile generateAndSaveProfile(Resume resume, String rawText) {
        String truncated = rawText.length() > MAX_RESUME_TEXT_CHARS
                ? rawText.substring(0, MAX_RESUME_TEXT_CHARS) + "\n[text truncated]"
                : rawText;

        String prompt = buildProfilePrompt(truncated);
        String raw = aiClient.callForJson(prompt);
        String json = stripFences(raw);

        JsonNode node;
        try {
            node = objectMapper.readTree(json);
        } catch (Exception e) {
            throw new AiClientException("Failed to parse AI profile JSON: " + e.getMessage(), e);
        }

        CandidateProfile profile = new CandidateProfile();
        profile.setResume(resume);
        profile.setSummary(nullIfBlank(node.path("summary").asText(null)));
        profile.setExperienceYears(
                node.path("experienceYears").isNumber()
                        ? node.path("experienceYears").asDouble()
                        : null);
        profile.setPrimaryRole(nullIfBlank(node.path("primaryRole").asText(null)));
        profile.setEducation(nullIfBlank(node.path("education").asText(null)));
        candidateProfileRepository.save(profile);

        JsonNode skillsNode = node.path("skills");
        if (skillsNode.isArray()) {
            for (JsonNode s : skillsNode) {
                String skillName = nullIfBlank(s.path("skillName").asText(null));
                if (skillName == null) continue;
                CandidateSkill skill = new CandidateSkill();
                skill.setCandidateProfile(profile);
                skill.setSkillName(skillName);
                skill.setCategory(parseSkillCategory(s.path("category").asText(null)));
                candidateSkillRepository.save(skill);
            }
        }
        return profile;
    }

    private String buildProfilePrompt(String resumeText) {
        return """
                You are a resume parser. Extract structured information from the resume text below.
                Return ONLY a valid JSON object matching this exact schema.

                Schema:
                {
                  "summary": "2-3 sentence professional summary",
                  "experienceYears": number (total years of professional work experience, NOT internships or projects),
                  "primaryRole": "the most fitting job title or target role for this candidate",
                  "education": "highest qualification, institution, year range or null",
                  "skills": [
                    {
                      "skillName": "string",
                      "category": "one of: PROGRAMMING_LANGUAGE, FRAMEWORK, LIBRARY, DATABASE, CLOUD, DEVOPS, TESTING, TOOL, CONCEPT, SOFT_SKILL, DOMAIN_SPECIFIC"
                    }
                  ]
                }

                Field guidance:
                - summary: Always provide a 2-3 sentence professional summary based on their background.
                - experienceYears: Count only paid professional employment (full-time/part-time jobs).
                  Internships, academic projects, and personal projects do NOT count.
                  If the candidate has no professional experience, use 0 (not null).
                - primaryRole: Infer the most suitable job title from their skills, projects, and education.
                  For example, a CS graduate building Java/Spring + React applications = "Software Engineer".
                  Never leave this null; always infer something reasonable.
                - education: Extract the highest degree, institution name, and year range. Use null if absent.
                - skills: Only list skills explicitly mentioned in the resume. Never invent skills.
                - category MUST be exactly one of the listed enum values.

                Return ONLY the JSON object. No markdown. No code fences. No explanation.

                Resume text:
                %s
                """.formatted(resumeText);
    }

    // ------------------------------------------------
    // Mapping helpers
    // ------------------------------------------------

    private ResumeResponse toResponse(Resume resume, CandidateProfile profile,
                                      List<CandidateSkill> skills, String warning) {
        CandidateProfileDto profileDto = null;
        if (profile != null) {
            List<CandidateSkillDto> skillDtos = skills.stream()
                    .map(s -> new CandidateSkillDto(s.getSkillName(), s.getCategory()))
                    .toList();
            profileDto = new CandidateProfileDto(
                    profile.getSummary(),
                    profile.getExperienceYears(),
                    profile.getPrimaryRole(),
                    profile.getEducation(),
                    skillDtos
            );
        }
        return new ResumeResponse(
                resume.getId(),
                resume.getFilename(),
                resume.getVersionLabel(),
                resume.getCreatedAt(),
                profile != null,
                warning,
                profileDto
        );
    }

    // ------------------------------------------------
    // Utilities - same approach as JobExtractionService
    // ------------------------------------------------

    /** Strip markdown code fences the model might add despite prompt instructions. */
    static String stripFences(String raw) {
        String s = raw.strip();
        if (!s.startsWith("```")) return s;
        int firstNewline = s.indexOf('\n');
        int lastFence    = s.lastIndexOf("```");
        if (firstNewline > 0 && lastFence > firstNewline) {
            return s.substring(firstNewline + 1, lastFence).strip();
        }
        return s;
    }

    private static String nullIfBlank(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }

    private static SkillCategory parseSkillCategory(String s) {
        if (s == null || s.isBlank()) return SkillCategory.TOOL;
        try { return SkillCategory.valueOf(s.trim().toUpperCase()); }
        catch (IllegalArgumentException e) { return SkillCategory.TOOL; }
    }
}