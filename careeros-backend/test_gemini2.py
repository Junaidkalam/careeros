import os
import pypdf
from google import genai

pdf_path = r"C:\Users\junai\.gemini\antigravity\brain\b4665f4f-4b18-4225-b5ee-74351e35bc40\.user_uploaded\media_1788869357003.pdf"
text = ""
with open(pdf_path, 'rb') as f:
    reader = pypdf.PdfReader(f)
    for page in reader.pages:
        text += page.extract_text() + "\n"

prompt = """
You are a resume parser. Extract structured information from the resume text below.
Return ONLY a valid JSON object matching this exact schema. Use null for fields you cannot determine. Do NOT invent or guess values.

Schema:
{
  "summary": "2-3 sentence professional summary or null",
  "experienceYears": number or null,
  "primaryRole": "job title/role or null",
  "education": "highest qualification, institution, year range or null",
  "skills": [
    {
      "skillName": "string",
      "category": "one of: PROGRAMMING_LANGUAGE, FRAMEWORK, LIBRARY, DATABASE, CLOUD, DEVOPS, TESTING, TOOL, CONCEPT, SOFT_SKILL, DOMAIN_SPECIFIC"
    }
  ]
}

Rules:
- category MUST be exactly one of the listed values — no others are valid.
- Return ONLY the JSON object. No markdown. No code fences. No explanation.
- Never invent skills or experience not supported by the resume text.

Resume text:
""" + text

api_key = os.environ.get("AI_PROVIDER_API_KEY")
client = genai.Client(api_key=api_key)

try:
    response = client.models.generate_content(
        model='gemini-1.5-flash',
        contents=prompt,
    )
    print(response.text)
except Exception as e:
    print(e)