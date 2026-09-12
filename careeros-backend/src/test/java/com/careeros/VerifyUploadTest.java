package com.careeros;

import com.careeros.dto.ResumeResponse;
import com.careeros.entity.User;
import com.careeros.repository.UserRepository;
import com.careeros.service.ResumeService;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.UUID;

@SpringBootTest
public class VerifyUploadTest {

    @Autowired
    private ResumeService resumeService;

    @Autowired
    private UserRepository userRepository;

    @BeforeAll
    public static void setup() {
        System.setProperty("app.ai.provider-api-key", System.getenv("AI_PROVIDER_API_KEY"));
    }

    @Test
    public void testUpload() throws Exception {
        System.out.println("ENV API KEY: " + System.getenv("AI_PROVIDER_API_KEY"));
        User user = new User();
        user.setName("Verify User");
        user.setEmail("verify" + UUID.randomUUID() + "@test.com");
        user.setPasswordHash("hash");
        userRepository.save(user);

        byte[] pdfBytes = Files.readAllBytes(Paths.get("C:/Users/junai/.gemini/antigravity/brain/b4665f4f-4b18-4225-b5ee-74351e35bc40/.user_uploaded/media_1788869357003.pdf"));
        
        MockMultipartFile file = new MockMultipartFile("file", "real_cv.pdf", "application/pdf", pdfBytes);

        System.out.println("Uploading...");
        ResumeResponse res = resumeService.upload(user, file, "v1");
        
        System.out.println("====== RAW JSON TEST ======");
        System.out.println("Result ID: " + res.id());
        System.out.println("Warning: " + res.warning());
        System.out.println("Profile Generated: " + res.profileGenerated());
        if (res.candidateProfile() != null) {
            System.out.println("Primary Role: " + res.candidateProfile().primaryRole());
            System.out.println("Experience: " + res.candidateProfile().experienceYears());
            System.out.println("Summary: " + res.candidateProfile().summary());
        }
    }
}