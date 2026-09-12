import { chromium } from 'playwright';
import assert from 'assert';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const FRONTEND_URL = 'http://localhost:5174';
  const email = `empty_${Date.now()}@example.com`;

  console.log("--- Starting Empty Dashboard Verification ---");

  try {
    // Register directly from frontend
    console.log("\n[Step 1] Registering empty user...");
    await page.goto(`${FRONTEND_URL}/register`);
    await page.fill('input[type="text"]', 'Empty User');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // 2. Read Stats from Dashboard
    console.log("\n[Step 2] Reading stats from the empty dashboard UI...");
    await page.waitForSelector('text="Total Applications"'); // Wait for loading to finish
    
    const pageText = await page.textContent('main');
    console.log("Main content text:", pageText);

    assert(pageText.includes('Total Applications0'), "Total Applications should be 0");
    assert(pageText.includes('Active Applications0'), "Active Applications should be 0");
    assert(pageText.includes('Interview Rate—'), "Interview Rate should be '—'");
    assert(pageText.includes('Offer Rate—'), "Offer Rate should be '—'");

    console.log("✓ Empty stats rendered correctly in the UI!");

  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await browser.close();
  }
})();