import re

with open('src/main/java/com/careeros/service/ResumeService.java', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = """
        String raw = aiClient.callForJson(prompt);
        String json = stripFences(raw);
        org.slf4j.LoggerFactory.getLogger(ResumeService.class).error("====== RAW JSON FROM LLM ======\\n" + json + "\\n===============================");
"""
content = re.sub(r'String raw = aiClient\.callForJson\(prompt\);\s*String json = stripFences\(raw\);', replacement.strip(), content)

with open('src/main/java/com/careeros/service/ResumeService.java', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated ResumeService.java logging")