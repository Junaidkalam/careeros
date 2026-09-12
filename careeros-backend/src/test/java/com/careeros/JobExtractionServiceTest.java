package com.careeros;

import com.careeros.ai.AiClient;
import com.careeros.dto.JobExtractionResponse;
import com.careeros.entity.enums.WorkMode;
import com.careeros.service.JobExtractionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link JobExtractionService}.
 *
 * <p>All three tests run offline:
 * <ul>
 *   <li>JSON-LD test   — Jsoup parses a local HTML fixture; AiClient never called</li>
 *   <li>Dead-link test — connects to 127.0.0.1:19999 (connection refused, instant fail)</li>
 *   <li>LLM test       — local HTML with no JSON-LD; AiClient is mocked</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
class JobExtractionServiceTest {

    @Mock
    private AiClient aiClient;

    private JobExtractionService service;

    @BeforeEach
    void setUp() {
        service = new JobExtractionService(aiClient, new ObjectMapper());
    }

    // ── Test 1: JSON-LD happy path ────────────────────────────────────────────

    @Test
    void extractFromJsonLd_parsesAllFieldsFromFixture() throws IOException {
        String html = loadFixture("fixtures/job_posting_jsonld.html");
        Document doc = Jsoup.parse(html, "https://example.com/jobs/1");

        JobExtractionResponse result = service.extractFromDocument(doc, "https://example.com/jobs/1");

        assertThat(result.extractedFromJsonLd()).isTrue();
        assertThat(result.warning()).isNull();

        assertThat(result.draft().title()).isEqualTo("Senior Backend Engineer");
        assertThat(result.draft().companyName()).isEqualTo("Acme Corp");
        assertThat(result.draft().location()).contains("San Francisco");
        assertThat(result.draft().workMode()).isEqualTo(WorkMode.REMOTE);   // jobLocationType=TELECOMMUTE
        assertThat(result.draft().employmentType()).isEqualTo("FULL_TIME");
        assertThat(result.draft().postedDate()).hasToString("2024-03-15");
        // Salary contains both boundary values — exact format may vary
        assertThat(result.draft().salaryRange()).contains("130000").contains("180000");
        // HTML tags stripped from description
        assertThat(result.draft().description())
                .doesNotContain("<p>")
                .doesNotContain("<li>")
                .contains("Senior Backend Engineer");
        // postingUrl preserved
        assertThat(result.draft().postingUrl()).isEqualTo("https://example.com/jobs/1");
        assertThat(result.draft().source()).isEqualTo("URL Import");
    }

    // ── Test 2: Dead URL → warning, stub draft ────────────────────────────────

    @Test
    void extractFromDeadLink_returnsWarningWithStubDraft() {
        // Port 19999 on loopback is almost certainly not listening; connection refused is instant
        String deadUrl = "http://127.0.0.1:19999/nonexistent-job-posting";

        JobExtractionResponse result = service.extractFromUrl(deadUrl);

        assertThat(result.extractedFromJsonLd()).isFalse();
        assertThat(result.warning())
                .isNotNull()
                .startsWith("URL could not be reached:");
        // Always returns a non-null stub draft
        assertThat(result.draft()).isNotNull();
        assertThat(result.draft().postingUrl()).isEqualTo(deadUrl);
    }

    // ── Test 3: No JSON-LD → LLM fallback with mocked AiClient ───────────────

    @Test
    void llmFallback_parsesFieldsFromMockedAiClient() throws IOException {
        String html = loadFixture("fixtures/job_no_jsonld.html");
        Document doc = Jsoup.parse(html, "https://example.com/jobs/2");

        // Simulate a well-formed Gemini response
        String cannedJson = """
                {
                  "title": "Product Manager",
                  "companyName": "TechCo",
                  "location": "New York, NY",
                  "workMode": "HYBRID",
                  "employmentType": "Full-time",
                  "description": "Lead product strategy and roadmap for our core platform.",
                  "requiredSkills": ["Agile", "Roadmap Planning"],
                  "preferredSkills": ["SQL", "Figma"],
                  "postedDate": "2024-04-01",
                  "salaryRange": "USD 120,000\u2013150,000"
                }
                """;
        when(aiClient.callForJson(anyString())).thenReturn(cannedJson);

        JobExtractionResponse result = service.extractFromDocument(doc, "https://example.com/jobs/2");

        assertThat(result.extractedFromJsonLd()).isFalse();
        assertThat(result.warning()).isNull();

        assertThat(result.draft().title()).isEqualTo("Product Manager");
        assertThat(result.draft().companyName()).isEqualTo("TechCo");
        assertThat(result.draft().location()).isEqualTo("New York, NY");
        assertThat(result.draft().workMode()).isEqualTo(WorkMode.HYBRID);
        assertThat(result.draft().employmentType()).isEqualTo("Full-time");
        assertThat(result.draft().postedDate()).hasToString("2024-04-01");
        assertThat(result.draft().requiredSkills()).containsExactly("Agile", "Roadmap Planning");
        assertThat(result.draft().preferredSkills()).containsExactly("SQL", "Figma");
        assertThat(result.draft().salaryRange()).contains("120,000");
    }

    // ── helper ────────────────────────────────────────────────────────────────

    private String loadFixture(String classpathPath) throws IOException {
        try (InputStream is = getClass().getClassLoader().getResourceAsStream(classpathPath)) {
            if (is == null) throw new IOException("Fixture not found on classpath: " + classpathPath);
            return new String(is.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
}