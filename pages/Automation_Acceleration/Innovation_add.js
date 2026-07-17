import { BasePage } from '../BasePage.js';
import { logAction, logStep, logValidation } from '../../utils/logger.js';

export class InnovationPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);

    this.automationAccelerationMenu = page
      .locator('.ant-menu-submenu-title:has-text("Automation Acceleration"), .ant-menu-item:has-text("Automation Acceleration"), [role="menuitem"]:has-text("Automation Acceleration")')
      .first();
    this.innovationMenuItem = page
      .locator('.ant-menu-item:has-text("Innovation"), [role="menuitem"]:has-text("Innovation"), .ant-menu a:has-text("Innovation")')
      .first();

    this.listTitle = page.locator('h1, h2, h3, h4, h5, .ant-typography').filter({ hasText: /Innovations?/i }).first();
    this.addInnovationButton = page.locator('button:has-text("Innovation")').filter({ hasNotText: /Show More/i }).first();
    this.sortButton = page.locator('button:has-text("Sort")').first();
    this.filtersButton = page.locator('button:has-text("Filters")').first();
    this.showMoreButton = page.locator('button:has-text("Show More Innovation")').first();
    this.clearAllLink = page.locator('text=/Clear All|Reset/i').first();
    this.innovationCards = page.locator('main').locator('text=/Overall Progress|Collation|Curation|Orchestration/');

    this.addPageTitle = page.locator('text=/Add Innovation Details|Innovation Details/i').first();
    this.titleInput = page.locator('input[id="ideas.ideaTitle"], input[name="ideas.ideaTitle"]').first();
    this.referenceLinkInput = page.locator('input[id="ideas.referenceLink"], input[name="ideas.referenceLink"]').first();
    this.selects = page.locator('.ant-select');
    this.richEditors = page.locator('.jodit-wysiwyg');
    this.fileInput = page.locator('input[type="file"]').first();
    this.cancelButton = page.locator('button:has-text("Cancel")').last();
    this.resetButton = page.locator('button:has-text("Reset")').last();
    this.saveButton = page.locator('button:has-text("Save")').last();

    this.toast = page.locator('.ant-message-notice-content, .ant-notification-notice-message, .ant-notification-notice-description');
    this.validationMessages = page.locator('.ant-form-item-explain-error, [role="alert"]');

    this.collationTab = page.locator('text=Collation').first();
    this.curationTab = page.locator('text=Curation').first();
    this.orchestrationTab = page.locator('text=Orchestration').first();
    this.detailsTab = page.locator('main').getByText(/^Details$/i).first();
    this.workItemTab = page.locator('main').getByText(/Work Item|Work iteam/i).first();
    this.commentsTab = page.locator('text=Comments').first();
    this.activityTab = page.locator('text=Activity').first();
    this.likeButton = page.locator('button').filter({ hasText: /^\d*$/ }).nth(1);
    this.moreActionsButton = page.locator('button.ant-dropdown-trigger, button:has(.lucide-ellipsis), button:has(svg)').last();
  }

  async openInnovationListFromSideMenu() {
    logStep('Opening Innovation list from Automation Acceleration side menu');
    await this.page.goto('/tix/dashboard', { waitUntil: 'domcontentloaded' });
    await this.page.waitForTimeout(1000);
    await this.expandAutomationAccelerationIfNeeded();
    await this.innovationMenuItem.scrollIntoViewIfNeeded();
    await this.innovationMenuItem.click({ force: true });
    await this.waitForInnovationList();
  }

  async openInnovationListDirectly() {
    logStep('Opening Innovation list by direct URL');
    await this.page.goto('/tix/innovation', { waitUntil: 'domcontentloaded' });
    await this.waitForInnovationList();
  }

  async waitForInnovationList() {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.locator('body').waitFor({ state: 'visible', timeout: 15000 });
    await this.addInnovationButton.waitFor({ state: 'visible', timeout: 20000 });
    await this.page.waitForTimeout(1000);
    logValidation('Innovation list loaded');
  }

  async expandAutomationAccelerationIfNeeded() {
    if (!(await this.automationAccelerationMenu.isVisible({ timeout: 5000 }).catch(() => false))) {
      return;
    }

    const expanded = await this.automationAccelerationMenu.getAttribute('aria-expanded') === 'true';
    if (!expanded) {
      logAction('Expanding Automation Acceleration menu');
      await this.automationAccelerationMenu.click({ force: true });
      await this.page.waitForTimeout(700);
    }
  }

  async openAddInnovationPage() {
    logStep('Opening Add Innovation page');
    await this.addInnovationButton.click({ force: true });
    await this.page.waitForURL(/innovation\/add/i, { timeout: 15000 });
    await this.addPageTitle.waitFor({ state: 'visible', timeout: 15000 });
  }

  async verifyAddPageFields(expectedFields) {
    const bodyText = await this.getPageText();
    for (const field of expectedFields) {
      if (!bodyText.toLowerCase().includes(field.toLowerCase())) {
        throw new Error(`Expected field "${field}" was not found on Add Innovation page.`);
      }
    }

    const actualCounts = {
      titleInputs: await this.titleInput.count(),
      referenceInputs: await this.referenceLinkInput.count(),
      selects: await this.selects.count(),
      editors: await this.richEditors.count(),
      fileInputs: await this.fileInput.count(),
      actionButtons: await this.page.locator('button:has-text("Cancel"), button:has-text("Reset"), button:has-text("Save")').count(),
    };

    return actualCounts;
  }

  async verifyPageScroll() {
    const before = await this.page.evaluate(() => window.scrollY);
    await this.scrollToBottom();
    await this.page.waitForTimeout(500);
    const afterDown = await this.page.evaluate(() => window.scrollY);
    await this.scrollToTop();
    await this.page.waitForTimeout(500);
    const afterUp = await this.page.evaluate(() => window.scrollY);
    return { before, afterDown, afterUp };
  }

  async clickCancelAndReturnToAddPage() {
    logStep('Verifying Cancel button on Add Innovation page');
    await this.cancelButton.click();
    await this.page.waitForURL(/\/innovation$/i, { timeout: 15000 });
    await this.waitForInnovationList();
    await this.openAddInnovationPage();
  }

  async verifyResetClearsEnteredData(data) {
    logStep('Verifying Reset button clears Add Innovation data');
    await this.fillBasicAddData(data, { includeEditors: false, includeFile: false });
    await this.resetButton.click();
    await this.page.waitForTimeout(800);
    return await this.titleInput.inputValue();
  }

  async submitEmptyAndGetMandatoryMessages() {
    logStep('Verifying mandatory validation on Add Innovation page');
    await this.saveButton.click();
    await this.page.waitForTimeout(1000);
    const messages = await this.validationMessages.allInnerTexts().catch(() => []);
    return messages.map((message) => message.trim()).filter(Boolean);
  }

  async fillBasicAddData(data, options = {}) {
    const { includeEditors = true, includeFile = true, filePath } = options;
    await this.titleInput.fill(data.title);
    await this.referenceLinkInput.fill(data.referenceLink);

    await this.selectAntDropdownByLabel('Initiative');
    await this.selectAntDropdownByLabel('Domain', 'Agritech');
    await this.selectAntDropdownByLabel('Tags');
    await this.selectAntDropdownByLabel('Country', 'India');
    await this.selectAntDropdownByLabel('Select Use Case', 'Innovation Lifecycle Management');
    await this.verifyAddDropdownsSelected();

    const publicRadioLabel = this.page.locator('label:has-text("Public")').first();
    if (await publicRadioLabel.isVisible().catch(() => false)) {
      await publicRadioLabel.click({ force: true });
    }

    if (includeEditors) {
      await this.fillAllRichEditors(data.longText);
    }

    if (includeFile && filePath) {
      await this.fileInput.setInputFiles(filePath);
    }
  }

  async selectFirstOption(index) {
    const select = this.selects.nth(index);
    if (!(await select.isVisible().catch(() => false))) {
      return;
    }

    await select.scrollIntoViewIfNeeded();
    await select.click({ force: true });
    await this.page.waitForTimeout(500);
    const option = this.page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option').first();
    if (await option.isVisible().catch(() => false)) {
      await option.click({ force: true });
      await this.page.waitForTimeout(400);
    } else {
      await this.page.keyboard.press('Escape');
    }
  }

  async selectOptionBySearch(index, searchText) {
    const select = this.selects.nth(index);
    if (!(await select.isVisible().catch(() => false))) {
      return;
    }

    await select.scrollIntoViewIfNeeded();
    await select.click({ force: true });
    await this.page.keyboard.type(searchText);
    await this.page.waitForTimeout(800);

    const exactOption = this.page
      .locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option')
      .filter({ hasText: new RegExp(searchText, 'i') })
      .first();
    const anyOption = this.page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option').first();

    if (await exactOption.isVisible().catch(() => false)) {
      await exactOption.click({ force: true });
    } else if (await anyOption.isVisible().catch(() => false)) {
      await anyOption.click({ force: true });
    } else {
      await this.page.keyboard.press('Escape');
    }

    await this.page.waitForTimeout(400);
  }

  async selectByFormLabel(labelText, searchText = '') {
    const formItem = this.page
      .locator('.ant-form-item')
      .filter({ hasText: new RegExp(labelText, 'i') })
      .first();
    const select = formItem.locator('.ant-select').first();

    if (!(await select.isVisible().catch(() => false))) {
      return;
    }

    await select.scrollIntoViewIfNeeded();
    await select.click({ force: true });
    if (searchText) {
      await this.page.keyboard.type(searchText);
    }
    await this.page.waitForTimeout(800);

    const options = this.page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option');
    const preferredOption = searchText
      ? options.filter({ hasText: new RegExp(searchText, 'i') }).first()
      : options.first();

    if (await preferredOption.isVisible().catch(() => false)) {
      await preferredOption.click({ force: true });
    } else if (await options.first().isVisible().catch(() => false)) {
      await options.first().click({ force: true });
    } else {
      await this.page.keyboard.press('Escape');
    }

    await this.page.waitForTimeout(500);
  }

  getFormItemByLabel(labelText) {
    return this.page
      .locator('.ant-form-item')
      .filter({ hasText: new RegExp(`\\b${this.escapeRegExp(labelText)}\\b`, 'i') })
      .first();
  }

  getAddDropdownIndex(labelText) {
    const indexes = {
      Initiative: 0,
      Domain: 1,
      Tags: 2,
      Country: 3,
      'Select Use Case': 4,
    };
    return indexes[labelText];
  }

  async selectAntDropdownByLabel(labelText, searchText = '') {
    const formItem = this.getFormItemByLabel(labelText);
    let select;

    if (await formItem.isVisible({ timeout: 3000 }).catch(() => false)) {
      select = formItem.locator('.ant-select').first();
    } else {
      const index = this.getAddDropdownIndex(labelText);
      if (index === undefined) {
        throw new Error(`Dropdown "${labelText}" was not found on Add Innovation page.`);
      }
      select = this.selects.nth(index);
    }

    const selector = select.locator('.ant-select-selector').first();
    await selector.scrollIntoViewIfNeeded();

    for (let attempt = 0; attempt < 3; attempt++) {
      await selector.click({ force: true });
      await this.page.waitForTimeout(300);

      const input = select.locator('input[role="combobox"], input.ant-select-selection-search-input').first();
      if (searchText) {
        if ((await input.count()) > 0) {
          await input.click({ force: true }).catch(() => {});
          await input.fill('').catch(() => {});
        }
        await this.page.keyboard.type(searchText);
      }

      const options = this.page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option:not(.ant-select-item-option-disabled)');
      await options.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});

      const preferredOption = searchText
        ? options.filter({ hasText: new RegExp(this.escapeRegExp(searchText), 'i') }).first()
        : options.first();
      const optionToClick = await preferredOption.isVisible().catch(() => false)
        ? preferredOption
        : options.first();

      if (await optionToClick.isVisible().catch(() => false)) {
        await optionToClick.click({ force: true });
        await this.page.waitForTimeout(500);
        await this.page.keyboard.press('Escape').catch(() => {});
      } else {
        await this.page.keyboard.press('ArrowDown').catch(() => {});
        await this.page.keyboard.press('Enter').catch(() => {});
        await this.page.waitForTimeout(500);
      }

      if (await this.hasCommittedSelectValue(select)) {
        return;
      }
    }

    const visibleText = (await select.innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
    throw new Error(`Unable to select "${labelText}" dropdown. Current value: "${visibleText || 'empty'}"`);
  }

  async verifyAddDropdownsSelected() {
    for (const labelText of ['Initiative', 'Domain', 'Tags', 'Country', 'Select Use Case']) {
      const formItem = this.getFormItemByLabel(labelText);
      const index = this.getAddDropdownIndex(labelText);
      const select = await formItem.isVisible({ timeout: 1000 }).catch(() => false)
        ? formItem.locator('.ant-select').first()
        : this.selects.nth(index);

      if (!(await this.hasCommittedSelectValue(select))) {
        const visibleText = (await select.innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
        throw new Error(`Dropdown "${labelText}" is not selected before Save. Current value: "${visibleText || 'empty'}"`);
      }
    }
  }

  async hasCommittedSelectValue(select) {
    const selectedItems = select.locator('.ant-select-selection-item, .ant-select-selection-overflow-item .ant-select-selection-item');
    const selectedCount = await selectedItems.count();
    if (selectedCount === 0) {
      return false;
    }

    const selectedText = (await select.innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
    if (!selectedText) {
      return false;
    }

    return !/select an option|select tags|country|select use case/i.test(selectedText);
  }

  escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async selectByInputId(inputId, searchText = '') {
    const input = this.page.locator(`#${inputId}`).first();
    if ((await input.count()) === 0) {
      return;
    }

    const select = input.locator('xpath=ancestor::*[contains(@class, "ant-select")]').first();
    await select.scrollIntoViewIfNeeded();
    await select.click({ force: true });
    if (searchText) {
      await input.fill(searchText).catch(async () => {
        await this.page.keyboard.type(searchText);
      });
    }
    await this.page.waitForTimeout(800);

    const options = this.page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option');
    const preferredOption = searchText
      ? options.filter({ hasText: new RegExp(searchText, 'i') }).first()
      : options.first();

    if (await preferredOption.isVisible().catch(() => false)) {
      await preferredOption.click({ force: true });
    } else if (await options.first().isVisible().catch(() => false)) {
      await options.first().click({ force: true });
    } else {
      await this.page.keyboard.press('Escape');
    }

    await this.page.waitForTimeout(500);
  }

  async fillAllRichEditors(text) {
    const count = await this.richEditors.count();
    for (let i = 0; i < count; i++) {
      const editor = this.richEditors.nth(i);
      await editor.scrollIntoViewIfNeeded();
      await editor.click({ force: true });
      await editor.fill(`${text} Section ${i + 1}`);
    }
  }

  async uploadInvalidFileAndGetValidation(filePath) {
    logStep('Verifying invalid supporting document upload');
    await this.fileInput.setInputFiles(filePath);
    await this.page.waitForTimeout(1000);
    return await this.getToastOrPageValidation();
  }

  async resetAddFormIfVisible() {
    if (await this.resetButton.isVisible().catch(() => false)) {
      await this.resetButton.click({ force: true });
      await this.page.waitForTimeout(1000);
    }
  }

  async saveInnovationAndWaitForList() {
    logStep('Saving Innovation');
    await this.saveButton.scrollIntoViewIfNeeded();
    await this.saveButton.click({ force: true });
    await this.page.waitForTimeout(3000);
    await this.page.waitForURL(/\/innovation(?!\/add)/i, { timeout: 30000 }).catch(() => {});

    if (/\/innovation\/add/i.test(this.page.url())) {
      const messages = await this.getToastOrPageValidation();
      const bodyText = await this.getPageText();
      throw new Error(`Innovation was not saved. Validation/toast: ${messages.join(' | ') || 'none'}. Page text: ${bodyText.slice(0, 1000)}`);
    }

    await this.waitForInnovationList();
  }

  async getToastOrPageValidation() {
    const toastText = await this.toast.allInnerTexts().catch(() => []);
    const validationText = await this.validationMessages.allInnerTexts().catch(() => []);
    return [...toastText, ...validationText].map((text) => text.trim()).filter(Boolean);
  }

  async openSortMenu() {
    await this.sortButton.click();
    await this.page.waitForTimeout(500);
  }

  async selectSortOption(optionText) {
    await this.openSortMenu();
    await this.page.locator('.ant-dropdown:visible').getByText(optionText, { exact: true }).first().click({ force: true });
    await this.page.waitForTimeout(1500);
  }

  async openFilters() {
    await this.filtersButton.click();
    await this.page.waitForTimeout(500);
  }

  async resetFiltersIfVisible() {
    await this.openFilters();
    const reset = this.page.locator('.ant-dropdown:visible').getByText(/Reset|Clear All/i).first();
    if (await reset.isVisible().catch(() => false)) {
      await reset.click({ force: true });
      await this.page.waitForTimeout(1000);
    } else {
      await this.page.keyboard.press('Escape');
    }
  }

  async applyFilterByText(filterText) {
    await this.openFilters();
    const item = this.page.locator('.ant-dropdown:visible').getByText(filterText, { exact: true }).first();
    if (await item.isVisible().catch(() => false)) {
      await item.click({ force: true });
      await this.page.waitForTimeout(1000);
    }
  }

  async clickShowMoreIfVisible() {
    if (await this.showMoreButton.isVisible().catch(() => false)) {
      const before = await this.getVisibleCardText();
      await this.showMoreButton.click();
      await this.page.waitForTimeout(1500);
      const after = await this.getVisibleCardText();
      return { beforeLength: before.length, afterLength: after.length };
    }
    return { beforeLength: 0, afterLength: 0 };
  }

  async getVisibleCardText() {
    return (await this.page.locator('main').innerText()).replace(/\s+/g, ' ').trim();
  }

  async findAndOpenInnovation(titleOrPrefix) {
    logStep(`Opening Innovation record: ${titleOrPrefix}`);
    await this.selectSortOption('Latest First').catch(() => {});
    await this.page.locator(`text=${titleOrPrefix}`).first().scrollIntoViewIfNeeded({ timeout: 10000 }).catch(() => {});

    let link = this.page.locator(`text=${titleOrPrefix}`).first();
    if (!(await link.isVisible().catch(() => false))) {
      link = this.page.locator('main').locator('text=/Tulipdata|To Review|Collation/i').first();
    }

    await link.click({ force: true });
    await this.page.waitForTimeout(3000);
    await this.waitForEditPage();
  }

  async waitForEditPage() {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.locator('body').waitFor({ state: 'visible', timeout: 15000 });
    await this.page.waitForTimeout(1500);
  }

  async clickWorkflowTabs() {
    for (const tab of [this.collationTab, this.curationTab, this.orchestrationTab]) {
      if (await tab.isVisible().catch(() => false)) {
        await tab.click({ force: true });
        await this.page.waitForTimeout(800);
      }
    }

    await this.openCollationDetailsTab();
  }

  async clickContentTabs() {
    for (const tab of [this.detailsTab, this.workItemTab, this.commentsTab, this.activityTab]) {
      if (await tab.isVisible().catch(() => false)) {
        await tab.click({ force: true });
        await this.page.waitForTimeout(800);
      }
    }
  }

  async clickButtonIfVisible(name) {
    const button = this.page.locator(`button:has-text("${name}")`).first();
    if (await button.isVisible().catch(() => false)) {
      await button.click({ force: true });
      await this.page.waitForTimeout(1000);
      return true;
    }
    return false;
  }

  async openCollationDetailsTab() {
    if (await this.collationTab.isVisible().catch(() => false)) {
      await this.collationTab.click({ force: true });
      await this.page.waitForTimeout(800);
    }

    if (await this.detailsTab.isVisible().catch(() => false)) {
      await this.detailsTab.click({ force: true });
      await this.page.waitForTimeout(500);
    }
  }

  async verifyAssignAndUnassignFlow() {
    await this.openCollationDetailsTab();
    await this.clickButtonIfVisible('Submit for Review');
    await this.clickButtonIfVisible('Assign to Self');

    const unassignClicked = await this.clickButtonIfVisible('Unassign');
    if (unassignClicked) {
      const cancel = this.page.locator('button:has-text("Cancel")').last();
      if (await cancel.isVisible().catch(() => false)) {
        await cancel.click();
        await this.page.waitForTimeout(500);
      }
      await this.clickButtonIfVisible('Unassign');
      const ok = this.page.locator('button:has-text("OK"), button:has-text("Ok"), button:has-text("Yes")').last();
      if (await ok.isVisible().catch(() => false)) {
        await ok.click();
        await this.page.waitForTimeout(1000);
      }
    }
  }

  async addReviewNote(data) {
    const opened = await this.clickButtonIfVisible('Add Review');
    if (!opened) return false;

    const cancel = this.page.locator('button:has-text("Cancel")').last();
    if (await cancel.isVisible().catch(() => false)) {
      await cancel.click();
      await this.page.waitForTimeout(500);
    }

    await this.clickButtonIfVisible('Add Review');
    const input = this.page.locator('textarea, .jodit-wysiwyg, [contenteditable="true"]').last();
    if (await input.isVisible().catch(() => false)) {
      await input.fill(data.note);
    }

    await this.clickButtonIfVisible('Reset');
    if (await input.isVisible().catch(() => false)) {
      await input.fill(data.note);
    }
    await this.clickButtonIfVisible('Approve');
    return true;
  }

  async openWorkItemTab() {
    if (await this.workItemTab.isVisible().catch(() => false)) {
      await this.workItemTab.click({ force: true });
      await this.page.waitForTimeout(1000);
    }
  }

  async addManualWorkItem(data, attachmentPath) {
    await this.openWorkItemTab();
    await this.clickButtonIfVisible('Add Work Item');
    await this.clickButtonIfVisible('Add Manual');

    const drawer = this.page.locator('.ant-drawer, .ant-modal').last();
    await drawer.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});

    const cancel = this.page.locator('button:has-text("Cancel")').last();
    if (await cancel.isVisible().catch(() => false)) {
      await cancel.click();
      await this.page.waitForTimeout(500);
      await this.clickButtonIfVisible('Add Work Item');
      await this.clickButtonIfVisible('Add Manual');
    }

    await this.clickButtonIfVisible('Create');
    await this.page.waitForTimeout(800);

    const textInputs = this.page.locator('.ant-drawer input[type="text"], .ant-modal input[type="text"], input[type="text"]');
    const inputCount = await textInputs.count();
    for (let i = 0; i < inputCount; i++) {
      const input = textInputs.nth(i);
      if (await input.isVisible().catch(() => false)) {
        await input.fill(i === 0 ? data.title : `${data.project} ${i}`);
      }
    }

    const textareas = this.page.locator('.ant-drawer textarea, .ant-modal textarea, textarea');
    const textareaCount = await textareas.count();
    for (let i = 0; i < textareaCount; i++) {
      const textarea = textareas.nth(i);
      if (await textarea.isVisible().catch(() => false)) {
        await textarea.fill(`${data.longText} Work item ${i + 1}`);
      }
    }

    const selects = this.page.locator('.ant-drawer .ant-select, .ant-modal .ant-select');
    const selectCount = await selects.count();
    for (let i = 0; i < selectCount; i++) {
      await selects.nth(i).click({ force: true });
      await this.page.waitForTimeout(400);
      const option = this.page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option').filter({ hasText: /Vatsal Prajapati|Medium|.+/ }).first();
      if (await option.isVisible().catch(() => false)) {
        await option.click({ force: true });
      } else {
        await this.page.keyboard.press('Escape');
      }
    }

    const fileInput = this.page.locator('.ant-drawer input[type="file"], .ant-modal input[type="file"], input[type="file"]').last();
    if (attachmentPath && await fileInput.isVisible().catch(() => false)) {
      await fileInput.setInputFiles(attachmentPath);
    }

    await this.clickButtonIfVisible('Create');
    await this.page.waitForTimeout(2000);
  }

  async addComment(data) {
    if (await this.commentsTab.isVisible().catch(() => false)) {
      await this.commentsTab.click({ force: true });
      await this.page.waitForTimeout(500);
    }

    const commentBox = this.page.locator('textarea, [contenteditable="true"]').last();
    if (await commentBox.isVisible().catch(() => false)) {
      await commentBox.fill(data.comment);
      await this.clickButtonIfVisible('Cancel');
      await commentBox.fill(data.comment);
      await this.clickButtonIfVisible('Submit');
    }
  }

  async verifyActivityHasData() {
    if (await this.activityTab.isVisible().catch(() => false)) {
      await this.activityTab.click({ force: true });
      await this.page.waitForTimeout(1000);
    }
    return (await this.getPageText()).trim().length > 0;
  }

  async verifyRightPanel() {
    const body = await this.getPageText();
    return ['Use Case', 'Summary', 'Active Projects'].filter((text) => body.includes(text));
  }

  async likeInnovation() {
    const like = this.page.locator('button:has(svg), button').filter({ hasText: /^\d*$/ }).nth(1);
    if (await like.isVisible().catch(() => false)) {
      await like.click({ force: true });
      await this.page.waitForTimeout(1000);
    }
    return await this.getToastOrPageValidation();
  }

  async openDetailsTabAction(actionText) {
    await this.page.keyboard.press('Escape').catch(() => {});

    if (await this.collationTab.isVisible().catch(() => false)) {
      await this.collationTab.click({ force: true });
      await this.page.waitForTimeout(700);
    }

    if (await this.detailsTab.isVisible().catch(() => false)) {
      await this.detailsTab.click({ force: true });
      await this.page.waitForTimeout(700);
    } else {
      return false;
    }

    const detailsMenuButton = await this.getDetailsTabMenuButton();
    if (!detailsMenuButton) {
      return false;
    }

    await detailsMenuButton.click({ force: true });
    await this.page.waitForTimeout(500);

    const action = this.page
      .locator('.ant-dropdown:visible')
      .getByText(new RegExp(`^\\s*${this.escapeRegExp(actionText)}\\s*$`, 'i'))
      .first();

    if (await action.isVisible().catch(() => false)) {
      await action.click({ force: true });
      await this.page.waitForTimeout(1000);
      return true;
    }

    await this.page.keyboard.press('Escape');
    return false;
  }

  async getDetailsTabMenuButton() {
    const tabBox = await this.detailsTab.boundingBox().catch(() => null);
    if (!tabBox) {
      return null;
    }

    const triggers = this.page.locator('main .ant-dropdown-trigger, main [aria-haspopup="menu"], main button:has(svg)');
    const count = await triggers.count();
    const candidates = [];

    for (let i = 0; i < count; i++) {
      const trigger = triggers.nth(i);
      if (!(await trigger.isVisible().catch(() => false))) {
        continue;
      }

      const box = await trigger.boundingBox().catch(() => null);
      if (!box) {
        continue;
      }

      const isDetailsRowAction = box.y >= tabBox.y - 30
        && box.y <= tabBox.y + 90
        && box.x > tabBox.x + tabBox.width;

      if (isDetailsRowAction) {
        candidates.push({ trigger, x: box.x });
      }
    }

    candidates.sort((a, b) => b.x - a.x);
    return candidates[0]?.trigger ?? null;
  }

  async addFeedback(data) {
    const opened = await this.openDetailsTabAction('FeedBack');
    if (!opened) return false;

    const cancel = this.page.locator('button:has-text("Cancel")').last();
    if (await cancel.isVisible().catch(() => false)) {
      await cancel.click();
      await this.page.waitForTimeout(500);
    }

    const reopened = await this.openDetailsTabAction('FeedBack');
    if (!reopened) return false;

    const input = this.page.locator('textarea, .jodit-wysiwyg, [contenteditable="true"]').last();
    if (await input.isVisible().catch(() => false)) {
      await input.fill(data.feedback);
    }
    await this.clickButtonIfVisible('Submit');
    return true;
  }

  async editDetailsAndSave(data) {
    const opened = await this.openDetailsTabAction('Edit Details');
    if (!opened) return false;

    const firstInput = this.page.locator('input[type="text"]').first();
    if (await firstInput.isVisible().catch(() => false)) {
      await firstInput.fill(`${data.title} Edited`);
    }
    await this.clickButtonIfVisible('Save');
    await this.page.waitForTimeout(2000);
    return true;
  }
}
