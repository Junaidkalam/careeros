package com.careeros;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class DbCheckUser {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:postgresql://localhost:5432/careeros";
        String user = "careeros";
        String pass = "careeros";
        try (Connection conn = DriverManager.getConnection(url, user, pass);
             Statement stmt = conn.createStatement()) {
            
            ResultSet rs = stmt.executeQuery("SELECT id, email FROM app_user");
            while (rs.next()) {
                System.out.println("User ID: " + rs.getString("id") + ", email: " + rs.getString("email"));
            }
            
            System.out.println("--- Resumes ---");
            rs = stmt.executeQuery("SELECT id, user_id FROM resume");
            while (rs.next()) {
                System.out.println("Resume ID: " + rs.getString("id") + ", user_id: " + rs.getString("user_id"));
            }
        }
    }
}