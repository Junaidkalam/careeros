import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  await page.goto('http://localhost:5173/register');
  const email = `resume_test_${Date.now()}@example.com`;
  await page.fill('input[type="text"]', 'Resume Tester');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');

  await page.waitForURL('**/dashboard');

  await page.click('a[href="/resumes"]');
  await page.waitForURL('**/resumes');
  await page.waitForLoadState('networkidle');

  await page.click('button[type="button"]:has-text("Upload Resume")');
  await page.waitForSelector('input[type="file"]');

  const filePath = path.resolve('test_resume.pdf');
  await page.setInputFiles('input[type="file"]', filePath);
  
  await page.click('button[type="submit"]');
  await page.waitForSelector('text=Upload Resume', { state: 'visible' });

  const card = page.locator('.grid > .rounded-xl');
  await card.waitFor({ state: 'visible' });

  await card.click();
  await page.waitForURL('**/resumes/*');
  await page.waitForSelector('text=Save Profile');
  
  const yearsInput = page.locator('input#years');
  await yearsInput.fill('10');
  
  await page.fill('input[placeholder="New skill..."]', 'GraphQL');
  await page.click('button:has(.lucide-plus)');

  page.on('dialog', dialog => dialog.accept());
  
  await Promise.all([
    page.waitForResponse(resp => resp.url().includes('/api/resumes/') && resp.request().method() === 'PUT'),
    page.click('button:has-text("Save Profile")')
  ]).then(async resps => {
    const r = resps[0];
    console.log("Save status:", r.status());
    console.log("Save response:", await r.json());
  });
  
  await browser.close();
})();