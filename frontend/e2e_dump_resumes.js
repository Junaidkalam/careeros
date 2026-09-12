import { chromium } from 'playwright';
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto('http://localhost:5173/login');
  await page.goto('http://localhost:5173/register');
  const em = `u_${Date.now()}@a.com`;
  await page.fill('input[type="text"]', 'Test');
  await page.fill('input[type="email"]', em);
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');

  await page.waitForURL('**/dashboard');
  await page.goto('http://localhost:5173/resumes');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  const content = await page.content();
  console.log("HTML:", content.substring(0, 1500));
  await browser.close();
})();