import { chromium } from 'playwright';
import { readFileSync } from 'fs';

const BASE = 'http://localhost:8080/api';

async function api(path, opts = {}, token = null) {
  const r = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...opts.headers,
    }
  });
  return r.json();
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const em = `board_${Date.now()}@x.com`;
  const authData = await api('/auth/register', {
    method: 'POST', body: JSON.stringify({ name: 'T', email: em, password: 'password123' })
  });
  const token = authData.token;
  
  const job = await api('/jobs', { method: 'POST', body: JSON.stringify({
    title: 'SWE', companyName: 'Co', description: 'Java', requiredSkills: ['Java']
  })}, token);
  
  const fd = new FormData();
  fd.append('file', new Blob([readFileSync('test_resume.pdf')], { type: 'application/pdf' }), 'r.pdf');
  fd.append('versionLabel', 'v1');
  const rr = await fetch(`${BASE}/resumes`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd });
  const resume = await rr.json();
  
  // Create application via API
  const app = await api('/applications', {
    method: 'POST', body: JSON.stringify({ jobId: job.id, resumeId: resume.id })
  }, token);
  console.log('Application:', app.id, 'status:', app.status, 'matchScore:', app.matchScore);
  
  // Login via UI
  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"]', em);
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  
  await page.goto('http://localhost:5173/applications');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  const body = await page.evaluate(() => document.querySelector('#root').innerHTML);
  console.log('HTML:', body.substring(0, 1000));
  
  // Check all buttons
  const btns = await page.locator('button').allTextContents();
  console.log('Buttons:', btns);
  
  await browser.close();
})();