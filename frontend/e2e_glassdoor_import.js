import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();

  const FRONTEND_URL = 'http://localhost:5173';

  console.log("Navigating and logging in...");
  try {
    // 1. Go to register to get a fresh session
    await page.goto(`${FRONTEND_URL}/register`);
    await page.fill('input[type="text"]', 'Test User');
    await page.fill('input[type="email"]', `test_${Date.now()}@example.com`);
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // 2. Go to Jobs
    console.log("Navigating to jobs...");
    await page.click('a[href="/jobs"]');
    await page.waitForURL('**/jobs');
    
    // Wait a sec for jobs to load
    await page.waitForTimeout(1000);
    
    // 3. Click Add Job
    console.log("Opening Add Job modal...");
    await page.click('text="Add Job"');
    
    // 4. Fill Import URL
    console.log("Filling Glassdoor URL...");
    await page.fill('input[type="url"]', 'https://www.glassdoor.co.in/job-listing/social-media-executive-mind-and-matter-JV_KO0,24_KE25,40.htm?jl=1010251676309');
    
    // 5. Click Import
    console.log("Clicking Import...");
    await page.click('button:has-text("Import")');
    
    // Wait for the warning to appear (orange banner)
    console.log("Waiting for warning...");
    await page.waitForSelector('text=Glassdoor blocked automated extraction', { timeout: 15000 });
    
    // 6. Take screenshot
    const shotPath = 'C:\\Users\\junai\\.gemini\\antigravity\\brain\\b4665f4f-4b18-4225-b5ee-74351e35bc40\\glassdoor_import_warning.png';
    await page.screenshot({ path: shotPath, fullPage: true });
    console.log(`Saved screenshot to ${shotPath}`);

  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await browser.close();
  }
})();