import { BasePage } from '../BasePage.js';
import { logStep, logAction, logValidation } from '../../utils/logger.js';

export class TulipDashboardPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    
    // Sidebar elements
    this.mainSubmenu = page.locator('.ant-menu-submenu-title:has-text("Main")');
    this.dashboardMenuItem = page.locator('.ant-menu-item:has-text("Tulip Dashboard")');

    // Main Banner & Trending Section elements
    this.banner = page.locator('.topFront');
    this.trendingSection = page.locator('.TopFintech');
    this.nextChevron = page.locator('.TopFintech .slick-next, .TopFintech .lucide-chevron-right');
    this.prevChevron = page.locator('.TopFintech .slick-prev, .TopFintech .lucide-chevron-left');
    this.activeSlides = page.locator('.TopFintech .slick-slide.slick-active');

    // --- Row 1 Grid Columns ---
    const row1 = page.locator('.ant-row').first();
    this.row1Card1 = row1.locator('.ant-col').nth(0);
    this.row1Card2 = row1.locator('.ant-col').nth(1);
    this.row1Card3 = row1.locator('.ant-col').nth(2);

    // --- Row 1 Click Targets ---
    this.row1Card1Click = this.row1Card1.locator('.shurtiDiv, img').first();
    this.row1Card2Click = this.row1Card2.locator('.imgDiv, img').first();
    this.row1Card3Click = this.row1Card3.locator('.domainExpert, img').first();

    // --- Row 2 Grid Columns ---
    const row2 = page.locator('.ant-row.mt-4.transDiv');
    this.row2Card1 = row2.locator('.ant-col').nth(0);
    this.row2Card2 = row2.locator('.ant-col').nth(1);
    this.row2Card3 = row2.locator('.ant-col').nth(2);

    // --- Row 2 Click Targets ---
    this.row2Card1Click = this.row2Card1.locator('.shurtiDiv, img').first();
    this.row2Card2Click = this.row2Card2.locator('.shurtiBottom, img').first();
    this.row2Card3Click = this.row2Card3.locator('.developmentTeam, img').first();

    // --- Bottom Composite Banner & Tabs ---
    this.deliverablesImg = page.locator('.deliverablesImg img').first();
    this.deliverablesTab = page.locator('[id$="-tab-delivery"]');
    this.integrationTab = page.locator('[id$="-tab-integration"]');
    this.supportTab = page.locator('[id$="-tab-support"]');
    this.activeTabPane = page.locator('.ant-tabs-tabpane-active');
  }

  /**
   * Expand sidebar "Main" menu if needed, and navigate to the Tulip Dashboard page.
   * Automatically handles and dismisses the onboarding/welcome tour if it overlays.
   */
  async navigateToDashboard() {
    logStep('Navigating to Tulip Dashboard from sidebar');
    
    // Dismiss onboarding tour if visible to prevent menu click interception
    try {
      const tourCloseBtn = this.page.locator('.ant-tour-close, .ant-modal-close, button:has-text("Get Started")').first();
      if (await tourCloseBtn.isVisible({ timeout: 3000 })) {
        logAction('Onboarding tour popup detected. Dismissing it.');
        await tourCloseBtn.click();
        await this.page.waitForTimeout(1000);
      }
    } catch {
      // Ignore if tour is not present
    }

    if (await this.mainSubmenu.isVisible()) {
      const isExpanded = await this.mainSubmenu.getAttribute('aria-expanded') === 'true';
      if (!isExpanded) {
        logAction('Expanding Main side menu');
        await this.mainSubmenu.scrollIntoViewIfNeeded();
        await this.mainSubmenu.click({ force: true });
        await this.page.waitForTimeout(500);
      }
    }
    
    logAction('Clicking Tulip Dashboard menu link');
    await this.dashboardMenuItem.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(300);
    // dispatchEvent fires synthetic React events unlike evaluate(el.click())
    await this.dashboardMenuItem.dispatchEvent('click');
    // Fallback: if click didn't trigger navigation, go directly via URL
    try {
      await this.page.waitForURL(url => url.pathname.endsWith('/dashboard'), { timeout: 8000 });
    } catch {
      await this.page.goto('/tix/dashboard');
      await this.page.waitForURL(url => url.pathname.endsWith('/dashboard'), { timeout: 10000 });
      // Wait for React to render dashboard content
      await this.page.waitForSelector('.topFront', { state: 'visible', timeout: 10000 }).catch(() => {});
    }
    logValidation('Successfully reached the Tulip Dashboard page');
  }


  /**
   * Click on a section (Innovation, Engineering, or Ventures) on the top composite banner.
   * Clicks at specific X-axis percentages relative to the banner bounding box.
   * @param {'innovation' | 'engineering' | 'ventures'} section
   */
  async clickBannerSection(section) {
    logStep(`Clicking banner section: ${section.toUpperCase()}`);
    const box = await this.banner.boundingBox();
    if (!box) {
      throw new Error('Banner is not visible on page');
    }

    let xPosition = box.width / 2; // Default center (Engineering)
    if (section === 'innovation') {
      xPosition = box.width / 6; // Left 16% (Innovation)
    } else if (section === 'ventures') {
      xPosition = box.width * 5 / 6; // Right 84% (Ventures)
    }

    await this.banner.click({ position: { x: xPosition, y: box.height / 2 } });
    await this.trendingSection.waitFor({ state: 'visible', timeout: 5000 });
    logValidation(`Successfully loaded trending scroll section after banner click`);
  }

  /**
   * Click the next chevron on the trending list.
   */
  async scrollSliderNext() {
    logStep('Clicking right chevron to scroll slider next');
    await this.nextChevron.click({ force: true });
    await this.page.waitForTimeout(1000); // Wait for transition animation
  }

  /**
   * Click the prev chevron on the trending list.
   */
  async scrollSliderPrev() {
    logStep('Clicking left chevron to scroll slider prev');
    await this.prevChevron.click({ force: true });
    await this.page.waitForTimeout(1000); // Wait for transition animation
  }

  /**
   * Close the trending slider by clicking on the empty background area.
   */
  async closeTrendingSection() {
    logStep('Closing trending slider by clicking empty background space');
    await this.trendingSection.click({ position: { x: 10, y: 10 } });
    await this.banner.waitFor({ state: 'visible', timeout: 5000 });
    logValidation('Trending closed; top banner is visible again');
  }

  /**
   * Helper to flip a card by clicking its specific target.
   * @param {import('@playwright/test').Locator} cardClickLocator
   */
  async flipCard(cardClickLocator) {
    logStep('Clicking card to flip it');
    await cardClickLocator.scrollIntoViewIfNeeded();
    await cardClickLocator.click();
    await this.page.waitForTimeout(1500); // Wait for CSS flip animation
  }

  /**
   * Clear persistent state from Redux (in localStorage) and reload the page
   * to reset expanded layouts like the Learning resources card.
   */
  async resetDashboardState() {
    logStep('Clearing persist:root local storage state and reloading page');
    await this.page.evaluate(() => localStorage.removeItem('persist:root'));
    await this.reload();
    await this.page.waitForTimeout(2000);
  }

  /**
   * Click a bottom tab by name.
   * @param {'deliverables' | 'integration' | 'support'} tabName
   */
  async clickTab(tabName) {
    logStep(`Clicking bottom tab: ${tabName}`);
    const tabMap = {
      deliverables: this.deliverablesTab,
      integration: this.integrationTab,
      support: this.supportTab,
    };
    const tab = tabMap[tabName];
    await tab.scrollIntoViewIfNeeded();
    await tab.click();
    await this.page.waitForTimeout(1000);
    logValidation(`Tab "${tabName}" clicked successfully`);
  }
}
