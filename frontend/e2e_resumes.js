import { chromium } from 'playwright';
import path from 'path';

(async () => {
  console.log("Launching browser...");
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  console.log("Registering test user...");
  await page.goto('http://localhost:5173/register');
  const email = `resume_test_${Date.now()}@example.com`;
  await page.fill('input[type="text"]', 'Resume Tester');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', 'password123'); // MUST BE AT LEAST 6 CHARS
  await page.click('button[type="submit"]');

  await page.waitForURL('**/dashboard', { timeout: 15000 });

  await page.click('a[href="/resumes"]');
  await page.waitForURL('**/resumes');
  await page.waitForLoadState('networkidle');

  await page.click('button[type="button"]:has-text("Upload Resume")');
  await page.waitForSelector('input[type="file"]');

  const filePath = path.resolve('test_resume.pdf');
  await page.setInputFiles('input[type="file"]', filePath);
  await page.fill('input[id="version-label"]', 'V1 Test');
  
  await page.click('button[type="submit"]');
  await page.waitForSelector('text=Uploading & Parsing...', { state: 'hidden', timeout: 30000 });
  await page.waitForSelector('text=Upload Resume', { state: 'visible' });

  const card = page.locator('.grid > .rounded-xl');
  await card.waitFor({ state: 'visible' });
  const cardText = await card.textContent();

  await card.click();
  await page.waitForURL('**/resumes/*');

  await page.waitForSelector('text=Save Profile');
  
  const yearsInput = page.locator('input#years');
  await yearsInput.fill('10');
  
  await page.fill('input[placeholder="New skill..."]', 'GraphQL');
  await page.click('button:has(.lucide-plus)');

  page.on('dialog', dialog => dialog.accept());
  await page.click('button:has-text("Save Profile")');
  
  await page.waitForTimeout(2000); 

  await page.click('a[href="/dashboard"]');
  await page.waitForURL('**/dashboard');
  
  await page.click('a[href="/resumes"]');
  await page.waitForURL('**/resumes');
  await page.waitForLoadState('networkidle');
  
  const reCard = page.locator('.grid > .rounded-xl');
  await reCard.click();
  await page.waitForURL('**/resumes/*');
  await page.waitForSelector('input#years');

  const persistedYears = await page.locator('input#years').inputValue();
  console.log(`Persisted experience years: ${persistedYears}`);
  
  const skillLocator = page.locator('.flex-wrap > .inline-flex');
  const skillsCount = await skillLocator.count();
  const skills = [];
  for(let i=0; i<skillsCount; i++) {
     skills.push(await skillLocator.nth(i).textContent());
  }
  console.log(`Persisted skills:`, skills);

  if (persistedYears === '10' && skills.some(s => s.includes('GraphQL'))) {
    console.log("SUCCESS! Edits persisted correctly.");
  } else {
    console.log("FAILURE! Edits did not persist.");
  }

  await browser.close();
})();