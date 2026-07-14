/**
 * baseFixture.js
 * ============================================================
 * Extends Playwright's test with custom fixtures for the
 * Tulip automation framework.
 *
 * Provides:
 *  - loginPage: a LoginPage instance ready for use
 *  - authenticatedPage: a page already logged in (for tests
 *    that need auth as a precondition)
 * ============================================================
 */
import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';

/**
 * Custom test fixture extending Playwright's base test.
 */
export const test = base.extend({
  /**
   * Provides a LoginPage instance.
   * The page navigates to the login URL automatically.
   */
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goToLoginPage();
    await use(loginPage);
  },

  /**
   * Provides a page that is already authenticated.
   * Uses DEFAULT_USERNAME and DEFAULT_PASSWORD from .env.
   * Useful for tests that need login as a precondition.
   */
  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goToLoginPage();
    await loginPage.loginWithEnvCredentials();
    await use(page);
  },
});

export { expect } from '@playwright/test';
