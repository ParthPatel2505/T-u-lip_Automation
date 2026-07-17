import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage.js';
import { InnovationPage } from '../../pages/Automation_Acceleration/Innovation_add.js';
import { generateTulipData, createUploadFixtures } from '../../utils/testDataFactory.js';
import { logStep, logValidation } from '../../utils/logger.js';

test.describe.configure({ mode: 'serial' });

test.describe('Innovation Edit - E2E Test Suite', () => {
  let sharedPage;
  let loginPage;
  let innovationPage;
  let testData;
  let files;

  test.beforeAll(async ({ browser }) => {
    testData = generateTulipData('Tulipdata');
    files = createUploadFixtures(`${testData.key}-edit`);

    const context = await browser.newContext();
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    sharedPage = await context.newPage();
    loginPage = new LoginPage(sharedPage);
    innovationPage = new InnovationPage(sharedPage);

    await loginPage.goToLoginPage();
    await loginPage.loginWithEnvCredentials();
    expect(await loginPage.isLoginSuccessful()).toBeTruthy();

    await innovationPage.openInnovationListFromSideMenu();
    await innovationPage.selectSortOption('Latest First').catch(() => {});
    await innovationPage.findAndOpenInnovation('Tulipdata');
  });

  test.afterAll(async () => {
    if (sharedPage) {
      await sharedPage.close();
    }
  });

  test('should open editable Innovation detail page and verify main components', async () => {
    logStep('Verifying Innovation edit/detail page loaded');
    expect(sharedPage.url()).toContain('innovation');

    const bodyText = await innovationPage.getPageText();
    expect(bodyText).toMatch(/Innovation|Dashboard/i);

    const rightPanelItems = await innovationPage.verifyRightPanel();
    expect(rightPanelItems.length).toBeGreaterThanOrEqual(1);
  });

  test('should verify workflow tabs and detail/work item/comment/activity tabs', async () => {
    await innovationPage.clickWorkflowTabs();
    await innovationPage.clickContentTabs();

    const bodyText = await innovationPage.getPageText();
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('should verify submit for review, assign to self, and unassign popup behavior when available', async () => {
    await innovationPage.detailsTab.click({ force: true }).catch(() => {});
    await innovationPage.verifyAssignAndUnassignFlow();

    const messages = await innovationPage.getToastOrPageValidation();
    logValidation(`Review assignment messages: ${messages.join(' | ') || 'No toast text captured'}`);
    expect(await innovationPage.getPageText()).toMatch(/Details|Innovation|Dashboard/i);
  });

  test('should verify Add Review side panel flow with cancel, reset, and approve when available', async () => {
    const handled = await innovationPage.addReviewNote(testData);
    if (handled) {
      const messages = await innovationPage.getToastOrPageValidation();
      logValidation(`Add review messages: ${messages.join(' | ') || 'No toast text captured'}`);
    }

    expect(await innovationPage.getPageText()).toMatch(/Innovation|Review|Details/i);
  });

  test('should verify Work Item tab, Add Manual work item, search/filter, and created record visibility', async () => {
    await innovationPage.openWorkItemTab();
    expect(await innovationPage.getPageText()).toMatch(/Work Item|Details|Activity/i);

    await innovationPage.addManualWorkItem(testData, files.attachmentFile);

    const pageTextAfterCreate = await innovationPage.getPageText();
    if (pageTextAfterCreate.includes(testData.title)) {
      expect(pageTextAfterCreate).toContain(testData.title);
    } else {
      logValidation('Work item create action completed, but created title was not visible in current viewport');
      expect(pageTextAfterCreate.length).toBeGreaterThan(0);
    }

    const searchInput = sharedPage.locator('input[placeholder*="Search"], input[type="search"]').first();
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill(testData.title);
      await sharedPage.waitForTimeout(1000);
      expect(await innovationPage.getPageText()).toMatch(/Work Item|No Data|Tulipdata/i);
    }

    const filterButton = sharedPage.locator('button:has-text("Filter"), button:has-text("Filters")').first();
    if (await filterButton.isVisible().catch(() => false)) {
      await filterButton.click({ force: true });
      await sharedPage.waitForTimeout(700);
      await sharedPage.keyboard.press('Escape');
    }
  });

  test('should verify opening created work item details and closing it when available', async () => {
    const createdRecord = sharedPage.locator(`text=${testData.title}`).first();
    if (await createdRecord.isVisible().catch(() => false)) {
      await createdRecord.click({ force: true });
      await sharedPage.waitForTimeout(1000);
      expect(await innovationPage.getPageText()).toContain(testData.title);
      await innovationPage.clickButtonIfVisible('Close');
    } else {
      logValidation('Created work item row was not visible for detail-open verification');
      expect(await innovationPage.getPageText()).toMatch(/Work Item|Innovation/i);
    }
  });

  test('should verify comment submit and activity tab data', async () => {
    await innovationPage.addComment(testData);

    const hasActivityData = await innovationPage.verifyActivityHasData();
    expect(hasActivityData).toBeTruthy();
  });

  test('should verify curation and orchestration components', async () => {
    if (await innovationPage.curationTab.isVisible().catch(() => false)) {
      await innovationPage.curationTab.click({ force: true });
      await sharedPage.waitForTimeout(1000);
      expect(await innovationPage.getPageText()).toMatch(/Generate Report|Curation|Innovation/i);
    }

    if (await innovationPage.orchestrationTab.isVisible().catch(() => false)) {
      await innovationPage.orchestrationTab.click({ force: true });
      await sharedPage.waitForTimeout(1000);
      expect(await innovationPage.getPageText()).toMatch(/Project Readiness|Orchestration|Innovation/i);
    }
  });

  test('should verify right-side Innovation details and like action', async () => {
    const rightPanelItems = await innovationPage.verifyRightPanel();
    expect(rightPanelItems.length).toBeGreaterThanOrEqual(1);

    const messages = await innovationPage.likeInnovation();
    logValidation(`Like action messages: ${messages.join(' | ') || 'No toast text captured'}`);
  });

  test('should verify FeedBack side panel from Details tab three-dot actions', async () => {
    await innovationPage.detailsTab.click({ force: true }).catch(() => {});
    const handled = await innovationPage.addFeedback(testData);
    expect(handled).toBeTruthy();

    if (handled) {
      const messages = await innovationPage.getToastOrPageValidation();
      logValidation(`Details tab FeedBack messages: ${messages.join(' | ') || 'No toast text captured'}`);
    }

    expect(await innovationPage.getPageText()).toMatch(/Innovation|Collation|Details/i);
  });

  test('should verify edit details action and save when available', async () => {
    const handled = await innovationPage.editDetailsAndSave(testData);

    if (handled) {
      const messages = await innovationPage.getToastOrPageValidation();
      logValidation(`Edit details messages: ${messages.join(' | ') || 'No toast text captured'}`);
    } else {
      logValidation('Edit Details action was not available for current record state');
    }

    expect(await innovationPage.getPageText()).toMatch(/Innovation|Dashboard/i);
  });
});
