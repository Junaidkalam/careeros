import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import java.util.stream.Stream;
import java.io.IOException;

public class FixAllMojibake {
    public static void main(String[] args) throws Exception {
        Path start = Paths.get("src/main/java");
        try (Stream<Path> stream = Files.walk(start)) {
            stream.filter(Files::isRegularFile)
                  .filter(p -> p.toString().endsWith(".java"))
                  .forEach(p -> {
                      try {
                          String content = Files.readString(p, StandardCharsets.UTF_8);
                          if (content.matches("(?s).*[\\x80-\\xFF].*")) {
                              String newContent = content.replaceAll("[\\x80-\\xFF]+", "-");
                              Files.writeString(p, newContent, StandardCharsets.UTF_8);
                              System.out.println("Fixed: " + p);
                          }
                      } catch (IOException e) {
                          e.printStackTrace();
                      }
                  });
        }
    }
}