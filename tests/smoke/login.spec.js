/**
 * login.spec.js
 * ============================================================
 * Smoke tests for the Tulip UAT Login functionality.
 *
 * Login flow:
 *  1. Navigate to /tix/ (landing page)
 *  2. Click "Login" button → login form appears
 *  3. Fill email + password → click Login submit
 *
 * These tests verify:
 *  - Login form loads correctly after clicking Login on landing
 *  - Successful login with default credentials
 *  - Successful login using role-based credentials
 *  - Failed login with invalid credentials
 *  - Login form validations
 * ============================================================
 */
import { test, expect } from "../../fixtures/baseFixture.js";

test.describe('Login Page — Smoke Tests', () => {
  /**
   * Verify that the login form loads after clicking Login on the landing page,
   * and all expected form elements are visible.
   */
  test('should display login form with all elements', async ({ loginPage }) => {
    // Verify the login form is displayed (email input visible)
    const isFormDisplayed = await loginPage.isLoginFormDisplayed();
    expect(isFormDisplayed).toBeTruthy();

    // Verify email input is visible
    const emailVisible = await loginPage.isElementVisible(loginPage.emailInput);
    expect(emailVisible).toBeTruthy();

    // Verify password input is visible
    const passwordVisible = await loginPage.isElementVisible(loginPage.passwordInput);
    expect(passwordVisible).toBeTruthy();

    // Verify submit button is visible
    const signInVisible = await loginPage.isElementVisible(loginPage.signInButton);
    expect(signInVisible).toBeTruthy();

    // Verify remember me checkbox is visible
    const rememberMeVisible = await loginPage.isElementVisible(loginPage.rememberMeCheckbox);
    expect(rememberMeVisible).toBeTruthy();
  });

  /**
   * Verify successful login using credentials from .env file.
   * Each team member can set their own credentials in .env.
   */
  test('should login successfully with environment credentials', async ({ loginPage }) => {
    // Login using credentials from .env
    await loginPage.loginWithEnvCredentials();

    // Verify login was successful (URL changes to dashboard)
    const isSuccessful = await loginPage.isLoginSuccessful();
    expect(isSuccessful).toBeTruthy();
  });

  /**
   * Verify successful login using a specific user role from data/users.json.
   * This demonstrates dynamic, role-based login.
   */
  test('should login successfully as admin user', async ({ loginPage }) => {
    // Login as 'admin' role from data/users.json
    await loginPage.loginAsUser('admin');

    // Verify login was successful
    const isSuccessful = await loginPage.isLoginSuccessful();
    expect(isSuccessful).toBeTruthy();
  });

  /**
   * Verify successful login using the 'default' role.
   */
  test('should login successfully as default user', async ({ loginPage }) => {
    // Login as 'default' role
    await loginPage.loginAsUser('default');

    // Verify login was successful
    const isSuccessful = await loginPage.isLoginSuccessful();
    expect(isSuccessful).toBeTruthy();
  });

  /**
   * Verify that login fails with invalid credentials and
   * an appropriate error message is displayed.
   */
  test('should show error with invalid credentials', async ({ loginPage }) => {
    // Attempt login with invalid credentials
    await loginPage.login('invalid@test.com', 'WrongPassword123');

    // Verify error message is displayed
    const hasError = await loginPage.isErrorMessageDisplayed();
    expect(hasError).toBeTruthy();
  });

  /**
   * Verify that login fails when password field is left empty.
   */
  test('should not login with empty password', async ({ loginPage }) => {
    // Fill only the email field
    await loginPage.fill(
      loginPage.emailInput,
      process.env.DEFAULT_USERNAME || 'nensi.bhavsar@tntra.io'
    );

    // Click the sign-in button without entering password
    await loginPage.click(loginPage.signInButton);

    // The user should still see the login form (not redirected)
    const isFormStillVisible = await loginPage.isLoginFormDisplayed();
    expect(isFormStillVisible).toBeTruthy();
  });

  /**
   * Verify that login fails when email field is left empty.
   */
  test('should not login with empty email', async ({ loginPage }) => {
    // Fill only the password field
    await loginPage.fill(loginPage.passwordInput, 'Test@123');

    // Click the sign-in button without entering email
    await loginPage.click(loginPage.signInButton);

    // The user should still see the login form (not redirected)
    const isFormStillVisible = await loginPage.isLoginFormDisplayed();
    expect(isFormStillVisible).toBeTruthy();
  });
});

test.describe('Login Page — Dynamic User Login', () => {
  /**
   * Parameterized test: Login with explicit credentials.
   * Team members can pass their own credentials directly.
   */
  test('should login with explicit credentials', async ({ loginPage }) => {
    const username = process.env.DEFAULT_USERNAME || 'nensi.bhavsar@tntra.io';
    const password = process.env.DEFAULT_PASSWORD || 'Test@123';

    await loginPage.login(username, password);

    const isSuccessful = await loginPage.isLoginSuccessful();
    expect(isSuccessful).toBeTruthy();
  });
});
