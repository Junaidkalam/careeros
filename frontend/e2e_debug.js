import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  
  await page.goto('http://localhost:5173/register');
  await page.waitForLoadState('networkidle');
  
  const content = await page.content();
  console.log("HTML:", content.substring(0, 1000));
  
  await page.screenshot({ path: 'screenshots/debug_register.png' });
  await browser.close();
})();