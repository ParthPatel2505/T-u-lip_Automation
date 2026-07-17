import { test, expect } from '../../../fixtures/baseFixture.js';
import { generateIdeaTitle } from '../../../utils/randomGenerator.js';
import fs from 'fs';
import path from 'path';

/**
 * Helper to ensure test files exist inside the project directory structure.
 * This makes the test suite fully portable and self-contained.
 */
function ensureTestFiles() {
  const dataDir = path.resolve('test-results', 'test-data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const pdfPath = path.join(dataDir, 'test_sample.pdf');
  const pngPath = path.join(dataDir, 'test_sample.png');
  const txtPath = path.join(dataDir, 'test_sample.txt');

  if (!fs.existsSync(pdfPath)) {
    fs.writeFileSync(pdfPath, '%PDF-1.4 dummy pdf content for Tulip testing');
  }
  if (!fs.existsSync(pngPath)) {
    fs.writeFileSync(pngPath, '\x89PNG\r\n\x1a\n dummy png content for Tulip testing');
  }
  if (!fs.existsSync(txtPath)) {
    fs.writeFileSync(txtPath, 'dummy text content for testing file type validation');
  }

  return { pdfPath, pngPath, txtPath };
}

test.describe("Idea Page — Smoke & Validation Tests", () => {
  let testFiles;

  test.beforeAll(async () => {
    // Generate self-contained testing files before executing tests
    testFiles = ensureTestFiles();
  });

  test.beforeEach(async ({ loginPage, ideaPage }) => {
    const username = process.env.DEFAULT_USERNAME || 'nensi.bhavsar@tntra.io';
    const password = process.env.DEFAULT_PASSWORD || 'Test@123';

    // Login and navigate to Idea page before each test
    await loginPage.login(username, password);
    await ideaPage.navigateToIdeaPage();
  });

  // ──────────────────────────────────────────────
  //  POSITIVE TEST CASES
  // ──────────────────────────────────────────────

  test("should display Add Idea form with all expected elements", async ({ ideaPage }) => {
    await ideaPage.clickAddIdea();

    // Verify Add Idea Form container card is visible
    const isFormVisible = await ideaPage.isAddIdeaFormDisplayed();
    expect(isFormVisible).toBeTruthy();

    // Verify title input, description editor and upload area are visible
    expect(await ideaPage.isElementVisible(ideaPage.ideaTitleInput)).toBeTruthy();
    expect(await ideaPage.isElementVisible(ideaPage.ideaDescriptionEditor)).toBeTruthy();
    expect(await ideaPage.isElementVisible(ideaPage.attachmentUploadArea)).toBeTruthy();

    // Verify cancel, reset, and save buttons are visible
    expect(await ideaPage.isElementVisible(ideaPage.cancelButton)).toBeTruthy();
    expect(await ideaPage.isElementVisible(ideaPage.resetButton)).toBeTruthy();
    expect(await ideaPage.isElementVisible(ideaPage.saveButton)).toBeTruthy();
  });

  test("should create a new idea with Private visibility successfully", async ({ ideaPage, page }) => {
    await ideaPage.clickAddIdea();

    // Fill form fields
    const uniqueTitle = generateIdeaTitle("PrivateFlow");
    await ideaPage.fillIdeaTitle(uniqueTitle);
    await ideaPage.setVisibility("Private");
    await ideaPage.selectCollaborators("Nancy Bhavsar");
    await ideaPage.fillIdeaDescription("This is a test description for private visibility flow.");
    await ideaPage.uploadAttachment(testFiles.pdfPath);

    // Save the Idea
    await ideaPage.clickSave();

    // Verify redirect to Idea list page and form card disappearance
    await page.waitForURL(/\/idea$/);
    expect(page.url()).toContain('/tix/idea');
    expect(await ideaPage.isAddIdeaFormDisplayed()).toBeFalsy();
  });

  test("should create a new idea with Public visibility successfully", async ({ ideaPage, page }) => {
    await ideaPage.clickAddIdea();

    // Fill form fields
    const uniqueTitle = generateIdeaTitle("PublicFlow");
    await ideaPage.fillIdeaTitle(uniqueTitle);
    await ideaPage.setVisibility("Public");
    await ideaPage.fillIdeaDescription("This is a test description for public visibility flow.");
    await ideaPage.uploadAttachment(testFiles.pngPath);

    // Save the Idea
    await ideaPage.clickSave();

    // Verify redirect to Idea list page
    await page.waitForURL(/\/idea$/);
    expect(page.url()).toContain('/tix/idea');
    expect(await ideaPage.isAddIdeaFormDisplayed()).toBeFalsy();
  });

  test("should reset all fields when clicking Reset button", async ({ ideaPage }) => {
    await ideaPage.clickAddIdea();

    // Fill values into form
    await ideaPage.fillIdeaTitle("Temporary Title");
    await ideaPage.fillIdeaDescription("Temporary Description");

    // Click Reset
    await ideaPage.clickReset();

    // Verify fields are reset back to empty
    const titleVal = await ideaPage.getInputValue(ideaPage.ideaTitleInput);
    const descVal = await ideaPage.getInnerText(ideaPage.ideaDescriptionEditor);
    expect(titleVal).toBe("");
    expect(descVal).toBe("");
  });

  test("should cancel idea creation when clicking Cancel button", async ({ ideaPage, page }) => {
    await ideaPage.clickAddIdea();

    // Fill Title
    await ideaPage.fillIdeaTitle("Canceled Idea Title");

    // Click Cancel
    await ideaPage.clickCancel();

    // Verify redirect without saving
    await page.waitForURL(/\/idea$/);
    expect(page.url()).toContain('/tix/idea');
    expect(await ideaPage.isAddIdeaFormDisplayed()).toBeFalsy();
  });

  // ──────────────────────────────────────────────
  //  NEGATIVE / VALIDATION TEST CASES
  // ──────────────────────────────────────────────

  test("should show validation errors when submitting an empty form", async ({ ideaPage }) => {
    await ideaPage.clickAddIdea();

    // Click Save directly without filling mandatory fields
    await ideaPage.clickSave();

    // Assert Title field validation error is displayed and contains correct message
    expect(await ideaPage.isTitleErrorDisplayed()).toBeTruthy();
    const titleErrorMsg = await ideaPage.getTitleErrorMessage();
    expect(titleErrorMsg).toBe("Please enter the Title.");

    // Assert Description field validation error is displayed and contains correct message
    expect(await ideaPage.isDescriptionErrorDisplayed()).toBeTruthy();
    const descErrorMsg = await ideaPage.getDescriptionErrorMessage();
    expect(descErrorMsg).toBe("Please enter the Description.");
  });

  test("should show error with unsupported attachment file type", async ({ ideaPage }) => {
    await ideaPage.clickAddIdea();

    // Attempt to upload invalid text file
    await ideaPage.uploadAttachment(testFiles.txtPath);

    // Verify validation toast/error message is displayed
    const hasToast = await ideaPage.isToastDisplayed();
    expect(hasToast).toBeTruthy();

    const toastMsg = await ideaPage.getToastMessage();
    expect(toastMsg).toContain("Invalid file format.");
  });

  test("should show validation error when description is missing", async ({ ideaPage }) => {
    await ideaPage.clickAddIdea();

    // Fill only Title, leave Description empty
    await ideaPage.fillIdeaTitle("Title without Description");
    await ideaPage.clickSave();

    // Verify Description error is displayed, and Title error is NOT displayed
    expect(await ideaPage.isDescriptionErrorDisplayed()).toBeTruthy();
    expect(await ideaPage.isTitleErrorDisplayed()).toBeFalsy();

    const descErrorMsg = await ideaPage.getDescriptionErrorMessage();
    expect(descErrorMsg).toBe("Please enter the Description.");
  });

  test("should show validation error when title is missing", async ({ ideaPage }) => {
    await ideaPage.clickAddIdea();

    // Fill only Description, leave Title empty
    await ideaPage.fillIdeaDescription("Description without Title");
    await ideaPage.clickSave();

    // Verify Title error is displayed, and Description error is NOT displayed
    expect(await ideaPage.isTitleErrorDisplayed()).toBeTruthy();
    expect(await ideaPage.isDescriptionErrorDisplayed()).toBeFalsy();

    const titleErrorMsg = await ideaPage.getTitleErrorMessage();
    expect(titleErrorMsg).toBe("Please enter the Title.");
  });
});