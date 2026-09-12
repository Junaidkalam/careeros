import { chromium } from 'playwright';
import assert from 'assert';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const FRONTEND_URL = 'http://localhost:5173';
  const email = `jobs_${Date.now()}@example.com`;

  console.log("--- Starting Jobs Verification ---");

  try {
    console.log("\n[Step 0] Registering user...");
    await page.goto(`${FRONTEND_URL}/register`);
    await page.fill('input[type="text"]', 'Jobs User');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    console.log("\n[Step 1] Go to Jobs page & check empty state");
    await page.click('text="Jobs"');
    await page.waitForURL('**/jobs');
    await page.waitForSelector('text="No jobs saved"');

    console.log("\n[Step 2] Case 1: Import a job without JSON-LD (Fallback testing)");
    await page.click('button:has-text("Add Job")');
    await page.waitForSelector('text="Import from URL (Optional)"');
    
    // Using Anthropic URL that returns 200 but fails AI fallback
    const fallbackUrl = "https://job-boards.greenhouse.io/anthropic/jobs/5183044008";
    await page.fill('input[type="url"]', fallbackUrl); 
    await page.click('button:has-text("Import")');
    
    await page.waitForSelector('.text-orange-600', { state: 'visible' });
    const warningText = await page.textContent('.text-orange-600');
    assert(warningText.includes("AI extraction failed: AI provider API key is not configured"), "Warning text mismatch");
    console.log("Warning caught successfully:", warningText);
    
    const titleValueFallback = await page.inputValue('label:has-text("Job Title *") + input');
    if (!titleValueFallback) {
      await page.fill('label:has-text("Job Title *") + input', 'Fallback Engineer');
      await page.fill('label:has-text("Company Name *") + input', 'Fallback Inc');
    }
    
    await page.fill('label:has-text("URL") + input', fallbackUrl);
    
    await page.evaluate(() => {
       Array.from(document.querySelectorAll('button')).find(el => el.textContent === 'Save Job').click();
    });
    
    await page.waitForSelector('text="Add New Job"', { state: 'hidden' });
    await page.waitForTimeout(1000); 

    console.log("\n[Step 3] Case 1.5: Import a real job WITH JSON-LD");
    await page.click('button:has-text("Add Job")');
    await page.waitForSelector('text="Import from URL (Optional)"');
    
    const jsonLdUrl = "http://localhost:3000/job.html";
    await page.fill('input[type="url"]', jsonLdUrl); 
    await page.click('button:has-text("Import")');
    
    await page.waitForTimeout(2000); // Wait for extraction
    
    const titleValue = await page.inputValue('label:has-text("Job Title *") + input');
    const companyValue = await page.inputValue('label:has-text("Company Name *") + input');
    const locationValue = await page.inputValue('label:has-text("Location") + input');
    
    console.log("JSON-LD Populated:", { titleValue, companyValue, locationValue });
    assert(titleValue === "Software Engineer II", "Title mismatch");
    assert(companyValue === "MockCorp", "Company mismatch");
    
    await page.evaluate(() => {
       Array.from(document.querySelectorAll('button')).find(el => el.textContent === 'Save Job').click();
    });
    
    await page.waitForSelector('text="Add New Job"', { state: 'hidden' });
    await page.waitForTimeout(1000);

    console.log("\n[Step 4] Case 2: Manual entry path");
    await page.click('button:has-text("Add Job")');
    await page.waitForSelector('text="Import from URL (Optional)"');
    await page.fill('label:has-text("Job Title *") + input', 'Frontend Developer');
    await page.fill('label:has-text("Company Name *") + input', 'Manual Inc');
    await page.fill('label:has-text("URL") + input', 'https://manual.com/job');
    
    await page.evaluate(() => {
       Array.from(document.querySelectorAll('button')).find(el => el.textContent === 'Save Job').click();
    });
    
    await page.waitForSelector('text="Add New Job"', { state: 'hidden' });
    await page.waitForTimeout(1000);

    console.log("\n[Step 5] Case 3: Duplicate import checking (409)");
    await page.click('button:has-text("Add Job")');
    await page.waitForSelector('text="Import from URL (Optional)"');
    await page.fill('label:has-text("Job Title *") + input', 'Duplicate Job');
    await page.fill('label:has-text("Company Name *") + input', 'Duplicate Inc');
    await page.fill('label:has-text("URL") + input', jsonLdUrl);
    
    await page.evaluate(() => {
       Array.from(document.querySelectorAll('button')).find(el => el.textContent === 'Save Job').click();
    });
    
    await page.waitForSelector('.bg-red-50');
    const errText = await page.textContent('.bg-red-50');
    assert(errText.includes('already exist in your tracker'), "Duplicate warning not found");
    console.log("Duplicate warning caught correctly!");

    console.log("\n✓ All tests passed successfully!");

  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await browser.close();
  }
})();