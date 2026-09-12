import urllib.request
import json
import urllib.error
import time
import uuid

email = "newtest" + str(int(time.time())) + "@gmail.com"
data = json.dumps({"name": "New Test", "email": email, "password": "password"}).encode('utf-8')
req = urllib.request.Request("http://localhost:8080/api/auth/register", data=data, headers={"Content-Type": "application/json"})
with urllib.request.urlopen(req) as f:
    res = json.loads(f.read().decode('utf-8'))
    token = res["token"]

boundary = "----WebKitFormBoundary" + str(uuid.uuid4().hex)
pdf_content = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n5 0 obj\n<< /Length 96 >>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(This is a substantial PDF document for testing Tika parsing capabilities.) Tj\nET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000224 00000 n \n0000000312 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n405\n%%EOF"

body = (
    "--" + boundary + "\r\n" +
    'Content-Disposition: form-data; name="file"; filename="test.pdf"\r\n' +
    "Content-Type: application/pdf\r\n\r\n"
).encode('utf-8') + pdf_content + ("\r\n--" + boundary + "--\r\n").encode('utf-8')

req2 = urllib.request.Request("http://localhost:8080/api/resumes", data=body, headers={
    "Authorization": "Bearer " + token,
    "Content-Type": "multipart/form-data; boundary=" + boundary
})

try:
    with urllib.request.urlopen(req2) as f2:
        print("Status:", f2.status)
        print("Body:", f2.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("HTTPError:", e.code, e.reason)
    print("Body:", e.read().decode('utf-8'))
except Exception as e:
    print("Exception:", e)