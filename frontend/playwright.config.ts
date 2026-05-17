import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  // Run tests with limited parallelism to prevent ERR_INSUFFICIENT_RESOURCES
  fullyParallel: false,
  workers: 2,
  forbidOnly: !!process.env.CI,
  retries: 1,
  // Global test timeout of 120s to handle slow API cold starts
  timeout: 120000,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
    // Extended navigation/action timeouts for slow API response on first page load
    navigationTimeout: 45000,
    actionTimeout: 15000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
