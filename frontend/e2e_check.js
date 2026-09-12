import { chromium } from 'playwright';
import path from 'path';
import { readFileSync } from 'fs';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.on('console', m => console.log('PAGE:', m.text()));
  page.on('pageerror', e => console.log('ERR:', e.message));

  // Register
  await page.goto('http://localhost:5173/register');
  const em = `t${Date.now()}@x.com`;
  await page.fill('input[type="text"]', 'T');
  await page.fill('input[type="email"]', em);
  await page.fill('input[type="password"]', 'pass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  const token = await page.evaluate(() => window.__token);

  // Upload resume using formdata-node from Node
  const { FormData, File } = await import('node:buffer');
  const pdfBytes = readFileSync(path.resolve('test_resume.pdf'));
  const formData = new FormData();
  formData.append('file', new Blob([pdfBytes], { type: 'application/pdf' }), 'resume.pdf');
  formData.append('versionLabel', 'V1');

  const rr = await fetch('http://localhost:8080/api/resumes', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  console.log('Resume upload status:', rr.status);
  const resumeData = await rr.text();
  console.log('Resume response:', resumeData.substring(0, 200));

  await browser.close();
})();