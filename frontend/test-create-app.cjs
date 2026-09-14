const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"]', 'nade.system.out@gmail.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');

  await page.waitForURL('**/dashboard');
  
  await page.click('a[href="/applications"]');
  await page.waitForURL('**/applications');
  
  await page.click('button:has-text("Add Application")');
  await page.waitForSelector('text=New Application');
  
  await page.click('button[role="combobox"]:has-text("Select a job")');
  await page.click('div[role="option"]:has-text("Backend Software Engineer")');
  
  await page.click('button[role="combobox"]:has-text("Select a resume")');
  const resumes = await page.$$('div[role="option"]');
  await resumes[0].click();
  
  await page.click('button:has-text("Analyze")');
  await page.waitForSelector('text=Match Result');
  
  await browser.close();
})();