package com.careeros.service;

import com.careeros.exception.UnsupportedFileTypeException;
import lombok.extern.slf4j.Slf4j;
import org.apache.tika.Tika;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;

@Slf4j
@Component
public class ResumeTextExtractor {

    private final Tika tika = new Tika();

    public String extract(String filename, byte[] fileBytes) throws IOException {
        log.info("Starting text extraction for file: {}, received byte count: {}", filename, fileBytes.length);
        String lower = filename.toLowerCase();
        
        if (!lower.endsWith(".pdf") && !lower.endsWith(".docx")) {
            throw new UnsupportedFileTypeException(
                    "Unsupported file type. Only .pdf and .docx files are accepted. Got: " + filename);
        }
        
        try (InputStream stream = new ByteArrayInputStream(fileBytes)) {
            String extractedText = tika.parseToString(stream);
            
            if (extractedText == null) {
                return "";
            }
            
            extractedText = extractedText.trim();
            log.info("Tika successfully extracted {} raw characters.", extractedText.length());
            
            return extractedText;
        } catch (Exception e) {
            log.error("Tika encountered an exception during extraction!", e);
            throw new IOException("Extraction failed: " + e.getMessage(), e);
        }
    }
}