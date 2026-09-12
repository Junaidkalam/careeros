const fs = require('fs');

async function seed() {
  const BACKEND_URL = 'http://localhost:8080/api';
  const email = `seed_${Date.now()}@example.com`;
  
  console.log("Registering user:", email);
  let res = await fetch(`${BACKEND_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Seed User', email, password: 'password123' })
  });
  const auth = await res.json();
  const token = auth.token;
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  console.log("Creating Job...");
  res = await fetch(`${BACKEND_URL}/jobs`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: 'Software Engineer',
      companyName: 'Acme Corp',
      url: 'https://example.com/job',
      description: 'Test job',
      skills: ['Java', 'Spring', 'React']
    })
  });
  const job = await res.json();
  const jobId = job.id;

  // Let's create a minimal valid PDF
  const pdfBytes = Buffer.from(
    "%PDF-1.0\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000053 00000 n\n0000000102 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n149\n%EOF\n"
  );
  
  const formData = new FormData();
  formData.append('file', new Blob([pdfBytes], { type: 'application/pdf' }), 'test.pdf');
  formData.append('versionLabel', 'V1');

  console.log("Uploading Dummy Resume...");
  res = await fetch(`${BACKEND_URL}/resumes`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  
  if (!res.ok) {
     console.error(await res.text());
     return;
  }
  const resume = await res.json();
  const resumeId = resume.id;

  console.log("Creating Applications...");
  for (let i = 0; i < 5; i++) {
    res = await fetch(`${BACKEND_URL}/applications`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ jobId, resumeId, notes: `App ${i}` })
    });
    const app = await res.json();
    
    if (i === 0) {
      await fetch(`${BACKEND_URL}/applications/${app.id}/status`, {
        method: 'PUT', headers, body: JSON.stringify({ status: 'INTERVIEW', notes: 'Scheduled' })
      });
    } else if (i === 1) {
      await fetch(`${BACKEND_URL}/applications/${app.id}/status`, {
        method: 'PUT', headers, body: JSON.stringify({ status: 'OFFER', notes: 'Got it!' })
      });
    } else if (i === 2) {
      await fetch(`${BACKEND_URL}/applications/${app.id}/status`, {
        method: 'PUT', headers, body: JSON.stringify({ status: 'REJECTED', notes: 'Rejected' })
      });
    }
  }

  console.log("Fetching Stats...");
  res = await fetch(`${BACKEND_URL}/analytics/dashboard`, { headers });
  const stats = await res.json();
  console.log("Dashboard Stats:", stats);
  
  fs.writeFileSync('test_credentials.json', JSON.stringify({ email, password: 'password123', name: 'Seed User' }));
}

seed().catch(console.error);