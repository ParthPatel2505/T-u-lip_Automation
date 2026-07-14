// @ts-check
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load environment variables based on ENV flag.
 * Usage: cross-env ENV=stage npx playwright test
 * Falls back to .env in the project root.
 */
const envFile = process.env.ENV
  ? path.resolve(__dirname, 'config', `${process.env.ENV}.env`)
  : path.resolve(__dirname, '.env');

dotenv.config({ path: envFile });

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',

  /* Run tests in files in parallel */
  fullyParallel: false,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 1,

  /* Workers */
  workers: 1,

  /* Reporter configuration */
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'reports/html-report' }],
  ],

  /* Global timeout for each test */
  timeout: 60_000,

  /* Shared settings for all the projects */
  use: {
    /* Base URL from environment */
    baseURL: process.env.BASE_URL || 'https://tulip-uat.tntra.io/tix/',

    /* Collect trace on first retry */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video on first retry */
    video: 'on-first-retry',

    /* Action timeout */
    actionTimeout: 15_000,

    /* Navigation timeout */
    navigationTimeout: 30_000,

    /* Headless mode from env */
    headless: process.env.HEADLESS !== 'true',
  },

  /* Output directory for test artifacts */
  outputDir: 'test-results/',

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },

    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],
});
