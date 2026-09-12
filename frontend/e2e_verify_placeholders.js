import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const FRONTEND_URL = 'http://localhost:5173';

  try {
    // Navigate to Jobs directly. We need auth so let's register again.
    await page.goto(`${FRONTEND_URL}/register`);
    await page.fill('input[type="text"]', 'Test User');
    await page.fill('input[type="email"]', `test_${Date.now()}@example.com`);
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Go to Jobs
    await page.click('a[href="/jobs"]');
    await page.waitForURL('**/jobs');
    await page.waitForTimeout(1000);
    
    // Click Add Job
    await page.click('text="Add Job"');
    await page.waitForSelector('input[placeholder="Remote, Hybrid..."]');
    
    const workModePh = await page.getAttribute('input[placeholder^="Remote"]', 'placeholder');
    const empTypePh = await page.getAttribute('input[placeholder^="FULL_TIME"]', 'placeholder');
    const salaryPh = await page.getAttribute('input[placeholder^="$100k"]', 'placeholder');
    const urlPh = await page.getAttribute('input[placeholder^="https://boards"]', 'placeholder');
    
    console.log("Work Mode Placeholder:", workModePh);
    console.log("Employment Type Placeholder:", empTypePh);
    console.log("Salary Range Placeholder:", salaryPh);
    console.log("URL Placeholder:", urlPh);
    
    if (workModePh.includes('Ã') || salaryPh.includes('Ã')) {
      console.error("Mojibake still present!");
    } else {
      console.log("Placeholders are clean.");
    }
  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await browser.close();
  }
})();