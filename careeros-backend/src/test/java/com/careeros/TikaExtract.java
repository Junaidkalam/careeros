package com.careeros;

import org.apache.tika.Tika;
import java.io.File;

public class TikaExtract {
    public static void main(String[] args) throws Exception {
        Tika tika = new Tika();
        File f = new File("C:\\Users\\junai\\.gemini\\antigravity\\brain\\b4665f4f-4b18-4225-b5ee-74351e35bc40\\.user_uploaded\\media_1788869357003.pdf");
        String text = tika.parseToString(f);
        System.out.println("Contains 16844? " + text.contains("16844"));
        
        String[] lines = text.split("\n");
        for(int i=0; i<lines.length; i++) {
            if(lines[i].contains("16844")) {
                System.out.println("Line " + i + ": " + lines[i].trim());
            }
        }
    }
}