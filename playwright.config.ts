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
  // Một worker, kể cả ở máy local. Ba project (360/768/1366) chạy cùng bộ spec
  // trên **một** database duy nhất, nên chạy song song là ba phiên cùng ghi vào
  // cùng một lớp/giáo án/báo cáo. Phần lớn spec đã tự đặt tên theo project để
  // né nhau, nhưng không phải chỗ nào cũng né được — ràng buộc "một giáo án mỗi
  // lớp" thì không có cách nào chia. P7-T2 đo được: chạy 3 worker thì các spec
  // Phase 4/6 rớt ngẫu nhiên, chạy 1 worker thì xanh ổn định. Suite lâu hơn
  // nhưng gate mà xanh-đỏ tùy lúc thì không dùng được.
  workers: 1,
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
