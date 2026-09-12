import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto('http://localhost:5174/dashboard');
  await page.waitForTimeout(2000);
  console.log('URL:', page.url());
  const content = await page.content();
  console.log('Content snippet:', content.substring(0, 500));
  await browser.close();
})();