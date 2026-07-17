import { BasePage } from '../BasePage.js';
import { logAction, logStep, logValidation } from '../../utils/logger.js';

export class ReviewPoolPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);

    this.mainSubmenu = page
      .locator('.ant-menu-submenu-title:has-text("Main"), .ant-menu-item:has-text("Main"), [role="menuitem"]:has-text("Main")')
      .first();
    this.reviewPoolMenuItem = page
      .locator('.ant-menu-item:has-text("Review Pool"), [role="menuitem"]:has-text("Review Pool"), .ant-menu a:has-text("Review Pool")')
      .first();
    this.dashboardMenuItem = page
      .locator('.ant-menu-item:has-text("Dashboard"), [role="menuitem"]:has-text("Dashboard")')
      .first();

    this.pageTitle = page
      .locator('h1, h2, h3, h4, h5, .ant-typography')
      .filter({ hasText: /Review Pool Listing|Review Pool/i })
      .first();
    this.breadcrumb = page.locator('.ant-breadcrumb, [class*="breadcrumb"]').first();

    this.tableWrapper = page.locator('.ant-table-wrapper').first();
    this.table = page.locator('.ant-table').first();
    this.tableHeaders = page.locator('.ant-table-thead th:not(.ant-table-cell-scrollbar)');
    this.tableRows = page.locator(
      '.ant-table-tbody tr:not(.ant-table-placeholder):not(.ant-table-measure-row):not([aria-hidden="true"]):has(td)'
    );
    this.tableCells = page.locator(
      '.ant-table-tbody tr:not(.ant-table-placeholder):not(.ant-table-measure-row):not([aria-hidden="true"]):has(td) td'
    );
    this.titleLinks = page.locator(
      '.ant-table-tbody tr:not(.ant-table-placeholder):not(.ant-table-measure-row):not([aria-hidden="true"]):has(td) td a'
    );
    this.emptyState = page.locator('.ant-empty, .ant-table-placeholder').first();
    this.loadingSpinner = page.locator('.ant-spin-spinning, .ant-table-wrapper .ant-spin');

    this.pagination = page.locator('.ant-pagination').first();
    this.nextPageButton = page.locator('.ant-pagination-next').first();
    this.previousPageButton = page.locator('.ant-pagination-prev').first();
    this.activePageButton = page.locator('.ant-pagination-item-active').first();
    this.itemsPerPageSelector = page.locator('.ant-pagination-options-size-changer').first();
    this.paginationTotalText = page.locator('.ant-pagination-total-text').first();
  }

  async openMainDashboardShell() {
    logStep('Opening Main dashboard shell');
    try {
      await this.page.goto('/tix/dashboard', { waitUntil: 'domcontentloaded', timeout: 15000 });
      await this.page.waitForTimeout(1000);
    } catch {
      // If direct dashboard navigation is not allowed, continue from the current logged-in page.
    }
  }

  async navigateToReviewPoolFromSideMenu() {
    logStep('Navigating to Review Pool from side menu');
    await this.openMainDashboardShell();
    await this.handleInitialPopups();
    await this.expandMainMenuIfNeeded();

    logAction('Clicking Review Pool menu item');
    await this.reviewPoolMenuItem.scrollIntoViewIfNeeded();
    await this.reviewPoolMenuItem.click({ force: true });
    await this.waitForReviewPoolLoaded();
    logValidation('Review Pool listing loaded from side menu');
  }

  async navigateToReviewPoolDirectly(url) {
    logStep('Opening Review Pool by direct URL');
    if (url) {
      await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    } else {
      await this.page.goto('/tix/dashboard/review-pool', { waitUntil: 'domcontentloaded' });
    }
    await this.waitForReviewPoolLoaded();
    logValidation('Review Pool listing loaded from direct URL');
  }

  async waitForReviewPoolLoaded() {
    await this.page.waitForLoadState('domcontentloaded');
    await this.handleInitialPopups();
    await this.tableWrapper.waitFor({ state: 'visible', timeout: 20000 });
    await this.waitForTableToSettle();
  }

  async waitForTableToSettle() {
    try {
      await this.loadingSpinner.first().waitFor({ state: 'hidden', timeout: 10000 });
    } catch {
      // Some pages keep an Ant wrapper in the DOM even after loading.
    }
    await this.table.waitFor({ state: 'visible', timeout: 10000 });

    try {
      await this.tableCells.first().waitFor({ state: 'visible', timeout: 10000 });
    } catch {
      if (!(await this.emptyState.isVisible().catch(() => false))) {
        throw new Error('Review Pool table loaded, but no visible data cells or empty state were found.');
      }
    }
  }

  async expandMainMenuIfNeeded() {
    if (!(await this.mainSubmenu.isVisible({ timeout: 5000 }).catch(() => false))) {
      return;
    }

    const isExpanded = await this.mainSubmenu.getAttribute('aria-expanded') === 'true';
    if (!isExpanded) {
      logAction('Expanding Main side menu');
      await this.mainSubmenu.click({ force: true });
      await this.page.waitForTimeout(500);
    }
  }

  async handleInitialPopups() {
    try {
      const closeButton = this.page
        .locator('.ant-tour-close, .ant-modal-close, button:has-text("Skip"), button:has-text("Close"), button:has-text("Get Started")')
        .first();
      if (await closeButton.isVisible({ timeout: 2000 })) {
        logAction('Dismissing popup overlay');
        await closeButton.click();
      }
    } catch {
      // Ignore when no overlay is present.
    }
  }

  async getVisibleRowCount() {
    const rows = await this.getVisibleRowTexts();
    return rows.length;
  }

  async getColumnNames() {
    await this.waitForTableToSettle();
    const headers = await this.tableHeaders.allInnerTexts();
    return headers.map((header) => header.trim()).filter(Boolean);
  }

  async getVisibleRowTexts() {
    await this.waitForTableToSettle();
    const rows = await this.tableRows.allInnerTexts();
    return rows.map((row) => row.replace(/\s+/g, ' ').trim()).filter(Boolean);
  }

  async getVisibleCellCount() {
    await this.waitForTableToSettle();
    return await this.tableCells.count();
  }

  async getTableSnapshot() {
    await this.waitForTableToSettle();
    const rows = await this.tableRows.allInnerTexts();
    return rows.map((row) => row.replace(/\s+/g, ' ').trim()).filter(Boolean).join('|');
  }

  async getActivePageNumber() {
    if (!(await this.activePageButton.isVisible().catch(() => false))) {
      if (await this.pagination.isVisible().catch(() => false)) {
        const paginationText = await this.pagination.innerText();
        const simplePagerMatch = paginationText.match(/(\d+)\s*\/\s*(\d+)/);
        if (simplePagerMatch) {
          return Number.parseInt(simplePagerMatch[1], 10);
        }
      }

      return 1;
    }

    const pageText = await this.activePageButton.innerText();
    return Number.parseInt(pageText.trim(), 10) || 1;
  }

  async getItemsPerPage() {
    if (await this.itemsPerPageSelector.isVisible().catch(() => false)) {
      const text = await this.itemsPerPageSelector.innerText();
      const pageSize = Number.parseInt(text.replace(/\D/g, ''), 10);
      if (pageSize) {
        return pageSize;
      }
    }

    return 10;
  }

  async getTotalRecordCount() {
    if (await this.paginationTotalText.isVisible().catch(() => false)) {
      const text = await this.paginationTotalText.innerText();
      const numbers = text.match(/\d+/g)?.map(Number) || [];
      if (numbers.length) {
        return numbers[numbers.length - 1];
      }
    }

    const pageNumbers = await this.page
      .locator('.ant-pagination-item')
      .evaluateAll((items) => items.map((item) => Number.parseInt(item.textContent || '', 10)).filter(Boolean))
      .catch(() => []);
    if (pageNumbers.length) {
      return Math.max(...pageNumbers) * (await this.getItemsPerPage());
    }

    if (await this.pagination.isVisible().catch(() => false)) {
      const paginationText = await this.pagination.innerText();
      const simplePagerMatch = paginationText.match(/(\d+)\s*\/\s*(\d+)/);
      if (simplePagerMatch) {
        return Number.parseInt(simplePagerMatch[2], 10) * (await this.getItemsPerPage());
      }
    }

    return await this.getVisibleRowCount();
  }

  async assertExpectedColumns(expectedColumns) {
    const columnNames = await this.getColumnNames();
    const normalizedColumns = columnNames.map((column) => column.toLowerCase());

    for (const expectedColumn of expectedColumns) {
      const found = normalizedColumns.some((column) => column.includes(expectedColumn.toLowerCase()));
      if (!found) {
        throw new Error(`Expected table column "${expectedColumn}" was not found. Actual columns: ${columnNames.join(', ')}`);
      }
    }

    return columnNames;
  }

  async isNextPageAvailable() {
    if (!(await this.nextPageButton.isVisible().catch(() => false))) {
      return false;
    }

    const className = await this.nextPageButton.getAttribute('class');
    return !className?.includes('ant-pagination-disabled');
  }

  async isPreviousPageAvailable() {
    if (!(await this.previousPageButton.isVisible().catch(() => false))) {
      return false;
    }

    const className = await this.previousPageButton.getAttribute('class');
    return !className?.includes('ant-pagination-disabled');
  }

  async goToNextPage() {
    const beforePage = await this.getActivePageNumber();
    const beforeSnapshot = await this.getTableSnapshot();

    logAction('Clicking Next Page');
    await this.nextPageButton.click();
    await this.waitForPaginationChange(beforePage, beforeSnapshot);
  }

  async goToPreviousPage() {
    const beforePage = await this.getActivePageNumber();
    const beforeSnapshot = await this.getTableSnapshot();

    logAction('Clicking Previous Page');
    await this.previousPageButton.click();
    await this.waitForPaginationChange(beforePage, beforeSnapshot);
  }

  async waitForPaginationChange(beforePage, beforeSnapshot) {
    await this.page.waitForFunction(
      ({ pageNumber, tableText }) => {
        const activePage = document.querySelector('.ant-pagination-item-active')?.textContent?.trim();
        const paginationText = document.querySelector('.ant-pagination')?.textContent || '';
        const simplePagerMatch = paginationText.match(/(\d+)\s*\/\s*(\d+)/);
        const currentPage = simplePagerMatch
          ? Number.parseInt(simplePagerMatch[1], 10)
          : Number.parseInt(activePage || '1', 10) || 1;
        const rows = Array.from(
          document.querySelectorAll(
            '.ant-table-tbody tr:not(.ant-table-placeholder):not(.ant-table-measure-row):not([aria-hidden="true"])'
          )
        )
          .filter((row) => row.querySelector('td'))
          .map((row) => row.textContent?.replace(/\s+/g, ' ').trim())
          .filter(Boolean)
          .join('|');

        return currentPage !== pageNumber || rows !== tableText;
      },
      { pageNumber: beforePage, tableText: beforeSnapshot },
      { timeout: 15000 }
    );
    await this.waitForTableToSettle();
  }

  async scrollTableHorizontallyIfPossible() {
    await this.waitForTableToSettle();
    return await this.page.evaluate(() => {
      const container = document.querySelector('.ant-table-body') || document.querySelector('.ant-table-content');
      if (!container) {
        return { canScroll: false, before: 0, after: 0 };
      }

      const before = container.scrollLeft;
      const maxScroll = container.scrollWidth - container.clientWidth;
      container.scrollLeft = maxScroll;

      return {
        canScroll: maxScroll > 0,
        before,
        after: container.scrollLeft,
      };
    });
  }

  async scrollPageDownAndUp() {
    const before = await this.page.evaluate(() => window.scrollY);
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.page.waitForTimeout(500);
    const afterDown = await this.page.evaluate(() => window.scrollY);

    await this.page.evaluate(() => window.scrollTo(0, 0));
    await this.page.waitForTimeout(500);
    const afterUp = await this.page.evaluate(() => window.scrollY);

    return { before, afterDown, afterUp };
  }
}
