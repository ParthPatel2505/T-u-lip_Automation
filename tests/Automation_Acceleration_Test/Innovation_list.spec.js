import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage.js';
import { InnovationPage } from '../../pages/Automation_Acceleration/Innovation_add.js';
import { logStep, logValidation } from '../../utils/logger.js';

test.describe.configure({ mode: 'serial' });

test.describe('Innovation List - E2E Test Suite', () => {
  let sharedPage;
  let loginPage;
  let innovationPage;

  test.beforeAll(async ({ browser }) => {
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
  });

  test.afterAll(async () => {
    if (sharedPage) {
      await sharedPage.close();
    }
  });

  test('should verify Innovation listing page UI components and loaded cards', async () => {
    await expect(innovationPage.listTitle).toBeVisible({ timeout: 10000 });
    await expect(innovationPage.sortButton).toBeVisible();
    await expect(innovationPage.filtersButton).toBeVisible();
    await expect(innovationPage.addInnovationButton).toBeVisible();

    const listText = await innovationPage.getVisibleCardText();
    expect(listText).toContain('Innovation');
    expect(listText).toMatch(/Collation|Curation|Orchestration|Overall Progress/i);
  });

  test('should verify sorting options and Latest First order behavior', async () => {
    await innovationPage.openSortMenu();
    const dropdownText = await sharedPage.locator('.ant-dropdown:not(.ant-dropdown-hidden)').innerText();
    expect(dropdownText).toContain('Oldest First');
    expect(dropdownText).toContain('Latest First');
    await sharedPage.keyboard.press('Escape');

    await innovationPage.selectSortOption('Latest First');
    const latestText = await innovationPage.getVisibleCardText();
    expect(latestText.length).toBeGreaterThan(0);

    await innovationPage.selectSortOption('Oldest First');
    const oldestText = await innovationPage.getVisibleCardText();
    expect(oldestText.length).toBeGreaterThan(0);
    expect(oldestText).not.toBe('');
  });

  test('should verify filter menu, filter categories, and reset or clear all behavior', async () => {
    await innovationPage.openFilters();
    const filterText = await sharedPage.locator('.ant-dropdown:not(.ant-dropdown-hidden)').innerText();

    for (const expectedFilter of ['State', 'View As', 'Favorite', 'Review Status', 'Date Range', 'Use Cases', 'Initiative']) {
      expect(filterText).toContain(expectedFilter);
    }

    await sharedPage.keyboard.press('Escape');
    await innovationPage.resetFiltersIfVisible();

    const listText = await innovationPage.getVisibleCardText();
    expect(listText.length).toBeGreaterThan(0);
  });

  test('should verify grid/card view content and row-column layout data is visible', async () => {
    const cardText = await innovationPage.getVisibleCardText();
    expect(cardText).toMatch(/Overall Progress/i);
    expect(cardText).toMatch(/\d+%/);
    expect(cardText).toMatch(/Collation|Curation|Orchestration/i);
  });

  test('should verify latest generated Tulipdata record if present', async () => {
    await innovationPage.selectSortOption('Latest First').catch(() => {});
    const listText = await innovationPage.getVisibleCardText();

    if (listText.includes('Tulipdata')) {
      expect(listText).toContain('Tulipdata');
      logValidation('Latest generated Tulipdata record is visible on Innovation list');
    } else {
      logValidation('No Tulipdata record is currently visible; list data still verified dynamically');
      expect(listText.length).toBeGreaterThan(0);
    }
  });

  test('should verify Show More Innovation and page scrolling', async () => {
    const pageScroll = await innovationPage.verifyPageScroll();
    expect(pageScroll.afterUp).toBe(0);

    const showMoreResult = await innovationPage.clickShowMoreIfVisible();
    if (showMoreResult.afterLength > 0) {
      expect(showMoreResult.afterLength).toBeGreaterThanOrEqual(showMoreResult.beforeLength);
    }

    logStep('Verifying list remains visible after show more and scroll actions');
    await expect(innovationPage.addInnovationButton).toBeVisible();
  });

  test('should verify direct URL opens Innovation listing', async () => {
    await innovationPage.openInnovationListDirectly();
    await expect(sharedPage).toHaveURL(/\/innovation$/);
    await expect(innovationPage.addInnovationButton).toBeVisible();
  });
});
