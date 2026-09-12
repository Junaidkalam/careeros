import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const FRONTEND_URL = 'http://localhost:5173';
  const email = `jobs_${Date.now()}@example.com`;

  try {
    await page.goto(`${FRONTEND_URL}/register`);
    await page.fill('input[type="text"]', 'Jobs User');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    await page.click('text="Jobs"');
    await page.waitForURL('**/jobs');
    await page.waitForSelector('text="No jobs saved"');

    const testUrl = "https://boards.greenhouse.io/spacex/jobs/7473723002";
    
    // Case 1
    await page.click('button:has-text("Add Job")');
    await page.waitForSelector('text="Import from URL (Optional)"');
    await page.fill('label:has-text("Job Title *") + input', 'SpaceX Engineer (Fallback)');
    await page.fill('label:has-text("Company Name *") + input', 'SpaceX');
    await page.fill('label:has-text("URL") + input', testUrl);
    await page.evaluate(() => {
       Array.from(document.querySelectorAll('button')).find(el => el.textContent === 'Save Job').click();
    });
    await page.waitForSelector('text="Add New Job"', { state: 'hidden' });
    await page.waitForTimeout(1000);

    // Case 3
    await page.click('button:has-text("Add Job")');
    await page.waitForSelector('text="Import from URL (Optional)"');
    await page.fill('label:has-text("Job Title *") + input', 'Duplicate Job');
    await page.fill('label:has-text("Company Name *") + input', 'Duplicate Inc');
    await page.fill('label:has-text("URL") + input', testUrl);
    
    await page.evaluate(() => {
       Array.from(document.querySelectorAll('button')).find(el => el.textContent === 'Save Job').click();
    });
    
    await page.waitForTimeout(2000); // wait for 409
    
    const pageText = await page.textContent('.bg-red-50');
    console.log("Error text:", pageText);

  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await browser.close();
  }
})();