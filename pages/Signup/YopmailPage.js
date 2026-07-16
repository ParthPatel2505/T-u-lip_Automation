import { BasePage } from '../BasePage.js';
import { logStep, logAction, logValidation } from '../../utils/logger.js';

export class YopmailPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.refreshButton = page.locator('#refresh');
    // Frame locator for the email body iframe
    this.mailFrame = page.frameLocator('#ifmail');
    // Selector inside the iframe
    this.confirmLink = this.mailFrame.locator('a[href*="confirm-email"]');
  }

  /**
   * Navigate to Yopmail inbox for a specific email address.
   * Extracts the username part if a full email address is passed.
   * @param {string} emailOrUser
   */
  async goToInbox(emailOrUser) {
    const username = emailOrUser.includes('@') ? emailOrUser.split('@')[0] : emailOrUser;
    
    // We will try multiple Yopmail domains in case one is heavily throttled or protected by Cloudflare
    const domains = ['yopmail.com', 'yopmail.net', 'yopmail.fr'];
    let success = false;
    let lastError = null;

    for (const domain of domains) {
      try {
        const inboxUrl = `https://${domain}/?${username}`;
        logStep(`Navigating directly to Yopmail inbox on ${domain}: ${inboxUrl}`);
        await this.navigateToUrl(inboxUrl);
        await this.waitForPageLoad();
        
        await this.handleConsent();
        await this.handleCaptchas();
        
        // Wait up to 5 seconds to verify if the refresh button of the inbox list is visible
        if (await this.refreshButton.isVisible({ timeout: 5000 })) {
          logValidation(`Successfully loaded Yopmail inbox on ${domain}`);
          success = true;
          break;
        }
      } catch (err) {
        logAction(`Failed to load Yopmail on ${domain}. Trying next domain...`);
        lastError = err;
      }
    }

    if (!success) {
      throw new Error(`Failed to load Yopmail inbox on any domain. Last error: ${lastError?.message}`);
    }
  }

  /**
   * Periodically check and refresh the inbox until the confirmation link is found.
   * @param {number} [timeoutMs=60000]
   * @returns {Promise<string>} Verification URL
   */
  async getVerificationLink(timeoutMs = 60000) {
    logStep('Waiting for verification email to arrive in Yopmail...');
    const startTime = Date.now();

    const inboxFrame = this.page.frameLocator('#ifinbox');
    const firstMail = inboxFrame.locator('a.lm, .m').first();

    while (Date.now() - startTime < timeoutMs) {
      try {
        // Handle any bot challenges that might block list loading
        await this.handleCaptchas();

        // 1. Check if there are messages in the list iframe (#ifinbox) and click the first one if visible
        if (await firstMail.isVisible({ timeout: 2000 })) {
          logAction('Mail item found in list iframe. Clicking to open...');
          await firstMail.click();
          await this.page.waitForTimeout(2000);
        }

        // 2. Check if the link exists in the content iframe (#ifmail)
        if (await this.confirmLink.isVisible({ timeout: 2000 })) {
          const href = await this.confirmLink.getAttribute('href');
          if (href) {
            logValidation(`Verification link retrieved successfully: ${href}`);
            return href;
          }
        }
      } catch (err) {
        // Frame might be reloading or detached, ignore and retry
      }

      // Refresh inbox
      logAction('Verification email not found. Refreshing inbox...');
      try {
        if (await this.refreshButton.isVisible()) {
          await this.refreshButton.click();
        } else {
          await this.page.reload();
          await this.handleConsent();
          await this.handleCaptchas();
        }
      } catch {
        // Fallback reload if click fails
        await this.page.reload();
        await this.handleConsent();
        await this.handleCaptchas();
      }

      // Wait a short delay before next check
      await this.page.waitForTimeout(4000);
    }

    throw new Error(`Verification email did not arrive at Yopmail within ${timeoutMs / 1000}s`);
  }

  /**
   * Handle GDPR consent overlays on Yopmail.
   */
  async handleConsent() {
    try {
      const consentButton = this.page.locator('button.fc-button-consent, button:has-text("Consent"), button:has-text("AGREE")').first();
      if (await consentButton.isVisible({ timeout: 2000 })) {
        logAction('GDPR consent overlay found on Yopmail. Dismissing it.');
        await consentButton.click();
      }
    } catch {
      // Ignore errors
    }
  }

  /**
   * Detect and handle bot challenges (Cloudflare Turnstile or Google reCAPTCHA checkboxes).
   */
  async handleCaptchas() {
    try {
      // 1. Cloudflare Turnstile Checkbox
      const frames = this.page.frames();
      const cfFrame = frames.find(f => f.url().includes('challenges.cloudflare.com'));
      if (cfFrame) {
        const cfCheckbox = cfFrame.locator('input[type="checkbox"], .ctp-checkbox-label, #challenge-stage input').first();
        if (await cfCheckbox.isVisible({ timeout: 2000 })) {
          logAction('Cloudflare Turnstile robot check detected. Clicking checkbox...');
          await cfCheckbox.click({ force: true });
          await this.page.waitForTimeout(2000);
        }
      }
    } catch {
      // Ignore Cloudflare handling errors
    }

    try {
      // 2. Google reCAPTCHA Checkbox
      const frames = this.page.frames();
      const recaptchaFrame = frames.find(f => f.url().includes('recaptcha'));
      if (recaptchaFrame) {
        const recaptchaCheckbox = recaptchaFrame.locator('#recaptcha-anchor, .recaptcha-checkbox-border').first();
        if (await recaptchaCheckbox.isVisible({ timeout: 2000 })) {
          logAction('reCAPTCHA robot check detected. Clicking checkbox...');
          await recaptchaCheckbox.click({ force: true });
          await this.page.waitForTimeout(2000);
        }
      }
    } catch {
      // Ignore reCAPTCHA handling errors
    }
  }
}
