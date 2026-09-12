import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  await page.goto('http://localhost:5173/register');
  const email = `shots_${Date.now()}@example.com`;
  await page.fill('input[type="text"]', 'Resume Tester');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');

  await page.waitForURL('**/dashboard');
  await page.click('a[href="/resumes"]');
  await page.waitForURL('**/resumes');
  await page.waitForLoadState('networkidle');

  await page.screenshot({ path: 'screenshots/resumes_empty.png' });

  await page.click('button[type="button"]:has-text("Upload Resume")');
  await page.waitForSelector('input[type="file"]');
  await page.screenshot({ path: 'screenshots/resumes_upload_modal.png' });

  const filePath = path.resolve('test_resume.pdf');
  await page.setInputFiles('input[type="file"]', filePath);
  await page.fill('input[id="version-label"]', 'V1 Test');
  
  await page.click('button[type="submit"]');
  await page.waitForSelector('text=Uploading & Parsing...', { state: 'hidden', timeout: 30000 });
  await page.waitForSelector('text=Upload Resume', { state: 'visible' });

  const card = page.locator('.grid > .rounded-xl');
  await card.waitFor({ state: 'visible' });
  await page.screenshot({ path: 'screenshots/resumes_list.png' });

  await card.click();
  await page.waitForURL('**/resumes/*');
  await page.waitForSelector('text=Save Profile');
  
  await page.screenshot({ path: 'screenshots/resumes_detail.png' });
  
  const yearsInput = page.locator('input#years');
  await yearsInput.fill('10');
  
  await page.fill('input[placeholder="New skill..."]', 'GraphQL');
  await page.click('button:has(.lucide-plus)');

  await page.screenshot({ path: 'screenshots/resumes_detail_edited.png' });

  page.on('dialog', dialog => dialog.accept());
  await page.click('button:has-text("Save Profile")');
  
  await page.waitForTimeout(2000); 

  await page.reload();
  await page.waitForSelector('input#years');
  
  await page.screenshot({ path: 'screenshots/resumes_detail_persisted.png' });

  console.log("Screenshots captured");
  await browser.close();
})();