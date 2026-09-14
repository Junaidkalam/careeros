const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  // Login
  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"]', 'nade.system.out@gmail.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 10000 });

  // Navigate to Applications board
  await page.click('a[href="/applications"]');
  await page.waitForURL('**/applications', { timeout: 10000 });
  await page.waitForTimeout(1500);

  // Click DevOps Engineer card
  const cards = page.locator('[class*="cursor-pointer"]');
  const count = await cards.count();
  console.log('Card count:', count);

  // Try to find and click DevOps card
  const devopsCard = page.locator('text=DevOps Engineer').first();
  await devopsCard.click();
  await page.waitForURL('**/applications/*', { timeout: 10000 });
  await page.waitForTimeout(2000);

  await page.screenshot({ path: 'devops-detail.png', fullPage: true });
  console.log('Screenshot taken');

  await browser.close();
})().catch(err => { console.error(err); process.exit(1); });