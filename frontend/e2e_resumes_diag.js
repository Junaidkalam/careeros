import { chromium } from 'playwright';
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto('http://localhost:5173/register');
  await page.fill('input[type="text"]', 'Test');
  await page.fill('input[type="email"]', `test_${Date.now()}@a.com`);
  await page.fill('input[type="password"]', 'pass');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  
  await page.goto('http://localhost:5173/resumes');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  const content = await page.content();
  console.log(content.substring(0, 1000));
  await page.screenshot({ path: 'screenshots/diag_resumes.png' });
  await browser.close();
})();