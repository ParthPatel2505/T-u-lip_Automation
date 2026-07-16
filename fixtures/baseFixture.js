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
import { SignupPage } from '../pages/Signup/SignupPage.js';
import { YopmailPage } from '../pages/Signup/YopmailPage.js';
import { TulipDashboardPage } from '../pages/Main/TulipDashboardPage.js';


/**
 * Custom test fixture extending Playwright's base test.
 */
export const test = base.extend({
  /**
   * Extend browser context to inject stealth scripts (hiding webdriver flag) into all tabs.
   */
  context: async ({ context }, use) => {
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });
    await use(context);
  },

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
   * Provides a SignupPage instance.
   * The page navigates to the signup URL automatically.
   */
  signupPage: async ({ page }, use) => {
    const signupPage = new SignupPage(page);
    await signupPage.goToSignupPage();
    await use(signupPage);
  },

  /**
   * Provides a YopmailPage instance.
   */
  yopmailPage: async ({ page }, use) => {
    const yopmailPage = new YopmailPage(page);
    await use(yopmailPage);
  },

  /**
   * Provides a TulipDashboardPage instance.
   */
  tulipDashboardPage: async ({ page }, use) => {
    const tulipDashboardPage = new TulipDashboardPage(page);
    await use(tulipDashboardPage);
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

