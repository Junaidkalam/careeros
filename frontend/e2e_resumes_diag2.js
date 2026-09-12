import { chromium } from 'playwright';
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  await page.goto('http://localhost:5173/login');
  
  await page.fill('input[type="email"]', `test@example.com`); // assuming we have a test user, but let's just register
  await page.goto('http://localhost:5173/register');
  const em = `u_${Date.now()}@a.com`;
  await page.fill('input[type="text"]', 'Test');
  await page.fill('input[type="email"]', em);
  await page.fill('input[type="password"]', 'pass');
  await Promise.all([
    page.waitForResponse(resp => resp.url().includes('/api/auth/register')),
    page.click('button[type="submit"]')
  ]).then(resps => {
    const r = resps[0];
    console.log("Register response:", r.status());
  }).catch(e => console.log("Register failed:", e.message));

  await page.waitForURL('**/dashboard');
  
  await page.goto('http://localhost:5173/resumes');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  const content = await page.content();
  console.log("RESUMES PAGE:", content.substring(0, 1000));
  await page.screenshot({ path: 'screenshots/diag_resumes.png' });
  await browser.close();
})();