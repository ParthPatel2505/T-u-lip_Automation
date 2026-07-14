/**
 * BasePage.js
 * ============================================================
 * Base Page Object that all page objects extend.
 * Contains common, reusable methods for element interaction,
 * navigation, waits, screenshots, and more.
 * ============================================================
 */
export class BasePage {
  /**
   * @param {import('@playwright/test').Page} page - Playwright page instance
   */
  constructor(page) {
    this.page = page;
  }

  // ──────────────────────────────────────────────
  //  NAVIGATION
  // ──────────────────────────────────────────────

  /**
   * Navigate to a path relative to the baseURL.
   * @param {string} [path=''] - Relative URL path
   */
  async navigate(path = '') {
    await this.page.goto(path, { waitUntil: 'domcontentloaded' });
  }

  /**
   * Navigate to a full (absolute) URL.
   * @param {string} url - Full URL
   */
  async navigateToUrl(url) {
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  }

  /**
   * Get the current page URL.
   * @returns {string}
   */
  getCurrentUrl() {
    return this.page.url();
  }

  /**
   * Get the current page title.
   * @returns {Promise<string>}
   */
  async getTitle() {
    return await this.page.title();
  }

  /**
   * Go back in browser history.
   */
  async goBack() {
    await this.page.goBack({ waitUntil: 'domcontentloaded' });
  }

  /**
   * Reload the current page.
   */
  async reload() {
    await this.page.reload({ waitUntil: 'domcontentloaded' });
  }

  // ──────────────────────────────────────────────
  //  ELEMENT INTERACTION
  // ──────────────────────────────────────────────

  /**
   * Click on an element.
   * @param {string | import('@playwright/test').Locator} locator
   * @param {object} [options] - Click options (force, timeout, etc.)
   */
  async click(locator, options = {}) {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await element.click(options);
  }

  /**
   * Double-click an element.
   * @param {string | import('@playwright/test').Locator} locator
   */
  async doubleClick(locator) {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await element.dblclick();
  }

  /**
   * Fill a text input field (clears existing text first).
   * @param {string | import('@playwright/test').Locator} locator
   * @param {string} text
   */
  async fill(locator, text) {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await element.fill(text);
  }

  /**
   * Type text into a field character by character (useful for auto-complete).
   * @param {string | import('@playwright/test').Locator} locator
   * @param {string} text
   * @param {number} [delay=50] - Delay between keystrokes in ms
   */
  async type(locator, text, delay = 50) {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await element.pressSequentially(text, { delay });
  }

  /**
   * Clear a text input field.
   * @param {string | import('@playwright/test').Locator} locator
   */
  async clear(locator) {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await element.clear();
  }

  /**
   * Select an option from a <select> dropdown by value.
   * @param {string | import('@playwright/test').Locator} locator
   * @param {string} value
   */
  async selectOption(locator, value) {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await element.selectOption(value);
  }

  /**
   * Select an option from a <select> dropdown by visible text.
   * @param {string | import('@playwright/test').Locator} locator
   * @param {string} label
   */
  async selectByText(locator, label) {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await element.selectOption({ label });
  }

  /**
   * Check a checkbox or radio button.
   * @param {string | import('@playwright/test').Locator} locator
   */
  async check(locator) {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await element.check();
  }

  /**
   * Uncheck a checkbox.
   * @param {string | import('@playwright/test').Locator} locator
   */
  async uncheck(locator) {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await element.uncheck();
  }

  /**
   * Upload a file to a file input element.
   * @param {string | import('@playwright/test').Locator} locator
   * @param {string | string[]} filePath
   */
  async uploadFile(locator, filePath) {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await element.setInputFiles(filePath);
  }

  // ──────────────────────────────────────────────
  //  ELEMENT STATE & INFO
  // ──────────────────────────────────────────────

