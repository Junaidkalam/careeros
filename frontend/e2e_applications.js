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

  const em = `apps_${Date.now()}@x.com`;
  const pw = 'password123';

  // ─── 1. Seed via API ───────────────────────────────────────────
  console.log('Seeding...');
  const authData = await api('/auth/register', {
    method: 'POST', body: JSON.stringify({ name: 'App Tester', email: em, password: pw })
  });
  const token = authData.token;

  const job = await api('/jobs', { method: 'POST', body: JSON.stringify({
    title: 'Senior Backend Engineer', companyName: 'Acme Corp',
    description: 'Java Spring Boot AWS Kubernetes Docker PostgreSQL.',
    requiredSkills: ['Java', 'Spring Boot', 'AWS', 'Kubernetes'],
    preferredSkills: ['Docker', 'PostgreSQL'],
  })}, token);
  console.log('  Job:', job.title, job.id);

  const fd = new FormData();
  fd.append('file', new Blob([readFileSync('test_resume.pdf')], { type: 'application/pdf' }), 'resume.pdf');
  fd.append('versionLabel', 'V1 Test');
  const rr = await fetch(`${BASE}/resumes`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd });
  const resume = await rr.json();
  console.log('  Resume:', resume.id, 'profileGenerated:', resume.profileGenerated);

  // ─── 2. Log in via UI ─────────────────────────────────────────
  await page.goto(`${APP}/login`);
  await page.fill('input[type="email"]', em);
  await page.fill('input[type="password"]', pw);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  console.log('Logged in');

  // ─── 3. Empty Applications board ──────────────────────────────
  await page.goto(`${APP}/applications`);
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('text=Apply to a Job');
  await page.screenshot({ path: 'screenshots/app_01_empty.png' });
  console.log('Screenshot: app_01_empty.png');

  // ─── 4. Open dialog, pick job + resume ────────────────────────
  await page.click('text=Apply to a Job');
  await page.waitForSelector('[role="dialog"]');
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'screenshots/app_02_dialog.png' });

  // Job dropdown
  await page.locator('[role="combobox"]').nth(0).click();
  await page.waitForSelector('[role="option"]');
  await page.locator('[role="option"]').first().click();
  await page.waitForTimeout(200);

  // Resume dropdown
  await page.locator('[role="combobox"]').nth(1).click();
  await page.waitForSelector('[role="option"]');
  await page.locator('[role="option"]').first().click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'screenshots/app_03_filled.png' });

  // ─── 5. Submit and wait for match result ──────────────────────
  console.log('Submitting...');
  await page.click('button[type="submit"]');
  await Promise.race([
    page.waitForSelector('text=Match Score', { timeout: 30000 }),
    page.waitForSelector('text=Matching could not run', { timeout: 30000 }),
  ]).catch(() => console.log('  (no match panel text)'));
  await page.waitForTimeout(500);

  const dlgText = await page.locator('[role="dialog"]').textContent().catch(() => '');
  console.log('Match dialog:', dlgText.substring(0, 600));
  await page.screenshot({ path: 'screenshots/app_04_match_result.png' });
  console.log('Screenshot: app_04_match_result.png');

  // ─── 6. Close dialog ──────────────────────────────────────────
  const doneBtn = page.locator('[role="dialog"] button').filter({ hasText: /^Done$/ });
  if (await doneBtn.count() > 0) await doneBtn.click();
  await page.waitForSelector('[role="dialog"]', { state: 'hidden' }).catch(() => {});
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'screenshots/app_05_board.png' });
  // Card is a button anywhere on page that contains job title text
  const cardCount = await page.locator('button:has-text("Senior Backend Engineer")').count();
  console.log('Screenshot: app_05_board.png | Cards on board:', cardCount);

  // ─── 7. Open detail ───────────────────────────────────────────
  if (cardCount > 0) {
    await page.locator('button:has-text("Senior Backend Engineer")').first().click();
    await page.waitForURL('**/applications/*');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/app_06_detail.png' });
    console.log('Screenshot: app_06_detail.png');

    const tl1 = await page.locator('.flex.gap-4').allTextContents();
    console.log('Initial timeline:', JSON.stringify(tl1));

    // ─── 8. Change status ─────────────────────────────────────
    await page.locator('[role="combobox"]').first().click();
    await page.waitForSelector('[role="option"]');
    await page.locator('[role="option"]').filter({ hasText: 'Interview' }).first().click();
    await page.waitForTimeout(200);
    await page.click('button:has-text("Update Status")');
    await page.waitForTimeout(2500);
    await page.screenshot({ path: 'screenshots/app_07_status_changed.png' });
    console.log('Screenshot: app_07_status_changed.png');

    const tl2 = await page.locator('.flex.gap-4').allTextContents();
    console.log('Timeline after status change:', JSON.stringify(tl2));
    console.log('New events:', tl2.length - tl1.length);
    console.log(tl2.length > tl1.length ? 'SUCCESS: Timeline grew!' : 'NOTE: Same event count');
  }

  console.log('ALL STEPS COMPLETE.');
  await browser.close();
})();