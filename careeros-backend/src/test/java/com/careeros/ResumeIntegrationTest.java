package com.careeros;

import com.careeros.ai.AiClient;
import com.careeros.ai.AiClientException;
import com.careeros.dto.ResumeResponse;
import com.careeros.entity.User;
import com.careeros.exception.ResourceNotFoundException;
import com.careeros.repository.UserRepository;
import com.careeros.service.ResumeService;





import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityManager;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@SpringBootTest
@Transactional
public class ResumeIntegrationTest {

    @Autowired
    private ResumeService resumeService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.careeros.repository.ResumeRepository resumeRepository;

    @Autowired
    private EntityManager entityManager;

    @MockBean
    private AiClient aiClient;

    private User userA;
    private User userB;

    @BeforeEach
    void setUp() {
        userA = new User();
        userA.setEmail("usera@example.com");
        userA.setPasswordHash("hashA");
        userA.setName("User A");
        userA = userRepository.save(userA);

        userB = new User();
        userB.setEmail("userb@example.com");
        userB.setPasswordHash("hashB");
        userB.setName("User B");
        userB = userRepository.save(userB);
    }

    @Test
    void uploadPdf_extractsTextAndGeneratesProfile() throws IOException {
        byte[] pdfBytes = createMinimalPdf();
        MockMultipartFile file = new MockMultipartFile("file", "test.pdf", "application/pdf", pdfBytes);

        String cannedJson = """
                {
                  "summary": "PDF Summary",
                  "experienceYears": 3.5,
                  "primaryRole": "Backend Developer",
                  "education": "University",
                  "skills": []
                }
                """;
        when(aiClient.callForJson(anyString())).thenReturn(cannedJson);

        ResumeResponse response = resumeService.upload(userA, file, "v1");

        assertThat(response.profileGenerated()).isTrue();
        assertThat(response.warning()).isNull();
        assertThat(response.candidateProfile().summary()).isEqualTo("PDF Summary");
                assertThat(response.candidateProfile().summary()).isEqualTo("PDF Summary");
        assertThat(response.candidateProfile().primaryRole()).isEqualTo("Backend Developer");
        
                entityManager.flush();
        entityManager.clear();
        // Assert on rawText
        com.careeros.entity.Resume saved = resumeRepository.findById(response.id()).orElseThrow();
        assertThat(saved.getRawText()).contains("substantial PDF document");
    }

    @Test
    void uploadDocx_extractsTextAndGeneratesProfile() throws IOException {
        byte[] docxBytes = createMinimalDocx("This is a much more substantial DOCX document. It has a real paragraph of text to verify that Tika is parsing the file correctly.");
        MockMultipartFile file = new MockMultipartFile("file", "test.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", docxBytes);

        String cannedJson = """
                {
                  "summary": "DOCX Summary",
                  "experienceYears": 5.0,
                  "primaryRole": "Frontend Developer",
                  "education": "College",
                  "skills": []
                }
                """;
        when(aiClient.callForJson(anyString())).thenReturn(cannedJson);

        ResumeResponse response = resumeService.upload(userA, file, "v1");

        assertThat(response.profileGenerated()).isTrue();
        assertThat(response.warning()).isNull();
                assertThat(response.candidateProfile().summary()).isEqualTo("DOCX Summary");
        
                entityManager.flush();
        entityManager.clear();
        // Assert on rawText
        com.careeros.entity.Resume saved = resumeRepository.findById(response.id()).orElseThrow();
        assertThat(saved.getRawText()).contains("substantial DOCX document");
    }

    @Test
    void uploadPdf_whenAiClientThrows_savesResumeWithProfileGeneratedFalse() throws IOException {
        byte[] pdfBytes = createMinimalPdf();
        MockMultipartFile file = new MockMultipartFile("file", "fail.pdf", "application/pdf", pdfBytes);

        when(aiClient.callForJson(anyString())).thenThrow(new AiClientException("API Error"));

        ResumeResponse response = resumeService.upload(userA, file, "v1");

        // AI failed, but resume is saved!
        assertThat(response.profileGenerated()).isFalse();
        assertThat(response.warning()).contains("API Error");
        assertThat(response.candidateProfile()).isNull();
        assertThat(response.id()).isNotNull();

        // Verify we can retrieve it
        ResumeResponse fetched = resumeService.getById(userA, response.id());
        assertThat(fetched.filename()).isEqualTo("fail.pdf");
    }

    @Test
    void getById_withWrongUser_throwsResourceNotFound() throws IOException {
        byte[] pdfBytes = createMinimalPdf();
        MockMultipartFile file = new MockMultipartFile("file", "owner.pdf", "application/pdf", pdfBytes);

        when(aiClient.callForJson(anyString())).thenReturn("{}");

        ResumeResponse responseA = resumeService.upload(userA, file, "v1");

        // User B tries to fetch User A's resume by ID
        assertThatThrownBy(() -> resumeService.getById(userB, responseA.id()))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Resume not found");
    }

    private byte[] createMinimalPdf() { return "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n5 0 obj\n<< /Length 96 >>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(This is a substantial PDF document for testing Tika parsing capabilities.) Tj\nET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000224 00000 n \n0000000312 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n405\n%%EOF".getBytes(); }

    private byte[] createMinimalDocx(String text) throws IOException {
        try (XWPFDocument document = new XWPFDocument()) {
            XWPFParagraph paragraph = document.createParagraph();
            XWPFRun run = paragraph.createRun();
            run.setText(text);
            try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                document.write(out);
                return out.toByteArray();
            }
        }
    }
}