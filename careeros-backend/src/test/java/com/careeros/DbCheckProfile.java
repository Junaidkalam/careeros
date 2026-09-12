package com.careeros;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class DbCheckProfile {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:postgresql://localhost:5432/careeros";
        String user = "careeros";
        String pass = "careeros";
        try (Connection conn = DriverManager.getConnection(url, user, pass);
             Statement stmt = conn.createStatement()) {
            
            ResultSet rs = stmt.executeQuery("SELECT resume_id, primary_role, experience_years, summary FROM candidate_profile");
            while (rs.next()) {
                System.out.println("Profile for Resume: " + rs.getString("resume_id") + 
                                   ", Role: " + rs.getString("primary_role") + 
                                   ", Years: " + rs.getDouble("experience_years") +
                                   ", Summary: " + rs.getString("summary"));
            }
        }
    }
}