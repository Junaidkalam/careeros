import urllib.request
import json
import urllib.error

url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + "dummy"
data = json.dumps({
    "contents": [{"parts": [{"text": "Hello"}]}]
}).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
try:
    with urllib.request.urlopen(req) as f:
        print("Status:", f.status)
        print("Body:", f.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("HTTPError:", e.code, e.reason)
    print("Body:", e.read().decode('utf-8'))