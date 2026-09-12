import re

with open('src/main/java/com/careeros/service/ResumeService.java', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix upload catch block
content = re.sub(
    r'return toResponse\(resume, null, List\.of\(\),\s*"AI profile generation failed: " \+ e\.getMessage\(\)\);',
    'String warnMsg = "AI profile generation failed: " + e.getMessage();\n            resume.setWarning(warnMsg);\n            resumeRepository.save(resume);\n            return toResponse(resume, null, List.of(), warnMsg);',
    content
)

# Fix toResponse
content = re.sub(
    r'return new ResumeResponse\(\s*resume\.getId\(\),\s*resume\.getFilename\(\),\s*resume\.getVersionLabel\(\),\s*resume\.getCreatedAt\(\),\s*profile != null,\s*warning,',
    'return new ResumeResponse(\n                resume.getId(),\n                resume.getFilename(),\n                resume.getVersionLabel(),\n                resume.getCreatedAt(),\n                profile != null,\n                warning != null ? warning : resume.getWarning(),',
    content
)

with open('src/main/java/com/careeros/service/ResumeService.java', 'w', encoding='utf-8') as f:
    f.write(content)