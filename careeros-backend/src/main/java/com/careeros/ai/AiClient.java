package com.careeros.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Component
public class AiClient {

    private static final String GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent";

    @Value("${app.ai.provider-api-key:#{null}}")
    private String apiKey;

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public AiClient() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(20))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    public String callForJson(String prompt) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new AiClientException(
                    "AI provider API key is not configured (set app.ai.provider-api-key)");
        }

        String requestBody = buildRequestBody(prompt);

        int maxRetries = 2;
        for (int i = 0; i <= maxRetries; i++) {
            try {
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(GEMINI_URL + "?key=" + apiKey))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                        .timeout(Duration.ofSeconds(60))
                        .build();

                HttpResponse<String> response =
                        httpClient.send(request, HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() != 200) {
                    if (response.statusCode() == 503 || response.statusCode() == 429) {
                        if (i == maxRetries) {
                            throw new AiClientException("Gemini API returned HTTP " + response.statusCode() + " after retries: " + truncate(response.body(), 300));
                        }
                        System.out.println("Gemini API returned " + response.statusCode() + ", retrying...");
                        Thread.sleep(2000);
                        continue;
                    }
                    throw new AiClientException(
                            "Gemini API returned HTTP " + response.statusCode()
                                    + ": " + truncate(response.body(), 300));
                }

                System.out.println("====== RAW JSON FROM LLM ======\n" + response.body());
                JsonNode root = objectMapper.readTree(response.body());
                String text = root
                        .path("candidates").path(0)
                        .path("content").path("parts").path(0)
                        .path("text").asText(null);

                if (text == null || text.isBlank()) {
                    throw new AiClientException("Gemini API returned empty text");
                }
                return text;

            } catch (java.net.http.HttpTimeoutException e) {
                if (i == maxRetries) {
                    throw new AiClientException("Failed to call Gemini API: request timed out after " + maxRetries + " retries", e);
                }
            } catch (AiClientException e) {
                throw e;
            } catch (Exception e) {
                if (i == maxRetries) {
                    throw new AiClientException("Failed to call Gemini API: " + e.getMessage(), e);
                }
            }
        }
        throw new AiClientException("Failed to call Gemini API");
    }

    private String buildRequestBody(String prompt) {
        String escapedPrompt = prompt.replace("\"", "\\\"").replace("\n", "\\n");
        return """
                {
                  "contents": [{
                    "parts": [{"text": "%s"}]
                  }],
                  "generationConfig": {
                    "temperature": 0.1
                  }
                }
                """.formatted(escapedPrompt);
    }

    private String truncate(String s, int max) {
        if (s == null) return "null";
        return s.length() > max ? s.substring(0, max) + "..." : s;
    }
}