import { defineConfig, devices } from '@playwright/test';

// Una URL externa evita arrancar un servidor local durante la defensa.
const externalURL = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: externalURL || 'http://127.0.0.1:4000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'chrome', use: { ...devices['Desktop Chrome'], channel: 'chrome' } },
  ],
  webServer: externalURL ? undefined : {
    command: 'npm start',
    url: 'http://127.0.0.1:4000',
    reuseExistingServer: false,
    timeout: 30_000,
    env: { PORT: '4000' },
  },
});