  /**
   * Check if an element is visible on the page.
   * @param {string | import('@playwright/test').Locator} locator
   * @param {number} [timeout=5000]
   * @returns {Promise<boolean>}
   */
  async isElementVisible(locator, timeout = 5000) {
    try {
      const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
      await element.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if an element is enabled.
   * @param {string | import('@playwright/test').Locator} locator
   * @returns {Promise<boolean>}
   */
  async isElementEnabled(locator) {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    return await element.isEnabled();
  }

  /**
   * Check if a checkbox/radio is checked.
   * @param {string | import('@playwright/test').Locator} locator
   * @returns {Promise<boolean>}
   */
  async isChecked(locator) {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    return await element.isChecked();
  }

  /**
   * Get text content of an element.
   * @param {string | import('@playwright/test').Locator} locator
   * @returns {Promise<string>}
   */
  async getElementText(locator) {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    return (await element.textContent()) || '';
  }

  /**
   * Get the inner text of an element.
   * @param {string | import('@playwright/test').Locator} locator
   * @returns {Promise<string>}
   */
  async getInnerText(locator) {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    return await element.innerText();
  }

  /**
   * Get input value of an element.
   * @param {string | import('@playwright/test').Locator} locator
   * @returns {Promise<string>}
   */
  async getInputValue(locator) {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    return await element.inputValue();
  }

  /**
   * Get an attribute value from an element.
   * @param {string | import('@playwright/test').Locator} locator
   * @param {string} attribute
   * @returns {Promise<string | null>}
   */
  async getElementAttribute(locator, attribute) {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    return await element.getAttribute(attribute);
  }

  /**
   * Get the count of elements matching a locator.
   * @param {string | import('@playwright/test').Locator} locator
   * @returns {Promise<number>}
   */
  async getElementCount(locator) {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    return await element.count();
  }

  // ──────────────────────────────────────────────
  //  WAITS
  // ──────────────────────────────────────────────

  /**
   * Wait for an element to be visible.
   * @param {string | import('@playwright/test').Locator} locator
   * @param {number} [timeout=15000]
   */
  async waitForElement(locator, timeout = 15000) {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await element.waitFor({ state: 'visible', timeout });
  }

  /**
   * Wait for an element to be hidden or detached from DOM.
   * @param {string | import('@playwright/test').Locator} locator
   * @param {number} [timeout=15000]
   */
  async waitForElementToDisappear(locator, timeout = 15000) {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await element.waitFor({ state: 'hidden', timeout });
  }

  /**
   * Wait for the page to finish loading (load event).
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('load');
  }

  /**
   * Wait for network to be idle (no ongoing requests).
   */
  async waitForNetworkIdle() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for DOM content to be loaded.
   */
  async waitForDomContentLoaded() {
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Wait for a specific URL or URL pattern.
   * @param {string | RegExp} urlOrPattern
   * @param {number} [timeout=15000]
   */
  async waitForUrl(urlOrPattern, timeout = 15000) {
    await this.page.waitForURL(urlOrPattern, { timeout });
  }

  /**
   * Wait for a specific amount of time (use sparingly).
   * @param {number} ms - Milliseconds to wait
   */
  async wait(ms) {
    await this.page.waitForTimeout(ms);
  }

  /**
   * Wait for a network response matching the given URL pattern.
   * @param {string | RegExp} urlPattern
   * @param {number} [timeout=30000]
   * @returns {Promise<import('@playwright/test').Response>}
   */
  async waitForResponse(urlPattern, timeout = 30000) {
    return await this.page.waitForResponse(urlPattern, { timeout });
  }

  // ──────────────────────────────────────────────
  //  SCREENSHOTS & SCROLLING
  // ──────────────────────────────────────────────

  /**
   * Take a screenshot and save it.
   * @param {string} name - Screenshot file name (without extension)
   */
  async takeScreenshot(name) {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}.png`,
      fullPage: true,
    });
  }

  /**
   * Scroll to a specific element.
   * @param {string | import('@playwright/test').Locator} locator
   */
  async scrollToElement(locator) {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await element.scrollIntoViewIfNeeded();
  }

  /**
   * Scroll the page to the bottom.
   */
  async scrollToBottom() {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  }

  /**
   * Scroll the page to the top.
   */
  async scrollToTop() {
    await this.page.evaluate(() => window.scrollTo(0, 0));
  }

  // ──────────────────────────────────────────────
  //  KEYBOARD & MOUSE
  // ──────────────────────────────────────────────

  /**
   * Press a keyboard key.
   * @param {string} key - Key to press (e.g., 'Enter', 'Tab', 'Escape')
   */
  async pressKey(key) {
    await this.page.keyboard.press(key);
  }

  /**
   * Hover over an element.
   * @param {string | import('@playwright/test').Locator} locator
   */
  async hover(locator) {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await element.hover();
  }

  /**
   * Drag an element and drop it onto another.
   * @param {string | import('@playwright/test').Locator} source
   * @param {string | import('@playwright/test').Locator} target
   */
  async dragAndDrop(source, target) {
    const sourceEl = typeof source === 'string' ? this.page.locator(source) : source;
    const targetEl = typeof target === 'string' ? this.page.locator(target) : target;
    await sourceEl.dragTo(targetEl);
  }

  /**
   * Right-click on an element.
   * @param {string | import('@playwright/test').Locator} locator
   */
  async rightClick(locator) {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await element.click({ button: 'right' });
  }

  // ──────────────────────────────────────────────
  //  FRAMES & TABS
  // ──────────────────────────────────────────────

  /**
   * Switch to an iframe.
   * @param {string | import('@playwright/test').Locator} frameLocator - Frame selector
   * @returns {import('@playwright/test').FrameLocator}
   */
  switchToFrame(frameLocator) {
    return this.page.frameLocator(typeof frameLocator === 'string' ? frameLocator : 'iframe');
  }

  /**
   * Wait for a new tab/popup to open, perform an action, and return the new page.
   * @param {Function} triggerAction - Action that triggers the new tab
   * @returns {Promise<import('@playwright/test').Page>}
   */
  async switchToNewTab(triggerAction) {
    const [newPage] = await Promise.all([
      this.page.context().waitForEvent('page'),
      triggerAction(),
    ]);
    await newPage.waitForLoadState('domcontentloaded');
    return newPage;
  }

  // ──────────────────────────────────────────────
  //  DIALOGS
  // ──────────────────────────────────────────────

  /**
   * Accept a browser dialog (alert, confirm, prompt).
   * @param {string} [promptText] - Text to enter in a prompt dialog
   */
  async acceptDialog(promptText) {
    this.page.on('dialog', async (dialog) => {
      if (promptText) {
        await dialog.accept(promptText);
      } else {
        await dialog.accept();
      }
    });
  }

  /**
   * Dismiss a browser dialog.
   */
  async dismissDialog() {
    this.page.on('dialog', async (dialog) => {
      await dialog.dismiss();
    });
  }

  // ──────────────────────────────────────────────
  //  UTILITY
  // ──────────────────────────────────────────────

  /**
   * Execute JavaScript in the browser context.
   * @param {Function | string} script
   * @param {*} [arg] - Argument to pass to the script
   * @returns {Promise<*>}
   */
  async evaluate(script, arg) {
    return await this.page.evaluate(script, arg);
  }

  /**
   * Get all text content from the page.
   * @returns {Promise<string>}
   */
  async getPageText() {
    return await this.page.innerText('body');
  }

  /**
   * Store a value in the browser's local storage.
   * @param {string} key
   * @param {string} value
   */
  async setLocalStorage(key, value) {
    await this.page.evaluate(([k, v]) => localStorage.setItem(k, v), [key, value]);
  }

  /**
   * Get a value from local storage.
   * @param {string} key
   * @returns {Promise<string | null>}
   */
  async getLocalStorage(key) {
    return await this.page.evaluate((k) => localStorage.getItem(k), key);
  }

  /**
   * Clear all local storage.
   */
  async clearLocalStorage() {
    await this.page.evaluate(() => localStorage.clear());
  }
}
