import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage.js';
import { ReviewPoolPage } from '../../pages/Main/ReviewPool.js';
import { logStep, logValidation } from '../../utils/logger.js';

// Run tests serially in one logged-in browser flow, like Tulip_dashboard.spec.js.
test.describe.configure({ mode: 'serial' });

test.describe('Review Pool Listing - E2E Test Suite', () => {
  let sharedPage;
  let loginPage;
  let reviewPoolPage;
  let reviewPoolUrl;
  let firstPageSnapshot;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    sharedPage = await context.newPage();
    loginPage = new LoginPage(sharedPage);
    reviewPoolPage = new ReviewPoolPage(sharedPage);

    await loginPage.goToLoginPage();
    await loginPage.loginWithEnvCredentials();

    const loginOk = await loginPage.isLoginSuccessful();
    expect(loginOk).toBeTruthy();

    await reviewPoolPage.navigateToReviewPoolFromSideMenu();
    reviewPoolUrl = sharedPage.url();
  });

  test.afterAll(async () => {
    if (sharedPage) {
      await sharedPage.close();
    }
  });

  test('should open Review Pool listing from Main side menu', async () => {
    logStep('Verifying Review Pool listing URL and page header');
    expect(reviewPoolUrl).toContain('review');
    await expect(reviewPoolPage.pageTitle).toBeVisible({ timeout: 10000 });
    await expect(reviewPoolPage.pageTitle).toContainText(/Review Pool/i);

    logStep('Verifying table listing is visible after side menu navigation');
    await expect(reviewPoolPage.tableWrapper).toBeVisible();
    await expect(reviewPoolPage.table).toBeVisible();
  });

  test('should verify loaded data and table component UI dynamically', async () => {
    logStep('Verifying table has dynamic records and cells');
    const rowCount = await reviewPoolPage.getVisibleRowCount();
    const cellCount = await reviewPoolPage.getVisibleCellCount();
    const rowTexts = await reviewPoolPage.getVisibleRowTexts();

    expect(rowCount).toBeGreaterThan(0);
    expect(cellCount).toBeGreaterThan(rowCount);
    expect(rowTexts.length).toBe(rowCount);
    expect(rowTexts.every((row) => row.length > 0)).toBeTruthy();

    logStep('Verifying clickable title links are present for loaded rows');
    const titleLinkCount = await reviewPoolPage.titleLinks.count();
    expect(titleLinkCount).toBeGreaterThan(0);

    firstPageSnapshot = await reviewPoolPage.getTableSnapshot();
    expect(firstPageSnapshot.length).toBeGreaterThan(0);
  });

  test('should verify table columns are displayed properly', async () => {
    logStep('Verifying expected Review Pool table columns');
    const columnNames = await reviewPoolPage.assertExpectedColumns([
      'Title',
      'Ticket Type',
      'Submitted Date',
      'Reporter Name',
    ]);

    const hasReviewerColumn = columnNames.some((column) => /review/i.test(column));
    expect(hasReviewerColumn).toBeTruthy();
    logValidation(`Columns visible: ${columnNames.join(', ')}`);
  });

  test('should verify table scrolling and page scrolling', async () => {
    logStep('Verifying horizontal table scroll if columns overflow');
    const tableScroll = await reviewPoolPage.scrollTableHorizontallyIfPossible();
    if (tableScroll.canScroll) {
      expect(tableScroll.after).toBeGreaterThan(tableScroll.before);
    } else {
      await expect(reviewPoolPage.table).toBeVisible();
      logValidation('Table does not currently need horizontal scroll; visible layout verified');
    }

    logStep('Verifying page can scroll down and back to top');
    const pageScroll = await reviewPoolPage.scrollPageDownAndUp();
    expect(pageScroll.afterUp).toBe(0);

    if (pageScroll.afterDown === pageScroll.before) {
      await expect(reviewPoolPage.tableWrapper).toBeVisible();
      logValidation('Page does not currently need vertical scroll; listing remained visible');
    } else {
      expect(pageScroll.afterDown).toBeGreaterThan(pageScroll.before);
    }
  });

  test('should verify items per page, Next Page, and Previous Page functionality', async () => {
    logStep('Verifying visible rows respect selected items per page');
    const itemsPerPage = await reviewPoolPage.getItemsPerPage();
    const rowCount = await reviewPoolPage.getVisibleRowCount();
    const totalRecords = await reviewPoolPage.getTotalRecordCount();

    expect(itemsPerPage).toBeGreaterThan(0);
    expect(rowCount).toBeLessThanOrEqual(itemsPerPage);

    logStep('Verifying Next Page button when more than one page is available');
    const hasNextPage = await reviewPoolPage.isNextPageAvailable();
    if (totalRecords > itemsPerPage) {
      expect(hasNextPage).toBeTruthy();
    }

    if (!hasNextPage) {
      await expect(reviewPoolPage.nextPageButton).toHaveClass(/ant-pagination-disabled/);
      logValidation('Next Page is disabled because all records fit on the current page');
      return;
    }

    const pageOneNumber = await reviewPoolPage.getActivePageNumber();
    const pageOneSnapshot = firstPageSnapshot || await reviewPoolPage.getTableSnapshot();

    await reviewPoolPage.goToNextPage();

    const pageTwoNumber = await reviewPoolPage.getActivePageNumber();
    const pageTwoSnapshot = await reviewPoolPage.getTableSnapshot();

    expect(pageTwoNumber).toBeGreaterThan(pageOneNumber);
    expect(pageTwoSnapshot).not.toBe(pageOneSnapshot);

    logStep('Verifying Previous Page returns to the first page records');
    expect(await reviewPoolPage.isPreviousPageAvailable()).toBeTruthy();
    await reviewPoolPage.goToPreviousPage();

    const returnedPageNumber = await reviewPoolPage.getActivePageNumber();
    const returnedSnapshot = await reviewPoolPage.getTableSnapshot();

    expect(returnedPageNumber).toBe(pageOneNumber);
    expect(returnedSnapshot).toBe(pageOneSnapshot);
  });

  test('should open the same Review Pool listing by direct URL', async () => {
    logStep('Opening captured Review Pool listing URL directly');
    await reviewPoolPage.navigateToReviewPoolDirectly(reviewPoolUrl);

    await expect(sharedPage).toHaveURL(reviewPoolUrl);
    await expect(reviewPoolPage.tableWrapper).toBeVisible();

    const rowCount = await reviewPoolPage.getVisibleRowCount();
    const columnNames = await reviewPoolPage.getColumnNames();

    expect(rowCount).toBeGreaterThan(0);
    expect(columnNames.length).toBeGreaterThan(0);
  });
});
