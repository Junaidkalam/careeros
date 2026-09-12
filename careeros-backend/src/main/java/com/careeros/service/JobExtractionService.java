package com.careeros.service;

import com.careeros.ai.AiClient;
import com.careeros.ai.AiClientException;
import com.careeros.dto.JobExtractionResponse;
import com.careeros.dto.JobRequest;
import com.careeros.entity.enums.WorkMode;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.HttpStatusException;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Extracts job-posting data from a URL.
 *
 * <p><b>Strategy (in priority order):</b>
 * <ol>
 *   <li>Fetch with Jsoup (realistic UA, 8 s timeout).</li>
 *   <li>Look for {@code <script type="application/ld+json">} with {@code "@type":"JobPosting"}
 *       - parse directly, no LLM needed.</li>
 *   <li>Fallback: strip noise elements, pass visible text to {@link AiClient},
 *       parse the returned JSON into a {@link JobRequest}.</li>
 * </ol>
 *
 * <p><b>Failures are surfaced in {@link JobExtractionResponse#warning()}</b>, never as 500s:
 * <ul>
 *   <li>URL unreachable - warning, stub draft</li>
 *   <li>No extractable page content - warning, stub draft</li>
 *   <li>LLM call failed - warning, partial draft (raw text in description)</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class JobExtractionService {

    private static final int FETCH_TIMEOUT_MS = 8_000;
    private static final int MAX_TEXT_CHARS   = 8_000;
    private static final String USER_AGENT =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
            "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    private static final String SOURCE_LABEL = "URL Import";

    private final AiClient aiClient;
    private final ObjectMapper objectMapper;

    // -
    // Public entry point
    // -

    public JobExtractionResponse extractFromUrl(String url) {
        Document doc;
        try {
            doc = Jsoup.connect(url)
                    .timeout(FETCH_TIMEOUT_MS)
                    .userAgent(USER_AGENT)
                    .get();
        } catch (HttpStatusException e) {
            log.warn("HTTP {} fetching URL {}: {}", e.getStatusCode(), url, e.getMessage());
            String site = url.contains("glassdoor") ? "Glassdoor" : (url.contains("linkedin") ? "LinkedIn" : "This job board");
            return new JobExtractionResponse(
                    stubDraft(url),
                    false,
                    site + " blocked automated extraction (Error " + e.getStatusCode() + "). Please copy and paste the job details manually below."
            );
        } catch (IOException e) {
            log.warn("Could not fetch URL {}: {}", url, e.getMessage());
            return new JobExtractionResponse(
                    stubDraft(url),
                    false,
                    "URL could not be reached: " + e.getMessage()
            );
        }
        return extractFromDocument(doc, url);
    }

    /**
     * Core extraction logic, exposed for testing so callers can inject
     * an already-parsed Jsoup {@link Document} without making network calls.
     */
    public JobExtractionResponse extractFromDocument(Document doc, String url) {

        // - 1. JSON-LD path -
        Optional<JobRequest> jsonLd = tryParseJsonLd(doc, url);
        if (jsonLd.isPresent()) {
            return new JobExtractionResponse(jsonLd.get(), true, null);
        }

        // - 2. LLM fallback -
        String pageText = extractPageText(doc);
        if (pageText.isBlank()) {
            return new JobExtractionResponse(
                    stubDraft(url),
                    false,
                    "No extractable content found on the page"
            );
        }

        try {
            String prompt   = buildExtractionPrompt(pageText, url);
            String rawJson  = aiClient.callForJson(prompt);
            JobRequest draft = parseLlmResponse(rawJson, url);
            return new JobExtractionResponse(draft, false, null);
        } catch (AiClientException e) {
            log.warn("AI extraction failed for {}: {}", url, e.getMessage());
            // Return a partial draft so the user still sees something useful.
            // Cap description at 2 000 chars to avoid an enormous JSON response.
            String snippet = pageText.length() > 2_000
                    ? pageText.substring(0, 2_000) + "-"
                    : pageText;
            JobRequest partial = new JobRequest(
                    null, null, null, null, null,
                    snippet, url, SOURCE_LABEL,
                    null, null, null, null, null
            );
            return new JobExtractionResponse(partial, false, "AI extraction failed: " + e.getMessage());
        }
    }

    // -
    // JSON-LD parsing
    // -

    private Optional<JobRequest> tryParseJsonLd(Document doc, String url) {
        for (Element script : doc.select("script[type=application/ld+json]")) {
            String json = script.data().trim();
            if (json.isEmpty()) continue;
            try {
                JsonNode root = objectMapper.readTree(json);
                if (root.isArray()) {
                    for (JsonNode node : root) {
                        Optional<JobRequest> r = tryParseJobPosting(node, url);
                        if (r.isPresent()) return r;
                    }
                } else {
                    Optional<JobRequest> r = tryParseJobPosting(root, url);
                    if (r.isPresent()) return r;
                }
            } catch (Exception e) {
                log.debug("Skipping malformed JSON-LD block: {}", e.getMessage());
            }
        }
        return Optional.empty();
    }

    private Optional<JobRequest> tryParseJobPosting(JsonNode node, String url) {
        String type = node.path("@type").asText("");
        if (!"JobPosting".equalsIgnoreCase(type)) return Optional.empty();

        // schema.org uses "title"; fall back to "name" just in case
        String title = nullIfBlank(node.path("title").asText(null));
        if (title == null) title = nullIfBlank(node.path("name").asText(null));

        String companyName = nullIfBlank(
                node.path("hiringOrganization").path("name").asText(null));

        String location    = extractJsonLdLocation(node);
        WorkMode workMode  = extractJsonLdWorkMode(node, location);
        String employmentType = nullIfBlank(node.path("employmentType").asText(null));

        // description may contain HTML markup - strip it for clean plain text
        String rawDesc  = node.path("description").asText(null);
        String description = rawDesc != null ? Jsoup.parse(rawDesc).text() : null;

        LocalDate postedDate = parseDate(node.path("datePosted").asText(null));
        String salaryRange   = extractJsonLdSalary(node);

        return Optional.of(new JobRequest(
                title, companyName, location, workMode, employmentType,
                description, url, SOURCE_LABEL, postedDate, salaryRange,
                null, null, null
        ));
    }

    private String extractJsonLdLocation(JsonNode node) {
        JsonNode loc = node.path("jobLocation");
        if (loc.isMissingNode()) return null;
        if (loc.isTextual()) return loc.asText();

        // schema.org Place with PostalAddress
        JsonNode address = loc.path("address");
        if (!address.isMissingNode()) {
            List<String> parts = new ArrayList<>();
            addIfPresent(parts, address.path("addressLocality").asText(null));
            addIfPresent(parts, address.path("addressRegion").asText(null));
            addIfPresent(parts, address.path("addressCountry").asText(null));
            String joined = String.join(", ", parts);
            return joined.isBlank() ? null : joined;
        }
        return nullIfBlank(loc.path("name").asText(null));
    }

    private WorkMode extractJsonLdWorkMode(JsonNode node, String location) {
        // schema.org standard field for remote jobs
        if ("TELECOMMUTE".equalsIgnoreCase(node.path("jobLocationType").asText(null))) {
            return WorkMode.REMOTE;
        }
        // Heuristic: "remote" in the location string
        if (location != null && location.toLowerCase().contains("remote")) {
            return WorkMode.REMOTE;
        }
        return WorkMode.UNKNOWN;
    }

    private String extractJsonLdSalary(JsonNode node) {
        JsonNode salary = node.path("baseSalary");
        if (salary.isMissingNode()) return null;

        String currency = nullIfBlank(salary.path("currency").asText(null));

        // MonetaryAmount with nested QuantitativeValue
        JsonNode valueNode = salary.path("value");
        if (!valueNode.isMissingNode() && !valueNode.isValueNode()) {
            double min  = valueNode.path("minValue").asDouble(0);
            double max  = valueNode.path("maxValue").asDouble(0);
            String unit = valueNode.path("unitText").asText("YEAR");
            if (min > 0 && max > 0) {
                return String.format("%s%.0f\u2013%.0f/%s",
                        currency != null ? currency + " " : "", min, max, unit);
            }
        }

        // Flat min/max on the salary node itself
        double min = salary.path("minValue").asDouble(0);
        double max = salary.path("maxValue").asDouble(0);
        if (min > 0 && max > 0) {
            return String.format("%s%.0f\u2013%.0f",
                    currency != null ? currency + " " : "", min, max);
        }
        return null;
    }

    // -
    // LLM fallback
    // -

    private String extractPageText(Document doc) {
        // Clone to avoid mutating the original document (side effects in tests)
        Document clone = doc.clone();
        clone.select("nav, footer, header, script, style, noscript, iframe, svg").remove();
        String text = clone.body() != null ? clone.body().text() : "";
        return text.length() > MAX_TEXT_CHARS ? text.substring(0, MAX_TEXT_CHARS) : text;
    }

    private String buildExtractionPrompt(String pageText, String url) {
        return """
                You are a job data extractor. Extract job posting details from the webpage text below.
                Return ONLY a valid JSON object matching this exact schema. \
                Use null for any field you cannot determine. Do NOT invent or guess values.

                Schema:
                {
                  "title": "string or null",
                  "companyName": "string or null",
                  "location": "string or null",
                  "workMode": "REMOTE or ONSITE or HYBRID or UNKNOWN or null",
                  "employmentType": "string or null",
                  "description": "string or null",
                  "requiredSkills": ["string"],
                  "preferredSkills": ["string"],
                  "postedDate": "YYYY-MM-DD or null",
                  "salaryRange": "string or null",
                "requiredExperienceYears": number or null$3}

                Return ONLY the JSON object. No markdown. No code fences. No explanation.

                Source URL: %s

                Webpage text:
                %s
                """.formatted(url, pageText);
    }

    private JobRequest parseLlmResponse(String rawJson, String url) {
        // Strip markdown code fences the model might add despite instructions
        String json = rawJson.strip();
        if (json.startsWith("```")) {
            int firstNewline = json.indexOf('\n');
            int lastFence    = json.lastIndexOf("```");
            if (firstNewline > 0 && lastFence > firstNewline) {
                json = json.substring(firstNewline + 1, lastFence).strip();
            }
        }

        try {
            JsonNode node = objectMapper.readTree(json);
            return new JobRequest(
                    nullIfBlank(node.path("title").asText(null)),
                    nullIfBlank(node.path("companyName").asText(null)),
                    nullIfBlank(node.path("location").asText(null)),
                    parseWorkMode(node.path("workMode").asText(null)),
                    nullIfBlank(node.path("employmentType").asText(null)),
                    nullIfBlank(node.path("description").asText(null)),
                    url,
                    SOURCE_LABEL,
                    parseDate(node.path("postedDate").asText(null)),
                    nullIfBlank(node.path("salaryRange").asText(null)),
                    node.path("requiredExperienceYears").isNumber() ? node.path("requiredExperienceYears").asDouble() : null,
                    parseStringArray(node.path("requiredSkills")),
                    parseStringArray(node.path("preferredSkills"))
            );
        } catch (Exception e) {
            throw new AiClientException("Failed to parse LLM JSON response: " + e.getMessage(), e);
        }
    }

    // -
    // Utilities
    // -

    private static JobRequest stubDraft(String url) {
        return new JobRequest(
                null, null, null, null, null, null,
                url, SOURCE_LABEL,
                null, null, null, null, null
        );
    }

    private static String nullIfBlank(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }

    private static LocalDate parseDate(String s) {
        if (s == null || s.isBlank()) return null;
        try {
            // Truncate to 10 chars to handle ISO datetime strings like "2024-03-15T00:00:00Z"
            return LocalDate.parse(s.length() > 10 ? s.substring(0, 10) : s);
        } catch (Exception e) {
            return null;
        }
    }

    private static WorkMode parseWorkMode(String s) {
        if (s == null || s.isBlank()) return null;
        try { return WorkMode.valueOf(s.trim().toUpperCase()); }
        catch (IllegalArgumentException e) { return WorkMode.UNKNOWN; }
    }

    private static List<String> parseStringArray(JsonNode node) {
        if (!node.isArray()) return null;
        List<String> result = new ArrayList<>();
        for (JsonNode item : node) {
            String text = nullIfBlank(item.asText(null));
            if (text != null) result.add(text);
        }
        return result.isEmpty() ? null : result;
    }

    private static void addIfPresent(List<String> list, String value) {
        if (value != null && !value.isBlank()) list.add(value.trim());
    }
}