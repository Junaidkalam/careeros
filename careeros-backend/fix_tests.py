import re

with open('src/test/java/com/careeros/ResumeIntegrationTest.java', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('createMinimalDocx("Hello DOCX Document")', 'createMinimalDocx("This is a much more substantial DOCX document. It has a real paragraph of text to verify that Tika is parsing the file correctly.")')

content = content.replace('(Dummy PDF Content)', '(This is a substantial PDF document for testing Tika parsing capabilities.)')

content = content.replace('<< /Length 44 >>', '<< /Length 96 >>')

with open('src/test/java/com/careeros/ResumeIntegrationTest.java', 'w', encoding='utf-8') as f:
    f.write(content)