import { expect, test } from "@playwright/test";

/**
 * P7-T1 — "Installable PWA where supported" trong Gate Phase 7.
 *
 * Bấm thật bằng trình duyệt: manifest và icon phải tải được **khi chưa đăng
 * nhập** (middleware không được chặn), service worker phải đăng ký và điều
 * khiển trang, và khi rớt mạng phải ra trang offline tĩnh chứ không phải trang
 * cũ có dữ liệu các em.
 */

test("manifest và icon tải được khi chưa đăng nhập", async ({ request }) => {
  const manifest = await request.get("/manifest.webmanifest");
  expect(manifest.status()).toBe(200);

  const value = await manifest.json();
  expect(value.display).toBe("standalone");
  expect(value.theme_color).toBe("#f28c5b");

  const png = (value.icons as Array<{ src: string; sizes: string; purpose?: string }>).filter(
    (icon) => icon.src.endsWith(".png"),
  );
  expect(png.map((icon) => icon.sizes)).toEqual(
    expect.arrayContaining(["192x192", "512x512"]),
  );

  for (const icon of png) {
    const response = await request.get(icon.src);
    expect(response.status(), `${icon.src} phải tải được`).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/png");
  }
});

test("sw.js không bị cache lâu và có phạm vi toàn site", async ({ request }) => {
  const response = await request.get("/sw.js");
  expect(response.status()).toBe(200);

  const headers = response.headers();
  // Giữ bản service worker cũ là giữ luôn bundle cũ — docs/04 §12.
  expect(headers["cache-control"]).toContain("must-revalidate");
  expect(headers["service-worker-allowed"]).toBe("/");
});

test("service worker đăng ký, điều khiển trang và đỡ được lúc mất mạng", async ({
  page,
  context,
}) => {
  await page.goto("/login");
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));

  // `clients.claim()` chỉ có tác dụng với tab mở sau khi worker hoạt động; tải
  // lại một lần cho chắc thay vì chờ theo mốc thời gian đoán mò.
  await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));

  await context.setOffline(true);
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Không có kết nối mạng" })).toBeVisible();

  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  expect(overflows, "trang offline không được tràn ngang").toBe(false);

  await context.setOffline(false);
});
