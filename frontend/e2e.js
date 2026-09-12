import { chromium } from 'playwright';
import assert from 'assert';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const FRONTEND_URL = 'http://localhost:5174';

  console.log("--- Starting E2E Auth Verification ---");

  // Arrays to hold captured requests
  const apiRequests = [];

  page.on('response', response => {
    if (response.url().includes('/api/auth/')) {
      apiRequests.push({
        url: response.url(),
        status: response.status()
      });
    }
  });

  try {
    // 1. Navigate directly to /dashboard while logged out.
    console.log("\n[Check 1] Navigating to /dashboard while logged out...");
    await page.goto(`${FRONTEND_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    const urlAfterRedirect = page.url();
    console.log("URL is now:", urlAfterRedirect);
    assert(urlAfterRedirect.includes('/login'), "Did not redirect to /login");
    console.log("✓ Check 1 Passed");

    // 2. Go to /register, fill in, submit.
    console.log("\n[Check 2] Registering a new user...");
    await page.goto(`${FRONTEND_URL}/register`);
    await page.fill('input[type="text"]', 'E2E Test User');
    await page.fill('input[type="email"]', `e2e_${Date.now()}@example.com`);
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    const urlAfterRegister = page.url();
    console.log("URL is now:", urlAfterRegister);
    assert(urlAfterRegister.includes('/dashboard'), "Did not land on /dashboard");
    
    // Confirm sidebar shows registered name
    const sidebarText = await page.textContent('aside');
    console.log("Sidebar text contains 'E2E Test User':", sidebarText.includes('E2E Test User'));
    assert(sidebarText.includes('E2E Test User'), "Sidebar does not show the registered name");
    console.log("✓ Check 2 Passed");

    // 3. Click Logout.
    console.log("\n[Check 3] Clicking Logout...");
    await page.click('button[title="Log out"]');
    await page.waitForURL('**/login', { timeout: 5000 });
    const urlAfterLogout = page.url();
    console.log("URL is now:", urlAfterLogout);
    assert(urlAfterLogout.includes('/login'), "Did not redirect to /login after logout");
    console.log("✓ Check 3 Passed");

    // 4. Navigate directly to /dashboard again.
    console.log("\n[Check 4] Navigating to /dashboard after logout...");
    await page.goto(`${FRONTEND_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    const urlAfterSecondRedirect = page.url();
    console.log("URL is now:", urlAfterSecondRedirect);
    assert(urlAfterSecondRedirect.includes('/login'), "Did not redirect to /login after logging out");
    console.log("✓ Check 4 Passed");

    // 5. Check network requests
    console.log("\n[Check 5] Verifying API requests...");
    console.log("Captured API responses:", apiRequests);
    const registerReq = apiRequests.find(r => r.url.includes('/api/auth/register'));
    assert(registerReq && registerReq.status === 201 || registerReq.status === 200, "Register API did not return 2xx success");
    console.log("✓ Check 5 Passed");

    console.log("\nAll checks passed successfully!");

  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await browser.close();
  }
})();