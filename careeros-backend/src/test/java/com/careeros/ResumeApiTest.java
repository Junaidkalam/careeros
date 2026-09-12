package com.careeros;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class ResumeApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void testGetResumes() throws Exception {
        String loginBody = "{\"email\":\"test@gmail.com\",\"password\":\"password\"}";
        String loginRes = mockMvc.perform(post("/api/auth/login")
                .contentType("application/json")
                .content(loginBody))
                .andReturn().getResponse().getContentAsString();
                
        String token = loginRes.split("\"token\":\"")[1].split("\"")[0];
        
        String response = mockMvc.perform(get("/api/resumes")
                .header("Authorization", "Bearer " + token))
                .andReturn().getResponse().getContentAsString();
        System.out.println("API RESPONSE: " + response);
    }
}