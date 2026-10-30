// / <reference types="node" />

import { defineConfig, devices } from '@playwright/test';

const dockerHostIp = process.env['E2E_DOCKER_HOST_IP'];

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
    launchOptions: {
      ...(process.env['CHROME_BIN']
        ? { executablePath: process.env['CHROME_BIN'] }
        : {}),
      ...(dockerHostIp
        ? { args: [`--host-resolver-rules=MAP localhost ${dockerHostIp}`] }
        : {}),
    },
  },
});
