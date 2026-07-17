import { BasePage } from "../../BasePage.js";
import { logStep, logAction, logValidation } from "../../../utils/logger.js";

/**
 * IdeaPage Page Object.
 * Extends BasePage and provides locators and actions for the Idea Form.
 */
export class Add_Idea_Page extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page - Playwright page instance
   */
  constructor(page) {
    super(page);

    // ── Navigation & Sidebar Locators ──────────────────
    // Sidebar toggle button (usually first icon button in header)
    this.sidebarMenu = page.locator("(//span[@class='ant-btn-icon'])[1]");

    // Automation Acceleration expander link in sidebar
    this.automationAcceleration = page.locator("//span[normalize-space()='Automation Acceleration']");

    // Idea link under Automation Acceleration
    this.ideaMenuLink = page.locator("(//a[normalize-space()='Idea'])[1]");

    // Add Idea button on the top right of Idea list page
    this.addIdeaButton = page.locator("(//span[@class='ant-btn-icon'])[7]");

    // ── Form Card & Structural Locators ───────────────
    // Form Container Card
    this.addIdeaFormCard = page.locator('div.ant-card', { hasText: 'Add Idea Details' });

    // ── Form I nput Fields ──────────────────────────────
    // Idea Title input box
    this.ideaTitleInput = page.locator("input#newIdea\\.ideaTitleLabel");

    // Visibility options (Radio labels for clicking, inputs for status check)
    this.publicVisibilityLabel = page.locator('label.ant-radio-wrapper:has-text("Public")');
    this.privateVisibilityLabel = page.locator('label.ant-radio-wrapper:has-text("Private")');
    this.publicVisibilityRadio = page.locator('input[type="radio"][value="0"]');
    this.privateVisibilityRadio = page.locator('input[type="radio"][value="1"]');

    // Collaborators search trigger and selector elements
    this.collaboratorsDropdown = page.locator('.ant-select[name="ideaCollaborationDtos"] .ant-select-selector');
    this.collaboratorSearchInput = page.locator('.ant-select[name="ideaCollaborationDtos"] input.ant-select-selection-search-input');
    this.collaboratorsClearButton = page.locator('.ant-select[name="ideaCollaborationDtos"] .ant-select-clear');

    // Idea Description field (Jodit WYSIWYG editor body)
    this.ideaDescriptionEditor = page.locator("div.jodit-wysiwyg");

    // Attachment file drag-drop area and invisible file input
    this.attachmentUploadArea = page.locator("div.ant-upload-drag");
    this.fileInput = page.locator('input[type="file"]');

    // ── Form Actions (Buttons) ───────────────────────
    // Cancel, Reset, and Save/Submit buttons
    this.cancelButton = page.locator('button').filter({ hasText: 'Cancel' });
    this.resetButton = page.locator('button').filter({ hasText: 'Reset' });
    this.saveButton = page.locator("button[type='submit']");

    // ── Form validation elements ─────────────────────
    // Title validation message ("Please enter the Title.")
    this.titleValidationError = page.locator('div.form-field:has(input[id="newIdea.ideaTitleLabel"]) span.ant-typography-danger').filter({ hasText: 'Please enter' });

    // Description validation message ("Please enter the Description.")
    this.descriptionValidationError = page.locator('div.form-field:has(.jodit-react-container) span.ant-typography-danger').filter({ hasText: 'Please enter' });

    // Ant Design / Hot Toast notifications for file validation errors
    this.toastMessage = page.locator('[role="status"]');
  }

  // ──────────────────────────────────────────────
  //  NAVIGATION ACTIONS
  // ──────────────────────────────────────────────

  /**
   * Open the sidebar menu navigation.
   */
  async openSidebarMenu() {
    logStep("Opening sidebar menu");
    await this.waitForElement(this.sidebarMenu);
    await this.click(this.sidebarMenu);
    logValidation("Sidebar menu opened");
  }

  /**
   * Click the Automation Acceleration item in the sidebar menu.
   */
  async clickAutomationAcceleration() {
    logStep("Clicking Automation Acceleration in sidebar");
    await this.waitForElement(this.automationAcceleration);
    await this.click(this.automationAcceleration);
    logValidation("Automation Acceleration expanded");
  }

  /**
   * Click the Idea menu item to navigate to the Idea board/list.
   */
  async clickIdeaMenuLink() {
    logStep("Clicking Idea sub-menu option");
    await this.waitForElement(this.ideaMenuLink);
    await this.click(this.ideaMenuLink);
    logValidation("Idea listing page loaded");
  }

  /**
   * Navigate to the Idea listing page using the sidebar menu.
   */
  async navigateToIdeaPage() {
    logStep("Navigating to Idea listing page");
    await this.openSidebarMenu();
    await this.clickAutomationAcceleration();
    await this.clickIdeaMenuLink();
    await this.waitForPageLoad();
  }

  /**
   * Click the "Add Idea" button to open the form.
   */
  async clickAddIdea() {
    logStep("Clicking Add Idea button");
    await this.waitForElement(this.addIdeaButton);
    await this.click(this.addIdeaButton);
    await this.waitForPageLoad();
    logValidation("Add Idea Form loaded");
  }

  // ──────────────────────────────────────────────
  //  FORM INPUT ACTIONS
  // ──────────────────────────────────────────────

  /**
   * Enter the Idea Title in the input box.
   * If an empty string is provided, clears the input.
   * @param {string} title
   */
  async fillIdeaTitle(title) {
    logStep(`Filling Idea Title: "${title}"`);
    await this.waitForElement(this.ideaTitleInput);
    if (title === "") {
      await this.clear(this.ideaTitleInput);
      logAction("Cleared Idea Title field");
    } else {
      await this.fill(this.ideaTitleInput, title);
      logAction("Filled Idea Title field");
    }
  }

  /**
   * Select Visibility (Public or Private).
   * @param {'Public' | 'Private'} visibilityType
   */
  async setVisibility(visibilityType) {
    logStep(`Setting visibility option to: "${visibilityType}"`);
    if (visibilityType === 'Public') {
      await this.click(this.publicVisibilityLabel);
    } else if (visibilityType === 'Private') {
      await this.click(this.privateVisibilityLabel);
    } else {
      throw new Error(`Invalid visibility type specified: ${visibilityType}`);
    }
    logAction(`Visibility option toggled to ${visibilityType}`);
  }

  /**
   * Select one or multiple collaborators from the dropdown.
   * @param {string | string[]} collaboratorNames
   */
  async selectCollaborators(collaboratorNames) {
    const names = Array.isArray(collaboratorNames) ? collaboratorNames : [collaboratorNames];
    logStep(`Selecting collaborators: ${names.join(', ')}`);
    await this.waitForElement(this.collaboratorsDropdown);

    for (const name of names) {
      logAction(`Opening collaborators dropdown and searching for: "${name}"`);
      await this.click(this.collaboratorsDropdown);
      await this.page.waitForTimeout(300); // Wait briefly for search box focus
      await this.collaboratorSearchInput.fill(name);
      await this.page.waitForTimeout(500); // Wait for results to filter

      // Check if option is visible in Ant Design dropdown overlay
      const optionLocator = this.page.locator(`.ant-select-dropdown .ant-select-item-option-content`, { hasText: name }).first();
      if (await optionLocator.isVisible({ timeout: 2000 })) {
        await optionLocator.click();
        logAction(`Selected collaborator "${name}" from dropdown list`);
      } else {
        // Fallback: press Enter if direct click is unavailable
        await this.page.keyboard.press("Enter");
        logAction(`Pressed Enter to select collaborator for "${name}"`);
      }
    }
    logValidation("Collaborators selection completed");
  }

  /**
   * Clear all selected collaborators.
   */
  async clearCollaborators() {
    logStep("Clearing all selected collaborators");
    const isVisible = await this.isElementVisible(this.collaboratorsClearButton, 2000);
    if (isVisible) {
      await this.click(this.collaboratorsClearButton);
      logAction("Clicked clear collaborators button");
    } else {
      logAction("No clear button found. Collaborators list is already empty.");
    }
  }

  /**
   * Enter the Idea Description in the Jodit WYSIWYG editor.
   * If an empty string is provided, clears the editor.
   * @param {string} desc
   */
  async fillIdeaDescription(desc) {
    logStep(`Filling Idea Description: "${desc}"`);
    await this.waitForElement(this.ideaDescriptionEditor);
    if (desc === "") {
      await this.clear(this.ideaDescriptionEditor);
      logAction("Cleared Idea Description field");
    } else {
      await this.fill(this.ideaDescriptionEditor, desc);
      logAction("Filled Idea Description field");
    }
  }

  /**
   * Upload an attachment file to the Idea form.
   * @param {string} absoluteFilePath
   */
  async uploadAttachment(absoluteFilePath) {
    logStep(`Uploading attachment file: "${absoluteFilePath}"`);
    await this.waitForElement(this.attachmentUploadArea);
    await this.page.waitForTimeout(1000); // Wait for upload event handlers to be fully bound
    await this.fileInput.setInputFiles(absoluteFilePath);
    logAction("File selected for upload");
  }

  // ──────────────────────────────────────────────
  //  FORM BUTTON ACTIONS
  // ──────────────────────────────────────────────

  /**
   * Click the "Save" (Submit) button.
   */
  async clickSave() {
    logStep("Clicking Save button");
    await this.waitForElement(this.saveButton);
    await this.click(this.saveButton);
    logAction("Save button clicked");
  }

  /**
   * Click the "Reset" button to clear form fields.
   */
  async clickReset() {
    logStep("Clicking Reset button");
    await this.waitForElement(this.resetButton);
    await this.click(this.resetButton);
    logAction("Reset button clicked");
  }

  /**
   * Click the "Cancel" button.
   */
  async clickCancel() {
    logStep("Clicking Cancel button");
    await this.waitForElement(this.cancelButton);
    await this.click(this.cancelButton);
    logAction("Cancel button clicked");
  }

  // ──────────────────────────────────────────────
  //  VALIDATIONS & STATUS GETTERS
  // ──────────────────────────────────────────────

  /**
   * Check if the Add Idea form container is displayed.
   * @returns {Promise<boolean>}
   */
  async isAddIdeaFormDisplayed() {
    return await this.isElementVisible(this.addIdeaFormCard);
  }

  /**
   * Check if the Title validation error message is visible.
   * @returns {Promise<boolean>}
   */
  async isTitleErrorDisplayed() {
    return await this.isElementVisible(this.titleValidationError, 3000);
  }

  /**
   * Get the Title validation error message text.
   * @returns {Promise<string>}
   */
  async getTitleErrorMessage() {
    await this.waitForElement(this.titleValidationError, 3000);
    return await this.getElementText(this.titleValidationError);
  }

  /**
   * Check if the Description validation error message is visible.
   * @returns {Promise<boolean>}
   */
  async isDescriptionErrorDisplayed() {
    return await this.isElementVisible(this.descriptionValidationError, 3000);
  }

  /**
   * Get the Description validation error message text.
   * @returns {Promise<string>}
   */
  async getDescriptionErrorMessage() {
    await this.waitForElement(this.descriptionValidationError, 3000);
    return await this.getElementText(this.descriptionValidationError);
  }

  /**
   * Check if a toast notice message is visible.
   * @returns {Promise<boolean>}
   */
  async isToastDisplayed() {
    return await this.isElementVisible(this.toastMessage, 4000);
  }

  /**
   * Get the toast message banner text.
   * @returns {Promise<string>}
   */
  async getToastMessage() {
    await this.waitForElement(this.toastMessage, 4000);
    return await this.getElementText(this.toastMessage);
  }
}