import { expect, test } from "@playwright/test";

test("trang gốc chuyển đến đăng nhập", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Chào mừng bạn trở lại" })).toBeVisible();
});

test("dashboard yêu cầu đăng nhập", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard$/);
  await expect(page.getByRole("heading", { name: "Chào mừng bạn trở lại" })).toBeVisible();
});

test("admin direct URL cũng yêu cầu đăng nhập", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard$/);
});

test("login và dashboard không tràn ngang", async ({ page }) => {
  for (const route of ["/login", "/change-password"]) {
    await page.goto(route);
    // `/change-password` chuyển hướng về `/login` khi chưa đăng nhập. Đo ngay
    // lúc đang chuyển thì hoặc "context destroyed" hoặc đo nhầm khung dở dang —
    // bộ authenticated-shell đã phải chờ y hệt vì lý do này.
    await page.waitForLoadState("domcontentloaded");
    await page.locator("body").waitFor({ state: "attached" });
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(hasHorizontalOverflow, `${route} không được tràn ngang`).toBe(false);
  }
});

test("route không tồn tại trả giao diện 404", async ({ page }) => {
  const response = await page.goto("/route-khong-ton-tai");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Không tìm thấy trang" })).toBeVisible();
});
