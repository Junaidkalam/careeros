import { chromium } from 'playwright';
import assert from 'assert';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const FRONTEND_URL = 'http://localhost:5174';
  const creds = JSON.parse(fs.readFileSync('test_credentials.json', 'utf8'));

  console.log("--- Starting Dashboard Verification ---");

  try {
    // 1. Log in
    console.log("\n[Step 1] Logging in...");
    await page.goto(`${FRONTEND_URL}/login`);
    await page.fill('input[type="email"]', creds.email);
    await page.fill('input[type="password"]', creds.password);
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log("URL is now:", page.url());

    // 2. Read Stats from Dashboard
    console.log("\n[Step 2] Reading stats from the dashboard UI...");
    await page.waitForSelector('text="Total Applications"'); // Wait for loading to finish
    
    const pageText = await page.textContent('main');
    console.log("Main content text:", pageText);

    // Look for the specific numbers we know are there
    assert(pageText.includes('Total Applications5'), "Total Applications should be 5");
    assert(pageText.includes('Active Applications3'), "Active Applications should be 3");
    assert(pageText.includes('Interviews2'), "Interviews should be 2");
    assert(pageText.includes('Offers1'), "Offers should be 1");
    assert(pageText.includes('Rejected1'), "Rejected should be 1");
    assert(pageText.includes('Interview Rate40.0%'), "Interview Rate should be 40.0%");
    assert(pageText.includes('Offer Rate20.0%'), "Offer Rate should be 20.0%");
    assert(pageText.includes('Apps this week5'), "Apps this week should be 5");
    assert(pageText.includes('Apps this month5'), "Apps this month should be 5");

    console.log("✓ All stats rendered correctly in the UI!");

  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await browser.close();
  }
})();