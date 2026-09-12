with open('src/main/java/com/careeros/ai/AiClient.java', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('throw new AiClientException("Failed to call Gemini API");\n', 'throw new AiClientException("Failed to call Gemini API");\n    }\n')

with open('src/main/java/com/careeros/ai/AiClient.java', 'w', encoding='utf-8') as f:
    f.write(content)