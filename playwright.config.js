// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:8095',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome', // Uses locally installed Chrome if available across Windows/Linux/macOS
      },
    },
  ],
  webServer: {
    command: 'npx http-server www -p 8095',
    url: 'http://localhost:8095',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
