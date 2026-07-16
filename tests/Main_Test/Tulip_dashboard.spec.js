import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage.js';
import { TulipDashboardPage } from '../../pages/Main/TulipDashboardPage.js';
import { logStep } from '../../utils/logger.js';

// Run tests serially in a single flow
test.describe.configure({ mode: 'serial' });

test.describe('Tulip Dashboard — UI Test Suite', () => {
  let sharedPage;
  let loginPage;
  let tulipDashboardPage;

  test.beforeAll(async ({ browser }) => {
    // 1. Create a shared context and page
    const context = await browser.newContext();
    // Inject stealth script to bypass bot checks
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });
    sharedPage = await context.newPage();
    loginPage = new LoginPage(sharedPage);
    tulipDashboardPage = new TulipDashboardPage(sharedPage);

    // 2. Perform a single login
    await loginPage.goToLoginPage();
    await loginPage.loginWithEnvCredentials();
    const loginOk = await loginPage.isLoginSuccessful();
    expect(loginOk).toBeTruthy();

    // 3. Navigate to the Tulip Dashboard page
    await tulipDashboardPage.navigateToDashboard();
  });

  test.afterAll(async () => {
    if (sharedPage) {
      await sharedPage.close();
    }
  });

  test('should verify side menu navigation to dashboard', async () => {
    logStep('Checking URL after navigation');
    expect(sharedPage.url()).toContain('/dashboard');
    
    logStep('Checking visibility of the main top banner');
    // Use toBeVisible() which auto-waits for the element to appear
    await expect(tulipDashboardPage.banner).toBeVisible({ timeout: 10000 });
  });

  test('should click top banner and verify horizontal scroll grid', async () => {
    // 1. Click Innovation section on composite banner
    await tulipDashboardPage.clickBannerSection('innovation');
    
    // Verify trending fintech section is visible
    const isTrendingVisible = await tulipDashboardPage.trendingSection.isVisible();
    expect(isTrendingVisible).toBeTruthy();

    // 2. Click next chevron to verify slider scroll functionality
    logStep('Scrolling the grid to verify scroll functionality');
    await tulipDashboardPage.scrollSliderNext();

    // 3. Close the trending grid by clicking empty background space
    await tulipDashboardPage.closeTrendingSection();
  });

  test('should verify clicking and flipping cards in Row 1 and Row 2', async () => {
    // --- ROW 1 ---
    
    logStep('1. Verifying Row 1 Card 1 (shrutiAI)');
    await tulipDashboardPage.flipCard(tulipDashboardPage.row1Card1Click);
    // Card back should display "Innovations" inside Row 1 Card 1 container
    await expect(tulipDashboardPage.row1Card1.locator('text=Innovations').first()).toBeVisible();
    await tulipDashboardPage.row1Card1.click(); // Click to flip back
    await sharedPage.waitForTimeout(1000);

    logStep('2. Verifying Row 1 Card 2 (AUTOMATION)');
    await tulipDashboardPage.flipCard(tulipDashboardPage.row1Card2Click);
    // Card back should display a visible image (funnel or acceleration image)
    await expect(tulipDashboardPage.row1Card2.locator('img').first()).toBeVisible();
    await tulipDashboardPage.row1Card2.locator('img').first().click(); // Click to flip back
    await sharedPage.waitForTimeout(1000);

    logStep('3. Verifying Row 1 Card 3 (DOMAIN EXPERTS) + 3 inner project tabs');
    await tulipDashboardPage.flipCard(tulipDashboardPage.row1Card3Click);
    // Card back shows domain expert names
    await expect(tulipDashboardPage.row1Card3.locator('text=Kinjal Birare').first()).toBeVisible();
    // Verify 3 project tabs exist and switching works
    logStep('3a. Switching to tab 1 — Sustainable Smart Building');
    await sharedPage.locator('.ant-tabs-tab[data-node-key="0"]').click();
    await expect(sharedPage.locator('.ant-tabs-tab[data-node-key="0"]')).toHaveClass(/ant-tabs-tab-active/);
    logStep('3b. Switching to tab 2 — Digital Identity & Trust Framework');
    await sharedPage.locator('.ant-tabs-tab[data-node-key="1"]').click();
    await expect(sharedPage.locator('.ant-tabs-tab[data-node-key="1"]')).toHaveClass(/ant-tabs-tab-active/);
    logStep('3c. Switching to tab 3 — Sustainable Smart Cities Program');
    await sharedPage.locator('.ant-tabs-tab[data-node-key="2"]').click();
    await expect(sharedPage.locator('.ant-tabs-tab[data-node-key="2"]')).toHaveClass(/ant-tabs-tab-active/);
    await tulipDashboardPage.row1Card3.locator('text=Kinjal Birare').first().click(); // flip back
    await sharedPage.waitForTimeout(1000);

    // --- ROW 2 ---

    logStep('4. Verifying Row 2 Card 1 (shrutiAI Bottom)');
    await tulipDashboardPage.flipCard(tulipDashboardPage.row2Card1Click);
    // Card back displays "Emotional Mobility" inside Row 2 Card 1 container
    await expect(tulipDashboardPage.row2Card1.locator('text=Emotional Mobility').first()).toBeVisible();
    await tulipDashboardPage.row2Card1.locator('text=Emotional Mobility').first().click(); // Click to flip back
    await sharedPage.waitForTimeout(1000);

    logStep('5. Verifying Row 2 Card 2 (EXECUTION + LEARNING) - Expand and Reset');
    await tulipDashboardPage.flipCard(tulipDashboardPage.row2Card2Click);
    // Card back displays "Mobility" inside Row 2 Card 2 container
    await expect(tulipDashboardPage.row2Card2.locator('text=Mobility').first()).toBeVisible();
    // Reset Redux persistent state to collapse back to default dashboard layout
    await tulipDashboardPage.resetDashboardState();

    logStep('6. Verifying Row 2 Card 3 (Tntra Logo Card)');
    await tulipDashboardPage.flipCard(tulipDashboardPage.row2Card3Click);
    // Card back should show development team image inside Row 2 Card 3 container
    await expect(tulipDashboardPage.row2Card3.locator('img').first()).toBeVisible();
    await tulipDashboardPage.row2Card3.locator('img').first().click(); // Click to flip back
    await sharedPage.waitForTimeout(1000);
  });

  test('should click bottom deliverables banner and verify Delivery, Integration, and Support tabs', async () => {
    logStep('Scrolling down to the bottom composite banner');
    await tulipDashboardPage.deliverablesImg.scrollIntoViewIfNeeded();

    const box = await tulipDashboardPage.deliverablesImg.boundingBox();
    expect(box).not.toBeNull();

    // 1. Click Delivery section on composite image banner to open tabs layout
    logStep('Clicking DELIVERY section on composite banner');
    await tulipDashboardPage.deliverablesImg.click({ position: { x: box.width * 0.16, y: box.height / 2 } });
    await sharedPage.waitForTimeout(1500);

    // 2. Verify Deliverables tab is active and shows its cards
    logStep('Verifying Deliverables tab content');
    await expect(tulipDashboardPage.deliverablesTab).toBeVisible();
    await expect(tulipDashboardPage.activeTabPane.locator('h5, .text-dark').first()).toContainText('ADNOC Smart Rewards');

    // 3. Switch to Integration tab and verify
    await tulipDashboardPage.clickTab('integration');
    logStep('Verifying Integration tab content');
    await expect(tulipDashboardPage.activeTabPane.locator('h5, .text-dark').first()).toContainText('ShrutiAI Integration');

    // 4. Switch to Support tab and verify
    await tulipDashboardPage.clickTab('support');
    logStep('Verifying Support tab content');
    await expect(tulipDashboardPage.activeTabPane.locator('h5, .text-dark').first()).toContainText('ADNOC Smart Rewards');

    // 5. Switch back to Deliverables tab and verify
    await tulipDashboardPage.clickTab('deliverables');
    logStep('Verifying switch back to Deliverables tab content');
    await expect(tulipDashboardPage.activeTabPane.locator('h5, .text-dark').first()).toContainText('ADNOC Smart Rewards');
  });
});
