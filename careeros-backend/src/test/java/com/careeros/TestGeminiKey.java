package com.careeros;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class TestGeminiKey {
    public static void main(String[] args) throws Exception {
        String key = System.getenv("AI_PROVIDER_API_KEY");
        if (key == null || key.isBlank()) {
            System.out.println("No API key found in System.getenv!");
            return;
        }
        
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + key;
        String body = "{\"contents\": [{\"parts\": [{\"text\": \"Say hi\"}]}]}";
        
        HttpRequest req = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(body))
            .build();
            
        HttpResponse<String> res = HttpClient.newHttpClient().send(req, HttpResponse.BodyHandlers.ofString());
        System.out.println("Status: " + res.statusCode());
        System.out.println("Body: " + res.body());
    }
}