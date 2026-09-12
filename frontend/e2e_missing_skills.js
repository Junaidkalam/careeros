import { chromium } from 'playwright';
import { readFileSync } from 'fs';

const BASE = 'http://localhost:8080/api';
const APP  = 'http://localhost:5173';

async function api(path, opts = {}, token = null) {
  const r = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...opts.headers,
    }
  });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.json();
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  const em = `missing_${Date.now()}@x.com`;
  const pw = 'password123';

  console.log('Seeding data via API...');
  const authData = await api('/auth/register', {
    method: 'POST', body: JSON.stringify({ name: 'Miss Tester', email: em, password: pw })
  });
  const token = authData.token;

  // Create job
  const job = await api('/jobs', { method: 'POST', body: JSON.stringify({
    title: 'Data Engineer', companyName: 'DataCorp',
    description: 'Kafka and Redis expert.',
    requiredSkills: ['Java', 'Kafka'],
    preferredSkills: ['Redis'],
  })}, token);
  
  const fd = new FormData();
  fd.append('file', new Blob([readFileSync('test_resume.pdf')], { type: 'application/pdf' }), 'resume.pdf');
  fd.append('versionLabel', 'Test Res');
  await fetch(`${BASE}/resumes`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd });

  // Log in
  console.log('Logging in...');
  await page.goto(`${APP}/login`);
  await page.fill('input[type="email"]', em);
  await page.fill('input[type="password"]', pw);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');

  // Go to applications using UI click (so we don't trigger full reload and lose in-memory auth)
  console.log('Navigating to applications via sidebar...');
  await page.click('a[href="/applications"]');
  await page.waitForLoadState('networkidle');

  await page.waitForSelector('text=Apply to a Job', { timeout: 5000 });
  await page.click('text=Apply to a Job');
  await page.waitForSelector('[role="dialog"]');
  
  await page.locator('[role="combobox"]').nth(0).click();
  await page.waitForSelector('[role="option"]');
  await page.locator('[role="option"]').first().click();
  await page.waitForTimeout(200);

  await page.locator('[role="combobox"]').nth(1).click();
  await page.waitForSelector('[role="option"]');
  await page.locator('[role="option"]').first().click();
  await page.waitForTimeout(200);
  
  await page.click('button[type="submit"]');
  await Promise.race([
    page.waitForSelector('text=Match Score', { timeout: 30000 }),
    page.waitForSelector('text=Matching could not run', { timeout: 30000 })
  ]).catch(e => console.log('Timeout waiting for match score'));
  await page.waitForTimeout(1000);

  await page.locator('[role="dialog"]').screenshot({ path: 'screenshots/app_08_missing_skills.png' });
  console.log('Screenshot saved: screenshots/app_08_missing_skills.png');

  await browser.close();
})();