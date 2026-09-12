import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

  console.log('Navigating to login...');
  await page.goto('http://localhost:5173/login');
  await page.waitForLoadState('networkidle');

  // Check for vite overlay
  const overlay = await page.$('vite-error-overlay');
  if (overlay) {
    console.log('VITE ERROR OVERLAY DETECTED!');
  }

  // Get computed styles
  const btn = await page.waitForSelector('button[type="submit"]', { timeout: 5000 }).catch(() => null);
  if (btn) {
    const bg = await btn.evaluate(el => window.getComputedStyle(el).backgroundColor);
    const radius = await btn.evaluate(el => window.getComputedStyle(el).borderRadius);
    const text = await btn.evaluate(el => el.textContent);
    console.log(`Button "${text}" styles:`);
    console.log(`  Background: ${bg}`);
    console.log(`  Border-radius: ${radius}`);
  } else {
    console.log('Submit button not found!');
  }

  await page.screenshot({ path: 'screenshots/diag_login.png' });
  await browser.close();
})();