import re

with open('src/main/java/com/careeros/service/ResumeService.java', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('"summary": "2-3 sentence professional summary or null",', '"summary": "string (2-3 sentence professional summary) or null",')
content = content.replace('"primaryRole": "job title/role or null",', '"primaryRole": "string (job title/role) or null",')

with open('src/main/java/com/careeros/service/ResumeService.java', 'w', encoding='utf-8') as f:
    f.write(content)