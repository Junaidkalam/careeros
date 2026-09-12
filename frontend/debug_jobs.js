import fs from 'fs';

async function check() {
  const BACKEND_URL = 'http://localhost:8080/api';
  // Register a new user
  const email = `jobs_${Date.now()}@example.com`;
  let res = await fetch(`${BACKEND_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Jobs User', email, password: 'password123' })
  });
  const auth = await res.json();
  const token = auth.token;
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  // 1. Create a job with url
  const testUrl = "https://boards.greenhouse.io/spacex/jobs/7473723002";
  res = await fetch(`${BACKEND_URL}/jobs`, {
    method: 'POST', headers,
    body: JSON.stringify({ title: 'Test 1', companyName: 'C1', postingUrl: testUrl })
  });
  console.log("Job 1 save status:", res.status);
  
  // 2. Try to create duplicate
  res = await fetch(`${BACKEND_URL}/jobs`, {
    method: 'POST', headers,
    body: JSON.stringify({ title: 'Test 2', companyName: 'C2', postingUrl: testUrl })
  });
  console.log("Job 2 duplicate status:", res.status);
  const text = await res.text();
  console.log("Response:", text);
}
check();