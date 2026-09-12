import json

with open(r"C:\Users\junai\.gemini\antigravity\brain\b4665f4f-4b18-4225-b5ee-74351e35bc40\.system_generated\tasks\task-2378.log", "r", encoding="utf-8") as f:
    lines = f.readlines()

in_json = False
json_str = ""
for line in lines:
    if "====== RAW JSON FROM LLM ======" in line:
        in_json = True
        continue
    if in_json and "====== RAW JSON TEST ======" in line:
        break
    if in_json:
        json_str += line

try:
    data = json.loads(json_str)
    print("Parts:", data.get("candidates", [{}])[0].get("content", {}).get("parts", []))
except Exception as e:
    print("Error:", e)