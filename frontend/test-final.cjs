const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  console.log("Navigating to login...");
  await page.goto('http://localhost:5173/login');
  await page.waitForLoadState('networkidle');

  console.log("Logging in as nade.system.out@gmail.com with password123...");
  await page.fill('input[type="email"]', 'nade.system.out@gmail.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');

  await page.waitForURL('http://localhost:5173/dashboard', { timeout: 10000 });
  console.log("Successfully logged in!");

  console.log("Navigating to /jobs via UI click");
  await page.click('a[href="/jobs"]');
  await page.waitForURL('http://localhost:5173/jobs', { timeout: 10000 });
  await page.waitForTimeout(2000);

  // Test 1: Search "Data"
  console.log("--- Test 1: Search 'Data' ---");
  await page.fill('input[placeholder="Search jobs..."]', 'Data');
  await page.waitForTimeout(1500); // Wait for debounce and network
  let jobTitles = await page.$$eval('h4', nodes => nodes.map(n => n.innerText));
  console.log("Visible jobs Test 1:", jobTitles);

  // Clear search
  await page.fill('input[placeholder="Search jobs..."]', '');
  await page.waitForTimeout(1500);

  // Test 2: Work Mode = Remote
  console.log("--- Test 2: Work Mode = Remote ---");
  await page.click('button:has-text("Work Mode"), button:has-text("Any Mode")');
  await page.click('div[role="option"]:has-text("Remote")');
  await page.waitForTimeout(1500);
  jobTitles = await page.$$eval('h4', nodes => nodes.map(n => n.innerText));
  console.log("Visible jobs Test 2:", jobTitles);

  // Clear Work Mode
  await page.click('button:has-text("Remote")');
  await page.click('div[role="option"]:has-text("Any Mode")');
  await page.waitForTimeout(1500);

  // Test 3: Match Score = 50%+
  console.log("--- Test 3: Match Score = 50%+ ---");
  await page.click('button:has-text("Match Score"), button:has-text("Any Score")');
  await page.click('div[role="option"]:has-text("50%+ Match")');
  await page.waitForTimeout(1500);
  jobTitles = await page.$$eval('h4', nodes => nodes.map(n => n.innerText));
  console.log("Visible jobs Test 3:", jobTitles);
  await page.screenshot({ path: 'artifacts/test3_match_50.png' });
  
  const html = await page.evaluate(() => document.body.innerHTML);
  require('fs').writeFileSync('page.html', html);

  await browser.close();
})();