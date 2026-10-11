import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  use: {
    baseURL: 'http://127.0.0.1:8082',
    viewport: { width: 390, height: 844 },
    launchOptions: { executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] },
    trace: 'retain-on-failure',
  },
  reporter: 'list',
  webServer: {
    command: 'python3 -m http.server 8082 --bind 127.0.0.1 --directory dist',
    url: 'http://127.0.0.1:8082',
    reuseExistingServer: !process.env.CI,
  },
});
