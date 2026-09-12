import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.charset.StandardCharsets;

public class FixMojibake {
    public static void main(String[] args) throws Exception {
        String content = Files.readString(Paths.get("src/main/java/com/careeros/service/ResumeService.java"), StandardCharsets.UTF_8);
        content = content.replaceAll("[^\\x00-\\x7F]+", "-");
        // Also fix the long lines of hyphens
        content = content.replaceAll("[-]{5,}", "------------------------------------------------");
        Files.writeString(Paths.get("src/main/java/com/careeros/service/ResumeService.java"), content, StandardCharsets.UTF_8);
    }
}