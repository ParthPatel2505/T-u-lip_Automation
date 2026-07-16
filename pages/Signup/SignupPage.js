import { BasePage } from '../BasePage.js';
import { logStep, logAction, logValidation } from '../../utils/logger.js';

export class SignupPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);

    // ── Navigation / Landing Locators ───────────────────
    this.landingSignUpButton = page.locator('button:has-text("Sign Up"), a:has-text("Sign Up")').first();
    this.loginLink = page.locator('a[href*="/login"], a:has-text("Login")');
    this.homeLink = page.locator('a[href="/tix"]');

    // ── Signup Form Locators ────────────────────────────
    this.firstNameInput = page.locator('input[id="form.signup.first_name"]');
    this.lastNameInput = page.locator('input[id="form.signup.last_name"]');
    this.emailInput = page.locator('input[id="form.signup.email"]');
    this.passwordInput = page.locator('input[id="form.login.password"]');
    this.confirmPasswordInput = page.locator('input[id="form.signup.confirm_password"]');
    this.termsCheckbox = page.locator('input.ant-checkbox-input');
    this.registerButton = page.locator('button[type="submit"]:has-text("Register")');

    // ── Form Validation Errors ──────────────────────────
    this.formErrorMessages = page.locator('span.ant-typography-danger');
  }

  /**
   * Navigate to the Signup page by going to landing page and clicking Sign Up.
   */
  async goToSignupPage() {
    logStep('Navigating to Tulip landing page');
    await this.navigate('');
    await this.waitForPageLoad();
    
    // Attempt to dismiss any initial popup if exists
    await this.handleInitialPopups();

    logAction('Clicking Sign Up button on landing page');
    await this.waitForElement(this.landingSignUpButton);
    await this.click(this.landingSignUpButton);

    // Wait for the signup form to appear
    await this.waitForElement(this.firstNameInput);
    logValidation('Signup page loaded successfully');
  }

  /**
   * Fill out the signup form.
   * @param {object} user - User data object
   * @param {boolean} [checkTerms=true] - Whether to check the terms agreement checkbox
   */
  async fillSignupForm(user, checkTerms = true) {
    logStep(`Filling signup form for: ${user.email}`);

    if (user.firstName !== undefined) {
      logAction(`Filling first name: ${user.firstName}`);
      await this.fill(this.firstNameInput, user.firstName);
    }
    
    if (user.lastName !== undefined) {
      logAction(`Filling last name: ${user.lastName}`);
      await this.fill(this.lastNameInput, user.lastName);
    }

    if (user.email !== undefined) {
      logAction(`Filling email: ${user.email}`);
      await this.fill(this.emailInput, user.email);
    }

    if (user.password !== undefined) {
      logAction(`Filling password`);
      await this.fill(this.passwordInput, user.password);
    }

    if (user.confirmPassword !== undefined) {
      logAction(`Filling confirm password`);
      await this.fill(this.confirmPasswordInput, user.confirmPassword);
    } else if (user.password !== undefined) {
      logAction(`Filling matching confirm password`);
      await this.fill(this.confirmPasswordInput, user.password);
    }

    if (checkTerms) {
      logAction('Checking the terms agreement checkbox');
      const isAlreadyChecked = await this.isChecked(this.termsCheckbox);
      if (!isAlreadyChecked) {
        await this.click(this.termsCheckbox);
      }
    }
  }

  /**
   * Submit the signup form.
   */
  async submitForm() {
    logAction('Clicking Register button');
    await this.click(this.registerButton);
    await this.waitForDomContentLoaded();
  }

  /**
   * Check if Register button is enabled.
   * @returns {Promise<boolean>}
   */
  async isRegisterButtonEnabled() {
    return await this.isElementEnabled(this.registerButton);
  }

  /**
   * Get all active validation errors on the form.
   * @returns {Promise<string[]>}
   */
  async getValidationErrorMessages() {
    // Wait a brief moment for validations to register in the DOM
    await this.page.waitForTimeout(500);
    const count = await this.formErrorMessages.count();
    const errors = [];
    for (let i = 0; i < count; i++) {
      const text = await this.formErrorMessages.nth(i).innerText();
      const trimmed = text.trim();
      if (trimmed !== '*' && trimmed !== '') {
        errors.push(trimmed);
      }
    }
    return errors;
  }

  /**
   * Check if a specific validation error is displayed.
   * @param {string} expectedErrorText
   * @returns {Promise<boolean>}
   */
  async hasValidationError(expectedErrorText) {
    const errors = await this.getValidationErrorMessages();
    return errors.some(err => err.toLowerCase().includes(expectedErrorText.toLowerCase()));
  }

  /**
   * Helper to handle site popups / modals if any occur on landing or dashboard pages.
   */
  async handleInitialPopups() {
    try {
      const closeButton = this.page.locator('.ant-modal-close, button:has-text("Close"), button:has-text("OK"), .popup-close').first();
      if (await closeButton.isVisible({ timeout: 2000 })) {
        logAction('Dismissing site popup modal');
        await closeButton.click();
      }
    } catch {
      // Ignore if no popups are active
    }
  }
}
