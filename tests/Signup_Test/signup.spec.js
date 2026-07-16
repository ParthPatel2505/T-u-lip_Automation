/**
 * signup.spec.js
 * ============================================================
 * End-to-End and validation tests for the Tulip UAT Signup.
 * 
 * Verifies:
 *  - Form validation errors (names, email format, password strength, confirm password mismatch).
 *  - Successful signup E2E flow using a dynamically generated email and name with prefix 'Tuliptestdata'.
 *  - Email verification by launching Yopmail in a separate tab to read the activation link.
 *  - Successful login using the newly verified credentials.
 * ============================================================
 */
import { test, expect } from '../../fixtures/baseFixture.js';
import { LoginPage } from '../../pages/LoginPage.js';
import { YopmailPage } from '../../pages/Signup/YopmailPage.js';
import { generateTulipUser, generateRandomNumber } from '../../utils/helper.js';

test.describe('Signup Page — Negative Validations', () => {

  test('should display validation errors for empty fields and invalid inputs', async ({ signupPage, page }) => {
    // 1. Verify Register button is disabled initially
    const isBtnEnabled = await signupPage.isRegisterButtonEnabled();
    expect(isBtnEnabled).toBeFalsy();

    // 2. Validate First Name / Last Name alphabetic and length constraints
    // Try to enter a name with numbers
    await signupPage.fillSignupForm({ firstName: 'Tulip123', lastName: 'Doe!' }, false);
    // Click outside to trigger validation (e.g., focus email input)
    await signupPage.click(signupPage.emailInput);
    
    // Check validation error messages
    const errors = await signupPage.getValidationErrorMessages();
    expect(errors.length).toBeGreaterThan(0);
    
    // Clean fields and type too short names (< 3 chars)
    await signupPage.clear(signupPage.firstNameInput);
    await signupPage.clear(signupPage.lastNameInput);
    await signupPage.fillSignupForm({ firstName: 'Tu', lastName: 'Do' }, false);
    await signupPage.click(signupPage.emailInput);
    
    const errorsShort = await signupPage.getValidationErrorMessages();
    expect(errorsShort.length).toBeGreaterThan(0);

    // 3. Validate Invalid Email format
    await signupPage.fillSignupForm({ email: 'invalid_email_format' }, false);
    await signupPage.click(signupPage.passwordInput);
    
    const emailError = await signupPage.hasValidationError('Invalid email format');
    expect(emailError).toBeTruthy();

    // 4. Validate Password Strength (different characters & criteria)
    const weakPasswords = [
      'abc',             // Too short
      'password123',     // No uppercase, no special char
      'PASSWORD123!',    // No lowercase
      'Password!',       // No number
      'Password123'      // No special char
    ];

    for (const weakPwd of weakPasswords) {
      await signupPage.clear(signupPage.passwordInput);
      await signupPage.fillSignupForm({ password: weakPwd }, false);
      await signupPage.click(signupPage.confirmPasswordInput);
      
      const hasStrengthError = await signupPage.hasValidationError('Must be min 8 characters and contain 1 uppercase, 1 lowercase, 1 special character');
      expect(hasStrengthError).toBeTruthy();
    }

    // 5. Validate Password Mismatch
    await signupPage.clear(signupPage.passwordInput);
    await signupPage.fillSignupForm({ password: 'Password123!', confirmPassword: 'PasswordMismatch!' }, false);
    await signupPage.click(signupPage.firstNameInput);
    
    const hasMismatchError = await signupPage.hasValidationError('Password must match');
    expect(hasMismatchError).toBeTruthy();
  });
});

test.describe('Signup Page — Successful E2E Flow', () => {

  test('should register successfully, verify email via Yopmail, and log in', async ({ signupPage, context, page }) => {
    // Increase test timeout to 120s for E2E flow
    test.setTimeout(120000);

    // Generate a user with 'Tuliptest' prefix
    const user = generateTulipUser('Tuliptest');

    // 1. Fill the signup form and check terms
    await signupPage.fillSignupForm(user, true);

    // Verify register button is enabled
    const isEnabled = await signupPage.isRegisterButtonEnabled();
    expect(isEnabled).toBeTruthy();

    // 2. Submit signup form
    await signupPage.submitForm();

    // Check if redirect or message indicates registration success
    // Often there's a success modal or redirect to a page saying check your email.
    // We wait 5 seconds for backend to trigger the email dispatch.
    await page.waitForTimeout(5000);

    // 3. Open Yopmail in a new page/tab to read verification email
    const yopmailTab = await context.newPage();
    const yopmailPage = new YopmailPage(yopmailTab);
    
    await yopmailPage.goToInbox(user.email);
    const confirmLink = await yopmailPage.getVerificationLink(90000);
    
    // Close the Yopmail tab
    await yopmailTab.close();

    // 4. Navigate to verification link to confirm email address
    await signupPage.navigateToUrl(confirmLink);
    await signupPage.waitForDomContentLoaded();

    // Wait up to 10 seconds for automatic redirect to login page, or manually go to login
    const loginPage = new LoginPage(page);
    try {
      await page.waitForURL('**/login', { timeout: 10000 });
    } catch {
      await loginPage.goToLoginPage();
    }

    // 5. Login using newly created user email and password
    await loginPage.login(user.email, user.password);

    // 6. Verify redirection to Mentee Dashboard
    const isLoginSuccessful = await loginPage.isLoginSuccessful();
    expect(isLoginSuccessful).toBeTruthy();

    const isRedirected = await loginPage.isRedirectedAfterLogin(/.*dashboard/);
    expect(isRedirected).toBeTruthy();

    // Handle any site onboarding popup/tour if present
    try {
      const tourClose = page.locator('.ant-modal-close, button:has-text("Skip"), button:has-text("Close"), .ant-tour-close, button:has-text("Get Started")').first();
      if (await tourClose.isVisible({ timeout: 5000 })) {
        await tourClose.click();
        await page.waitForTimeout(1000);
      }
    } catch {
      // Ignore if not present
    }
  });
});
