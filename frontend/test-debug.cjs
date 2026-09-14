const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  console.log("Navigating to login...");
  await page.goto('http://localhost:5173/login');
  await page.waitForLoadState('networkidle');

  console.log("Logging in as nade.system.out@gmail.com with password123...");
  await page.fill('input[type="email"]', 'nade.system.out@gmail.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');

  await page.waitForURL('http://localhost:5173/dashboard', { timeout: 10000 });
  console.log("Successfully logged in!");

  console.log("Navigating to /jobs");
  await page.goto('http://localhost:5173/jobs');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  console.log("URL is:", page.url());
  const html = await page.evaluate(() => document.body.innerHTML);
  console.log("HTML length:", html.length);
  require('fs').writeFileSync('page.html', html);

  await browser.close();
})();