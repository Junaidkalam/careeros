with open('src/main/java/com/careeros/service/ResumeService.java', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('org.slf4j.LoggerFactory.getLogger(ResumeService.class).error("====== RAW JSON FROM LLM ======\n" + json + "\n===============================");', 'org.slf4j.LoggerFactory.getLogger(ResumeService.class).error("====== RAW JSON FROM LLM ======\\n" + json + "\\n===============================");')

with open('src/main/java/com/careeros/service/ResumeService.java', 'w', encoding='utf-8') as f:
    f.write(content)