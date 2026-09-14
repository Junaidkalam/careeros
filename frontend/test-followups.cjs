const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 1. Log in
  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"]', 'nade.system.out@gmail.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');

  await page.waitForURL('**/dashboard');
  console.log('Logged in successfully.');

  // 2. Go to applications list
  await page.click('a[href="/applications"]');
  await page.waitForURL('**/applications');
  
  // 3. Click the first application in the board
  await page.waitForSelector('.cursor-pointer.glass-panel');
  await page.click('.cursor-pointer.glass-panel');
  await page.waitForURL('**/applications/**');
  
  // Wait for detail view to load
  await page.waitForSelector('span:has-text("Status")');
  
  // 4. Set status to SAVED first to reset, then APPLIED
  await page.click('button[role="combobox"]');
  await page.waitForSelector('div[role="option"]');
  await page.click('div[role="option"]:has-text("Saved")');
  await page.waitForTimeout(500); // give it time to save

  await page.click('button[role="combobox"]');
  await page.click('div[role="option"]:has-text("Applied")');
  await page.waitForTimeout(1000); // give it time to save and fetch 14-days out date

  // 5. Backdate the follow-up date to yesterday via the UI
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yyyy = yesterday.getFullYear();
  const mm = String(yesterday.getMonth() + 1).padStart(2, '0');
  const dd = String(yesterday.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;
  
  console.log('Setting date to', dateStr);
  await page.fill('input[type="date"]', dateStr);
  
  // Tab out to trigger change (or it might just trigger on fill)
  await page.keyboard.press('Tab');
  await page.waitForTimeout(1000); // give it time to save
  
  // 7. Go to Dashboard
  await page.click('a[href="/dashboard"]');
  await page.waitForURL('**/dashboard');
  
  // Wait for Follow-ups Due section
  await page.waitForSelector('text=Follow-ups Due');
  console.log('Follow-ups due section visible');
  
  // 8. Screenshot
  const brainDir = path.join(process.env.USERPROFILE, '.gemini', 'antigravity', 'brain', 'b4665f4f-4b18-4225-b5ee-74351e35bc40');
  const screenshotPath = path.join(brainDir, 'followups_dashboard.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  
  const artifactPath = path.join(brainDir, 'followups_dashboard.md');
  const artifactContent = `
# Follow-ups Due on Dashboard
Here is the dashboard showing the pending follow-up.

![Follow-ups Dashboard](file:///${screenshotPath.replace(/\\/g, '/')})
`;
  fs.writeFileSync(artifactPath, artifactContent);
  console.log('Artifact written to', artifactPath);

  await browser.close();
})();