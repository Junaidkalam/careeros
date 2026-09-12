package com.careeros;

import org.apache.tika.Tika;
import java.io.File;

public class TikaTest {
    public static void main(String[] args) throws Exception {
        Tika tika = new Tika();
        File file = new File("C:\\Users\\junai\\.gemini\\antigravity\\brain\\b4665f4f-4b18-4225-b5ee-74351e35bc40\\.user_uploaded\\media_1788869357003.pdf");
        String text = tika.parseToString(file);
        System.out.println("Tika extracted text length: " + text.length());
        System.out.println("Contains 16844? " + text.contains("16844"));
        if (text.length() > 500) {
            System.out.println(text.substring(0, 500));
        } else {
            System.out.println(text);
        }
    }
}