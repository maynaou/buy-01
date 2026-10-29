/// <reference types="node" />

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  outputDir: './node_modules/.cache/playwright-e2e',
  fullyParallel: false,
  reporter: [
    ['list'],
    ['junit', { outputFile: 'test-results/e2e-junit.xml' }],
  ],
  use: {
    baseURL: process.env['E2E_BASE_URL'] ?? 'https://localhost:4200',
    ignoreHTTPSErrors: true,
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
    ...(process.env['CHROME_BIN']
      ? { launchOptions: { executablePath: process.env['CHROME_BIN'] } }
      : {}),
  },
});
