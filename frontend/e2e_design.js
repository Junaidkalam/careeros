import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const FRONTEND = 'http://localhost:5173';
  const email = `design_${Date.now()}@example.com`;

  // Register
  await page.goto(`${FRONTEND}/register`);
  await page.waitForSelector('input[type="text"]');
  await page.screenshot({ path: 'screenshots/register.png' });

  await page.fill('input[type="text"]', 'Design User');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'screenshots/dashboard_empty.png' });

  await page.click('text="Jobs"');
  await page.waitForURL('**/jobs');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshots/jobs_empty.png' });

  await page.evaluate(() => {
    Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Add Job'))?.click();
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'screenshots/jobs_modal.png' });

  await browser.close();
  console.log('Screenshots done.');
})();