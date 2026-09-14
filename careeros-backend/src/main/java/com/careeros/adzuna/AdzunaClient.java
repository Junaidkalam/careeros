package com.careeros.adzuna;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Thin HTTP client for the Adzuna Job Search API.
 * Follows the same credentials pattern as {@link com.careeros.ai.AiClient}.
 */
@Component
public class AdzunaClient {

    private static final Logger log = LoggerFactory.getLogger(AdzunaClient.class);
    private static final String BASE_URL = "https://api.adzuna.com/v1/api/jobs/in/search/1";

    @Value("${app.adzuna.app-id:}")
    private String appId;

    @Value("${app.adzuna.app-key:}")
    private String appKey;

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public AdzunaClient() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    /** Returns true when credentials are configured. */
    public boolean isConfigured() {
        return appId != null && !appId.isBlank() && appKey != null && !appKey.isBlank();
    }

    /**
     * Searches Adzuna for jobs matching {@code query} (e.g. "Java Spring Boot").
     *
     * @param query      free-text search term
     * @param maxResults how many results to request (max 50)
     * @return list of raw Adzuna result nodes, never null
     * @throws AdzunaClientException on API error or network failure
     */
    public List<AdzunaJob> search(String query, int maxResults) {
        if (!isConfigured()) {
            throw new AdzunaClientException(
                    "Adzuna credentials are not configured (set ADZUNA_APP_ID and ADZUNA_APP_KEY)");
        }

        String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8);
        String url = BASE_URL
                + "?app_id=" + appId
                + "&app_key=" + appKey
                + "&what=" + encodedQuery
                + "&results_per_page=" + Math.min(maxResults, 50)
                + "&content-type=application/json";

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Accept", "application/json")
                    .GET()
                    .timeout(Duration.ofSeconds(30))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                throw new AdzunaClientException(
                        "Adzuna API returned HTTP " + response.statusCode() + ": "
                                + truncate(response.body(), 300));
            }

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode results = root.path("results");
            if (!results.isArray()) {
                log.warn("Adzuna response missing 'results' array");
                return List.of();
            }

            List<AdzunaJob> jobs = new ArrayList<>();
            for (JsonNode node : results) {
                try {
                    jobs.add(mapNode(node));
                } catch (Exception e) {
                    log.warn("Skipping malformed Adzuna result: {}", e.getMessage());
                }
            }
            return jobs;

        } catch (AdzunaClientException e) {
            throw e;
        } catch (Exception e) {
            throw new AdzunaClientException("Failed to call Adzuna API: " + e.getMessage(), e);
        }
    }

    private AdzunaJob mapNode(JsonNode node) {
        // Strip HTML tags from title and description
        String rawTitle = node.path("title").asText("");
        String title = rawTitle.replaceAll("<[^>]+>", "").trim();

        String rawDescription = node.path("description").asText("");
        String description = rawDescription.replaceAll("<[^>]+>", "").trim();

        String company = node.path("company").path("display_name").asText(null);
        String redirectUrl = node.path("redirect_url").asText(null);
        String location = node.path("location").path("display_name").asText(null);

        // Contract type → employment type mapping
        String contractTime = node.path("contract_time").asText(null);
        String contractType = node.path("contract_type").asText(null);
        String employmentType = mapEmploymentType(contractTime, contractType);

        // Salary range
        String salaryRange = null;
        if (!node.path("salary_min").isMissingNode() || !node.path("salary_max").isMissingNode()) {
            double min = node.path("salary_min").asDouble(0);
            double max = node.path("salary_max").asDouble(0);
            if (min > 0 || max > 0) {
                salaryRange = formatSalary(min) + " – " + formatSalary(max);
            }
        }

        // Created date
        java.time.LocalDate postedDate = null;
        String created = node.path("created").asText(null);
        if (created != null && !created.isBlank()) {
            try {
                postedDate = Instant.parse(created).atZone(java.time.ZoneOffset.UTC).toLocalDate();
            } catch (Exception ignored) {}
        }

        return new AdzunaJob(title, company, location, employmentType, description,
                redirectUrl, salaryRange, postedDate);
    }

    private String mapEmploymentType(String contractTime, String contractType) {
        if ("full_time".equals(contractTime)) return "Full-time";
        if ("part_time".equals(contractTime)) return "Part-time";
        if ("contract".equals(contractType)) return "Contract";
        return null;
    }

    private String formatSalary(double amount) {
        if (amount >= 1000) {
            return "£" + (int) (amount / 1000) + "k";
        }
        return "£" + (int) amount;
    }

    private String truncate(String s, int max) {
        if (s == null) return "null";
        return s.length() > max ? s.substring(0, max) + "..." : s;
    }
}
