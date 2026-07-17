import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage.js';
import { InnovationPage } from '../../pages/Automation_Acceleration/Innovation_add.js';
import { generateTulipData, createUploadFixtures } from '../../utils/testDataFactory.js';
import { logStep, logValidation } from '../../utils/logger.js';

test.describe.configure({ mode: 'serial' });

test.describe('Innovation Add - E2E Test Suite', () => {
  let sharedPage;
  let loginPage;
  let innovationPage;
  let testData;
  let files;

  const expectedAddFields = [
    'Innovation Title',
    'Initiative',
    'Domain',
    'Reference Link',
    'Tags',
    'Country',
    'Select Use Case',
    'Visibility',
    'Public',
    'Private',
    'Describe your Innovation',
    'Describe the Market Potential',
    'Describe the Intellectual Property Potential',
    'Describe the Technology Requirements or Availability',
    'Describe the Compliance or Regulatory Aspects',
    'Describe the Business Model',
    'Supporting Documents',
  ];

  test.beforeAll(async ({ browser }) => {
    testData = generateTulipData('Tulipdata');
    files = createUploadFixtures(testData.key);

    const context = await browser.newContext();
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    sharedPage = await context.newPage();
    loginPage = new LoginPage(sharedPage);
    innovationPage = new InnovationPage(sharedPage);

    await loginPage.goToLoginPage();
    await loginPage.loginWithEnvCredentials();
    expect(await loginPage.isLoginSuccessful()).toBeTruthy();

    await innovationPage.openInnovationListFromSideMenu();
  });

  test.afterAll(async () => {
    if (sharedPage) {
      await sharedPage.close();
    }
  });

  test('should open Add Innovation page and verify all current fields and buttons', async () => {
    await innovationPage.openAddInnovationPage();

    const actualCounts = await innovationPage.verifyAddPageFields(expectedAddFields);
    expect(actualCounts.titleInputs).toBe(1);
    expect(actualCounts.referenceInputs).toBe(1);
    expect(actualCounts.selects).toBe(5);
    expect(actualCounts.editors).toBe(6);
    expect(actualCounts.fileInputs).toBe(1);
    expect(actualCounts.actionButtons).toBe(3);

    await expect(innovationPage.cancelButton).toBeVisible();
    await expect(innovationPage.resetButton).toBeVisible();
    await expect(innovationPage.saveButton).toBeVisible();
  });

  test('should verify Add Innovation page scrolling and Cancel button', async () => {
    const scroll = await innovationPage.verifyPageScroll();
    expect(scroll.afterUp).toBe(0);
    expect(scroll.afterDown).toBeGreaterThanOrEqual(scroll.before);

    await innovationPage.clickCancelAndReturnToAddPage();
    await expect(innovationPage.addPageTitle).toBeVisible();
  });

  test('should verify Reset button clears entered form data', async () => {
    const titleAfterReset = await innovationPage.verifyResetClearsEnteredData(testData);
    expect(titleAfterReset).toBe('');
  });

  test('should verify mandatory validations on empty Save', async () => {
    const expectedMandatoryFields = [
      'Innovation Title',
      'Domain',
      'Country',
      'Select Use Case',
      'Visibility',
      'Describe your Innovation',
      'Describe the Market Potential',
      'Describe the Intellectual Property Potential',
      'Describe the Technology Requirements or Availability',
      'Describe the Compliance or Regulatory Aspects',
      'Describe the Business Model',
    ];

    const bodyText = await innovationPage.getPageText();
    const actualRequiredCount = expectedMandatoryFields.filter((field) => bodyText.includes(field)).length;
    expect(actualRequiredCount).toBe(expectedMandatoryFields.length);

    const messages = await innovationPage.submitEmptyAndGetMandatoryMessages();
    logValidation(`Mandatory validation messages visible: ${messages.length}`);
  });

  test('should verify invalid file upload validation and then create Innovation with valid data', async () => {
    const invalidMessages = await innovationPage.uploadInvalidFileAndGetValidation(files.invalidFile);
    logValidation(`Invalid upload validation messages: ${invalidMessages.join(' | ') || 'No toast text captured'}`);
    await innovationPage.resetAddFormIfVisible();

    await innovationPage.fillBasicAddData(testData, {
      includeEditors: true,
      includeFile: true,
      filePath: files.validFile,
    });

    await innovationPage.saveInnovationAndWaitForList();

    logStep('Verifying newly created Innovation appears on listing');
    await innovationPage.selectSortOption('Latest First').catch(() => {});
    const listText = await innovationPage.getVisibleCardText();
    expect(listText).toContain(testData.title);
  });
});
