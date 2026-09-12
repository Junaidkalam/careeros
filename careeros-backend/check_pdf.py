import pypdf

pdf_path = r"C:\Users\junai\.gemini\antigravity\brain\b4665f4f-4b18-4225-b5ee-74351e35bc40\.user_uploaded\media_1788869357003.pdf"
text = ""
with open(pdf_path, 'rb') as f:
    reader = pypdf.PdfReader(f)
    for page in reader.pages:
        text += page.extract_text() + "\n"

print("Does 16844 exist in text?", "16844" in text)
lines = text.split("\n")
for i, line in enumerate(lines):
    if "16844" in line:
        print(f"Line {i}: {line}")