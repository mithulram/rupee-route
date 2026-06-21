import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const monorepoRoot = path.resolve(__dirname, '../..');

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const apiURL = process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:3001';

const desktopViewport = { width: 1280, height: 720 };
const tabletViewport = { width: 768, height: 1024 };
const mobileViewport = devices['Pixel 5'].viewport;

const firefoxLaunchOptions = {
  timeout: 120_000,
  firefoxUserPrefs: {
    // Reduce macOS headless subprocess crashes during long serial E2E runs.
    'fission.autostart': false,
    'dom.ipc.processCount': 1,
  },
};

const sandboxWebServerEnv = {
  ...process.env,
  SANDBOX_FORCE_KYC_APPROVED: 'true',
  LIVE_TRANSFERS_ENABLED: 'false',
};

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : [
        {
          command: 'pnpm dev:api',
          cwd: monorepoRoot,
          url: `${apiURL}/health`,
          reuseExistingServer: !process.env.CI,
          timeout: 180_000,
          env: sandboxWebServerEnv,
        },
        {
          command: 'pnpm start',
          url: baseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
          env: sandboxWebServerEnv,
        },
      ],
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'], viewport: desktopViewport },
    },
    {
      name: 'firefox-desktop',
      use: {
        ...devices['Desktop Firefox'],
        viewport: desktopViewport,
        launchOptions: firefoxLaunchOptions,
      },
    },
    {
      name: 'webkit-desktop',
      use: { ...devices['Desktop Safari'], viewport: desktopViewport },
    },
    {
      name: 'chromium-tablet',
      use: { ...devices['Desktop Chrome'], viewport: tabletViewport },
    },
    {
      name: 'firefox-tablet',
      use: {
        ...devices['Desktop Firefox'],
        viewport: tabletViewport,
        launchOptions: firefoxLaunchOptions,
      },
    },
    {
      name: 'webkit-tablet',
      use: { ...devices['Desktop Safari'], viewport: tabletViewport },
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 5'], viewport: mobileViewport },
    },
    {
      name: 'firefox-mobile',
      use: {
        ...devices['Desktop Firefox'],
        viewport: mobileViewport,
        isMobile: true,
        hasTouch: true,
        launchOptions: firefoxLaunchOptions,
      },
    },
    {
      name: 'webkit-mobile',
      use: { ...devices['iPhone 13'], viewport: devices['iPhone 13'].viewport },
    },
  ],
});
