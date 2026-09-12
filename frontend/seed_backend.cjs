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
  
  if (!res.ok) throw new Error("Failed to register");
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
  if (!res.ok) throw new Error("Failed to create job: " + await res.text());
  const job = await res.json();
  const jobId = job.id;

  console.log("Uploading Dummy Resume...");
  // Create a dummy multipart form manually since FormData is not fully present in raw Node without a polyfill easily
  // Actually Node 18+ has FormData!
  const formData = new FormData();
  // Create a dummy blob
  formData.append('file', new Blob(['test pdf content'], { type: 'application/pdf' }), 'test.pdf');
  formData.append('versionLabel', 'V1');

  res = await fetch(`${BACKEND_URL}/resumes`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  if (!res.ok) throw new Error("Failed to upload resume: " + await res.text());
  const resume = await res.json();
  const resumeId = resume.id;

  console.log("Creating Applications...");
  for (let i = 0; i < 5; i++) {
    res = await fetch(`${BACKEND_URL}/applications`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ jobId, resumeId, notes: `App ${i}` })
    });
    if (!res.ok) throw new Error("Failed to create app: " + await res.text());
    const app = await res.json();
    
    // Status updates
    if (i === 0) {
      // Update to INTERVIEW
      await fetch(`${BACKEND_URL}/applications/${app.id}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: 'INTERVIEW', notes: 'Scheduled' })
      });
    } else if (i === 1) {
      // Update to OFFER
      await fetch(`${BACKEND_URL}/applications/${app.id}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: 'OFFER', notes: 'Got it!' })
      });
    } else if (i === 2) {
      // Update to REJECTED
      await fetch(`${BACKEND_URL}/applications/${app.id}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: 'REJECTED', notes: 'Rejected' })
      });
    }
  }

  console.log("Fetching Stats to verify seeding...");
  res = await fetch(`${BACKEND_URL}/analytics/dashboard`, { headers });
  const stats = await res.json();
  console.log("Dashboard Stats:", stats);
  
  // write credentials out so the E2E script can use them
  fs.writeFileSync('test_credentials.json', JSON.stringify({ email, password: 'password123', name: 'Seed User' }));
}

seed().catch(console.error);