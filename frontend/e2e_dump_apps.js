import { chromium } from 'playwright';
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.on('console', m => console.log('CONSOLE:', m.type(), m.text().substring(0,200)));
  page.on('pageerror', e => console.log('ERROR:', e.message));
  
  await page.goto('http://localhost:5173/register');
  await page.fill('input[type="text"]', 'T');
  await page.fill('input[type="email"]', `d${Date.now()}@t.com`);
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  console.log('On dashboard');
  
  await page.goto('http://localhost:5173/applications');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  const root = await page.evaluate(() => document.querySelector('#root').innerHTML);
  console.log('ROOT HTML:', root.substring(0, 800));
  await browser.close();
})();