import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });

  // ── 1. Login page (no auth needed) ──
  const loginPage = await ctx.newPage();
  await loginPage.goto('http://localhost:5173/login');
  await loginPage.waitForLoadState('networkidle');
  await loginPage.screenshot({ path: 'screenshots/1_login.png' });
  console.log('Shot 1: login done');

  // ── Register a user ──
  await loginPage.goto('http://localhost:5173/register');
  await loginPage.waitForLoadState('networkidle');
  const email = `shots_${Date.now()}@example.com`;
  await loginPage.fill('input[type="text"]', 'Jordan Lee');
  await loginPage.fill('input[type="email"]', email);
  await loginPage.fill('input[type="password"]', 'password123');
  await loginPage.click('button[type="submit"]');
  await loginPage.waitForURL('**/dashboard', { timeout: 15000 });
  await loginPage.waitForLoadState('networkidle');

  // ── 2. Dashboard ──
  await loginPage.screenshot({ path: 'screenshots/2_dashboard.png' });
  console.log('Shot 2: dashboard done');

  // ── Navigate to Jobs ──
  await loginPage.goto('http://localhost:5173/jobs');
  await loginPage.waitForLoadState('networkidle');
  await loginPage.waitForTimeout(400);

  // ── 3. Jobs empty state ──
  await loginPage.screenshot({ path: 'screenshots/3_jobs_empty.png' });
  console.log('Shot 3: jobs empty done');

  // Seed 3 jobs via the API to show the table
  const token = await loginPage.evaluate(async (e) => {
    const r = await fetch('http://localhost:8080/api/auth/login', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ email: e, password: 'password123' })
    });
    return (await r.json()).token;
  }, email);

  const h = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
  for (const j of [
    { title: 'Senior Backend Engineer', companyName: 'Stripe', location: 'Remote', workMode: 'REMOTE', postingUrl: `https://stripe.com/j1-${Date.now()}`, source: 'URL Import' },
    { title: 'Staff Engineer', companyName: 'Linear', location: 'San Francisco, CA', workMode: 'HYBRID', postingUrl: `https://linear.app/j2-${Date.now()}`, source: 'URL Import' },
    { title: 'Platform Engineer', companyName: 'Vercel', location: 'New York, NY', workMode: 'REMOTE', postingUrl: `https://vercel.com/j3-${Date.now()}`, source: 'URL Import' },
  ]) {
    await fetch('http://localhost:8080/api/jobs', { method: 'POST', headers: h, body: JSON.stringify(j) });
  }

  // Reload Jobs page to show table
  await loginPage.reload();
  await loginPage.waitForLoadState('networkidle');
  await loginPage.waitForTimeout(400);

  // ── 4. Jobs with table rows ──
  await loginPage.screenshot({ path: 'screenshots/4_jobs_table.png' });
  console.log('Shot 4: jobs table done');

  // ── 5. Jobs modal ──
  await loginPage.evaluate(() => {
    document.querySelectorAll('button').forEach(b => {
      if (b.textContent?.trim().includes('Add Job')) b.click();
    });
  });
  await loginPage.waitForTimeout(600);
  await loginPage.screenshot({ path: 'screenshots/5_jobs_modal.png' });
  console.log('Shot 5: modal done');

  await browser.close();
  console.log('All screenshots complete.');
})();