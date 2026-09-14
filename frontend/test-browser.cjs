const { chromium } = require('playwright');
const jwt = require('jsonwebtoken');

(async () => {
  const token = jwt.sign(
    { sub: "nade.system.out@gmail.com" },
    "change-this-in-prod-to-a-long-random-string",
    { expiresIn: '1h' }
  );

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  
  // Inject the token on every new document load
  await context.addInitScript((t) => {
    window.__token = t;
  }, token);

  const page = await context.newPage();

  console.log("Navigating to jobs page directly with injected token...");
  await page.goto('http://localhost:5173/jobs');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);

  // Check if we got redirected or if jobs loaded
  console.log("Current URL:", page.url());

  // Test 1: Search "Data"
  console.log("--- Test 1: Search 'Data' ---");
  await page.fill('input[placeholder="Search jobs..."]', 'Data');
  await page.waitForTimeout(1000);
  let jobTitles = await page.$$eval('h4', nodes => nodes.map(n => n.innerText));
  console.log("Visible jobs:", jobTitles);
  await page.screenshot({ path: 'artifacts/test1_search_data.png' });

  // Clear search
  await page.fill('input[placeholder="Search jobs..."]', '');
  await page.waitForTimeout(1000);

  // Test 2: Work Mode = Remote
  console.log("--- Test 2: Work Mode = Remote ---");
  await page.click('button:has-text("Work Mode"), button:has-text("Any Mode")');
  await page.click('div[role="option"]:has-text("Remote")');
  await page.waitForTimeout(1000);
  jobTitles = await page.$$eval('h4', nodes => nodes.map(n => n.innerText));
  console.log("Visible jobs:", jobTitles);
  await page.screenshot({ path: 'artifacts/test2_remote.png' });

  // Clear Work Mode
  await page.click('button:has-text("Remote")');
  await page.click('div[role="option"]:has-text("Any Mode")');
  await page.waitForTimeout(1000);

  // Test 3: Match Score = 50%+
  console.log("--- Test 3: Match Score = 50%+ ---");
  await page.click('button:has-text("Match Score"), button:has-text("Any Score")');
  await page.click('div[role="option"]:has-text("50%+ Match")');
  await page.waitForTimeout(1000);
  jobTitles = await page.$$eval('h4', nodes => nodes.map(n => n.innerText));
  console.log("Visible jobs:", jobTitles);
  await page.screenshot({ path: 'artifacts/test3_match_50.png' });

  await browser.close();
  process.exit(0);
})();