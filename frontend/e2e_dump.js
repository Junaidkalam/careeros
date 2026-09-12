import { chromium } from 'playwright';
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  
  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"]', 'dump@test.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  await page.goto('http://localhost:5173/applications');
  await page.waitForTimeout(3000);
  
  const body = await page.evaluate(() => document.body.innerHTML);
  console.log('HTML:', body.substring(0, 1000));
  await browser.close();
})();