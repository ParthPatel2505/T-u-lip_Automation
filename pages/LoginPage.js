/**
 * LoginPage.js
 * ============================================================
 * Page Object for the Tulip UAT Login Page.
 * Extends BasePage and provides login-specific methods.
 *
 * Login flow:
 *  1. Navigate to /tix/ (landing page)
 *  2. Click the "Login" button on the landing page header
 *  3. Fill email & password in the login form
 *  4. Click the "Login" submit button
 *
 * Supports dynamic credentials via:
 *  1. Direct username/password parameters
 *  2. Role-based users from data/users.json
 *  3. Environment variables (DEFAULT_USERNAME / DEFAULT_PASSWORD)
 * ============================================================
 */
import { BasePage } from './BasePage.js';
import { getUserByRole, getEnvVar } from '../utils/helper.js';
import { logStep, logAction, logValidation } from '../utils/logger.js';

export class LoginPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);

    // ── Landing Page Locators ─────────────────────
    // The "Login" button in the header that navigates to the login form
    this.landingLoginButton = page.getByRole('button', { name: 'Login', exact: true }).first();

    // ── Login Form Locators ──────────────────────
    // Email input: data-testid="email", id="form.login.email"
    this.emailInput = page.locator('input[data-testid="email"]');

    // Password input: data-testid="password", id="form.login.password"
    this.passwordInput = page.locator('input[data-testid="password"]');

    // Submit button: type="submit" with text "Login"
    this.signInButton = page.locator('button[type="submit"]:has-text("Login")');

    // Remember Me checkbox (Ant Design)
    this.rememberMeCheckbox = page.locator('input.ant-checkbox-input');

    // Error message — Ant Design alert/notification
    this.errorMessage = page.locator(
      '.ant-message-error, .ant-alert-error, .ant-notification-notice-error, .ant-form-item-explain-error, [role="alert"]'
    );

    // Forgot Password link
    this.forgotPasswordLink = page.locator('a:has-text("Forgot"), a:has-text("forgot")');

    // Google Sign-In (iframe)
    this.googleSignInFrame = page.frameLocator(
      'iframe[src*="accounts.google.com/gsi"]'
    );
  }

  // ──────────────────────────────────────────────
  //  ACTIONS
  // ──────────────────────────────────────────────

  /**
   * Navigate to the login page and open the login form.
   * The Tulip landing page has a "Login" button that reveals the form.
   */
  async goToLoginPage() {
    logStep('Navigating to Tulip landing page');
    await this.navigate('');
    await this.waitForPageLoad();
    logAction('Opened', this.getCurrentUrl());

    // Click the Login button on the landing page header
    logAction('Clicking Login button on landing page');
    await this.waitForElement(this.landingLoginButton);
    await this.click(this.landingLoginButton);

    // Wait for the login form to appear
    await this.waitForElement(this.emailInput);
    logValidation('Login form is now visible');
  }

  /**
   * Login with explicit username and password.
   * Assumes the login form is already visible (goToLoginPage was called).
   * @param {string} username
   * @param {string} password
   */
  async login(username, password) {
    logStep(`Logging in as: ${username}`);

    logAction('Filling email');
    await this.waitForElement(this.emailInput);
    await this.fill(this.emailInput, username);

    logAction('Filling password');
    await this.fill(this.passwordInput, password);

    logAction('Clicking Login submit button');
    await this.click(this.signInButton);

    // Wait for page to process the login (don't use networkidle — app has persistent connections)
    await this.waitForDomContentLoaded();
    logValidation('Login form submitted');
  }

  /**
   * Login using a role defined in data/users.json.
   * Example roles: 'admin', 'default', 'member', 'viewer'
   * @param {string} role
   */
  async loginAsUser(role) {
    logStep(`Logging in as role: "${role}"`);
    const user = getUserByRole(role);
    await this.login(user.username, user.password);
  }

  /**
   * Login using environment variables (DEFAULT_USERNAME, DEFAULT_PASSWORD).
   * Useful for CI/CD pipelines where credentials are injected.
   */
  async loginWithEnvCredentials() {
    const username = getEnvVar('DEFAULT_USERNAME');
    const password = getEnvVar('DEFAULT_PASSWORD');
    await this.login(username, password);
  }

  // ──────────────────────────────────────────────
  //  VALIDATIONS
  // ──────────────────────────────────────────────

  /**
   * Check if the login form is displayed (email input is visible).
   * @returns {Promise<boolean>}
   */
  async isLoginFormDisplayed() {
    return await this.isElementVisible(this.emailInput);
  }

  /**
   * Check if the landing page Login button is displayed.
   * @returns {Promise<boolean>}
   */
  async isLandingPageDisplayed() {
    return await this.isElementVisible(this.landingLoginButton);
  }

  /**
   * Get the error message text after a failed login.
   * @returns {Promise<string>}
   */
  async getErrorMessage() {
    await this.waitForElement(this.errorMessage, 10000);
    return await this.getElementText(this.errorMessage);
  }

  /**
   * Check if an error message is displayed.
   * @returns {Promise<boolean>}
   */
  async isErrorMessageDisplayed() {
    return await this.isElementVisible(this.errorMessage, 5000);
  }

  /**
   * Check if the sign-in button is enabled.
   * @returns {Promise<boolean>}
   */
  async isSignInButtonEnabled() {
    return await this.isElementEnabled(this.signInButton);
  }

  /**
   * Verify that the user has been redirected away from the login page
   * (i.e., login was successful).
   * Checks that the login email input is no longer visible.
   * @returns {Promise<boolean>}
   */
  async isLoginSuccessful() {
    try {
      // After successful login, the login form should disappear
      await this.waitForElementToDisappear(this.emailInput, 20000);
      logValidation('Login successful — login form is no longer visible');
      return true;
    } catch {
      // Fallback: check if URL changed from the login/landing page
      try {
        const currentUrl = this.getCurrentUrl();
        const baseUrl = process.env.BASE_URL || 'https://tulip-uat.tntra.io/tix/';
        if (currentUrl !== baseUrl && currentUrl !== baseUrl.replace(/\/$/, '')) {
          logValidation(`Login successful — URL changed to: ${currentUrl}`);
          return true;
        }
      } catch { /* ignore */ }
      return false;
    }
  }

  /**
   * Verify user is redirected to a specific page after login.
   * @param {string | RegExp} [expectedUrlPattern] - Expected URL pattern after login
   * @returns {Promise<boolean>}
   */
  async isRedirectedAfterLogin(expectedUrlPattern) {
    try {
      if (expectedUrlPattern) {
        await this.waitForUrl(expectedUrlPattern, 15000);
      } else {
        await this.page.waitForURL('**/dashboard**', { timeout: 15000 });
      }
      return true;
    } catch {
      return false;
    }
  }

  // ──────────────────────────────────────────────
  //  HELPERS
  // ──────────────────────────────────────────────

  /**
   * Click the "Forgot Password" link if present.
   */
  async clickForgotPassword() {
    logAction('Clicking Forgot Password link');
    await this.click(this.forgotPasswordLink);
  }

  /**
   * Toggle the "Remember Me" checkbox.
   * @param {boolean} checked
   */
  async setRememberMe(checked) {
    if (checked) {
      await this.check(this.rememberMeCheckbox);
    } else {
      await this.uncheck(this.rememberMeCheckbox);
    }
  }

  /**
   * Clear all login form fields.
   */
  async clearLoginForm() {
    await this.clear(this.emailInput);
    await this.clear(this.passwordInput);
  }
}
