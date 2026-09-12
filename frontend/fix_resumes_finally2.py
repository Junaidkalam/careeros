import re

with open('src/pages/Resumes.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'setVersionLabel\(''\);\s*fetchList\(\);\s*\}\s*catch', "setVersionLabel('');\n      } catch", content)
content = re.sub(r'finally\s*\{\s*setIsUploading\(false\);\s*\}', "finally {\n        setIsUploading(false);\n        fetchList();\n      }", content)

with open('src/pages/Resumes.tsx', 'w', encoding='utf-8') as f:
    f.write(content)