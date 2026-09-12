import re

with open('src/pages/Resumes.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("try {\n      setIsUploadOpen(false);", "try {\n      await uploadResume(file, versionLabel || undefined);\n      setIsUploadOpen(false);")

with open('src/pages/Resumes.tsx', 'w', encoding='utf-8') as f:
    f.write(content)