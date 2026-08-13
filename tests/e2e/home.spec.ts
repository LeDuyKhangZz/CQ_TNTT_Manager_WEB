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

/**
 * 🔴 Test này TRƯỚC ĐÂY khẳng định `/admin` → `next=%2Fdashboard` là hành vi
 * đúng, tức là nó **chốt cứng chính cái bug A-04** vào bộ kiểm thử: layout gọi
 * `requireAuthContext()` không tham số nên mọi deep-link đều mất đích đến. Nay
 * `next` phải mang đúng đường dẫn người dùng đã gõ.
 */
test("deep-link giữ đúng đích đến trong ?next= (M14 A-04)", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin$/);

  // Kể cả phần query cũng phải sống sót — link trong thông báo hay mang query.
  await page.goto("/reports?type=weekly");
  await expect(page).toHaveURL(/\/login\?next=%2Freports%3Ftype%3Dweekly$/);
});

test("mã lỗi trên URL được giải thích bằng lời, không im lặng (M14 A-04)", async ({ page }) => {
  await page.goto("/login?error=account_unavailable");
  const banner = page.getByTestId("login-banner");
  await expect(banner).toBeVisible();
  await expect(banner).toContainText("khóa");
  await expect(banner).toHaveAttribute("role", "alert");
});

test("xác nhận đăng xuất hiện trên trang đăng nhập", async ({ page }) => {
  await page.goto("/login?notice=signed_out");
  const banner = page.getByTestId("login-banner");
  await expect(banner).toBeVisible();
  await expect(banner).toContainText("Bạn đã đăng xuất.");
  // Xác nhận trung tính thì KHÔNG được cắt ngang lời trình đọc màn hình.
  await expect(banner).toHaveAttribute("role", "status");
});

test("mã lạ trên thanh địa chỉ không in ra màn hình", async ({ page }) => {
  await page.goto("/login?error=khong-co-that");
  await expect(page.getByTestId("login-banner")).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText("khong-co-that");
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
