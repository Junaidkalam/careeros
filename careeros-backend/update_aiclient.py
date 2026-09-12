import re

with open('src/main/java/com/careeros/ai/AiClient.java', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the timeout config inside the constructor
content = content.replace('.connectTimeout(Duration.ofSeconds(10))', '.connectTimeout(Duration.ofSeconds(20))')

# Replace the entire callForJson try-catch block
new_try_block = """
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
                    throw new AiClientException(
                            "Gemini API returned HTTP " + response.statusCode()
                                    + ": " + truncate(response.body(), 300));
                }

                JsonNode root = objectMapper.readTree(response.body());
                String text = root
                        .path("candidates").path(0)
                        .path("content").path("parts").path(0)
                        .path("text").asText(null);

                if (text == null || text.isBlank()) {
                    throw new AiClientException("Empty text response from Gemini API");
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
"""

# Regex to replace the old try-catch
content = re.sub(r'String requestBody = buildRequestBody\(prompt\);.*?catch \(Exception e\) \{[^}]+\}\s*\}', new_try_block.strip(), content, flags=re.DOTALL)

with open('src/main/java/com/careeros/ai/AiClient.java', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated AiClient.java")