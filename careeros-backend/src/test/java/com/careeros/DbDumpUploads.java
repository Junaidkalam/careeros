package com.careeros;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class DbDumpUploads {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:postgresql://localhost:5432/careeros";
        String user = "careeros";
        String pass = "careeros";
        try (Connection conn = DriverManager.getConnection(url, user, pass);
             Statement stmt = conn.createStatement()) {
            
            System.out.println("--- Resumes ---");
            ResultSet rs = stmt.executeQuery("SELECT id, filename, warning, created_at FROM resume ORDER BY created_at DESC LIMIT 5");
            while (rs.next()) {
                System.out.println("Resume: id=" + rs.getString("id") + ", file=" + rs.getString("filename") + ", warning=" + rs.getString("warning") + ", time=" + rs.getString("created_at"));
            }
            
            System.out.println("\n--- Candidate Profiles ---");
            ResultSet rs2 = stmt.executeQuery("SELECT p.id, p.resume_id, p.primary_role, p.summary FROM candidate_profile p ORDER BY p.id DESC LIMIT 5");
            while (rs2.next()) {
                System.out.println("Profile: id=" + rs2.getString("id") + ", resume_id=" + rs2.getString("resume_id") + ", role=" + rs2.getString("primary_role") + ", summary=" + rs2.getString("summary"));
            }
        }
    }
}