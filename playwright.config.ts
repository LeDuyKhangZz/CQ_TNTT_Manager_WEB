import { defineConfig, devices } from "@playwright/test";

const e2eBaseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3107";

/**
 * E2E config. Requires browsers: `npx playwright install`.
 * Runs against a local Next.js dev server (see webServer below).
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 3,
  reporter: "list",
  use: {
    baseURL: e2eBaseUrl,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "mobile-360",
      use: { ...devices["Desktop Chrome"], viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true },
    },
    {
      name: "tablet-768",
      use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 }, hasTouch: true },
    },
    {
      name: "laptop-1366",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 768 } },
    },
  ],
  webServer: process.env.PLAYWRIGHT_EXTERNAL_SERVER
    ? undefined
    : {
        command: "npm run start -- --hostname 127.0.0.1 --port 3107",
        url: `${e2eBaseUrl}/login`,
        reuseExistingServer: false,
        timeout: 120_000,
      },
});
