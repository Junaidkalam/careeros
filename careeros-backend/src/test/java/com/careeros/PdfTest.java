package com.careeros;

import org.apache.tika.Tika;
import java.io.File;
import java.io.FileInputStream;

public class PdfTest {
    public static void main(String[] args) throws Exception {
        File pdfFile = new File("uploads/39e6ecbd-c3b2-4d33-adfc-84d47a0e46b4_Junaid_Kalam_CV.pdf");
        System.out.println("File size: " + pdfFile.length() + " bytes");

        System.out.println("\n--- APACHE TIKA ---");
        Tika tika = new Tika();
        try (FileInputStream fis = new FileInputStream(pdfFile)) {
            String tikaText = tika.parseToString(fis);
            System.out.println("Tika extracted " + (tikaText != null ? tikaText.length() : 0) + " characters.");
            System.out.println("Preview: " + (tikaText != null ? tikaText.substring(0, Math.min(tikaText.length(), 100)).replace("\n", " ") : "null"));
            
            // Check if it contains expected sections
            System.out.println("Contains SUMMARY? " + tikaText.contains("SUMMARY"));
            System.out.println("Contains EDUCATION? " + tikaText.contains("EDUCATION"));
            System.out.println("Contains JUNAID KALAM? " + tikaText.contains("JUNAID KALAM"));
        }
    }
}