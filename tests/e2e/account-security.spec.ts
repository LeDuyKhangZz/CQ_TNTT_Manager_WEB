import { expect, test, type Page } from "@playwright/test";

/**
 * M01-A — bảo mật & quản trị tài khoản.
 *   • TB-04 (AC-03.2): đổi mật khẩu TỰ NGUYỆN bắt buộc mật khẩu hiện tại; sai thì
 *     bị từ chối và KHÔNG đổi.
 *   • TB-03 (AC-M01-06): trang /account hiện đủ danh tính + trạng thái mật khẩu +
 *     hai thao tác.
 *   • TB-06 / nợ #1: xóa tài khoản qua hộp thoại gõ lại tên đăng nhập (không còn
 *     window.confirm); nút xác nhận bị khóa tới khi gõ đúng tên.
 *
 * Cố ý KHÔNG đổi thật mật khẩu hay xóa thật tài khoản seed: bộ E2E dùng chung một
 * database, đổi mật khẩu 123456 hay xóa một tài khoản sẽ làm hỏng các spec khác
 * (WORKLOG: "để lại dữ liệu tái lập được"). Nên chỉ kiểm nhánh bị-từ-chối và
 * nhánh khóa-nút — đủ chứng minh hàng rào mà không biến đổi fixture.
 */
const DEV_PASSWORD = "123456";

async function login(page: Page, username: string) {
  await page.context().clearCookies();
  await page.goto("/login");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.getByLabel("Tên đăng nhập").fill(username);
    await page.locator("input#password").fill(DEV_PASSWORD);
    await page.getByRole("button", { name: "Đăng nhập" }).click();
    try {
      await page.waitForURL(/\/(dashboard|change-password)$/, { timeout: 10_000 });
      await expect(page).toHaveURL(/\/dashboard$/);
      return;
    } catch {
      await page.goto("/login");
    }
  }
  throw new Error(`Không đăng nhập được bằng ${username}. Đã chạy seed:dev chưa?`);
}

async function expectNoHorizontalOverflow(page: Page, where: string) {
  await page.waitForLoadState("load");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow, `${where} tràn ngang ${overflow}px`).toBeLessThanOrEqual(1);
}

test("đổi mật khẩu tự nguyện bắt buộc mật khẩu hiện tại; sai thì bị từ chối", async ({ page }) => {
  await login(page, "GLV901");
  await page.goto("/change-password");
  // Chế độ tự nguyện (must_change_password = false) mới có ô này.
  await expect(page.getByLabel("Mật khẩu hiện tại")).toBeVisible();
  await expectNoHorizontalOverflow(page, "/change-password");

  await page.getByLabel("Mật khẩu hiện tại").fill("sai-hoan-toan");
  await page.getByLabel("Mật khẩu mới", { exact: true }).fill("matkhaumoi123");
  await page.getByLabel("Xác nhận mật khẩu mới").fill("matkhaumoi123");
  await page.getByRole("button", { name: "Lưu mật khẩu mới" }).click();

  await expect(page.getByText("Mật khẩu hiện tại không đúng.")).toBeVisible();
  await expect(page).toHaveURL(/\/change-password$/);
});

test("trang Tài khoản hiện trạng thái mật khẩu và hai thao tác", async ({ page }) => {
  await login(page, "GLV901");
  await page.goto("/account");
  await expect(page.getByRole("heading", { level: 1, name: "Tài khoản" })).toBeVisible();
  await expect(page.getByText("Đã đặt mật khẩu riêng")).toBeVisible();
  await expect(page.getByRole("link", { name: "Đổi mật khẩu" })).toBeVisible();
  await expect(page.getByRole("main").getByRole("button", { name: "Đăng xuất" })).toBeVisible();
  await expectNoHorizontalOverflow(page, "/account");
});

test("xóa tài khoản: hộp thoại gõ lại tên, nút khóa tới khi gõ đúng", async ({ page }) => {
  await login(page, "Khang.Nho");
  await page.goto("/admin");

  // Lọc danh sách còn đúng tài khoản GLV910 (không phải Super Admin).
  await page.getByPlaceholder("Tìm theo tên hoặc tên đăng nhập").fill("GLV910");
  await page.getByRole("button", { name: "Xóa tài khoản" }).first().click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const confirm = dialog.getByRole("button", { name: "Xóa tài khoản" });
  await expect(confirm).toBeDisabled();

  await dialog.getByLabel("Nhập lại tên đăng nhập").fill("sai");
  await expect(confirm).toBeDisabled();

  await dialog.getByLabel("Nhập lại tên đăng nhập").fill("GLV910");
  await expect(confirm).toBeEnabled();

  // Huỷ — cố ý KHÔNG xóa để giữ fixture tái lập được.
  await dialog.getByRole("button", { name: "Huỷ" }).click();
  await expect(dialog).toBeHidden();
});

/**
 * M04-C / D-111 — `/admin` thu hẹp về tra cứu + xử lý ngoại lệ.
 *
 * Kiểm trên trang THẬT chứ không chỉ ở unit test, vì đây là chỗ dữ liệu do máy chủ
 * đưa xuống: danh sách vai trò nay do `adminProvisionableRoles` quyết theo vai trò
 * người đang thao tác, không phải một mảng viết cứng trong giao diện.
 */
test("biểu mẫu tạo tài khoản ở /admin chỉ còn vai trò không gắn hồ sơ Giáo lý viên", async ({ page }) => {
  await login(page, "Khang.Nho");
  await page.goto("/admin");

  // `exact: true`: trang còn một ô "Lọc theo vai trò" ở danh sách tài khoản.
  const roleSelect = page.getByLabel("Vai trò", { exact: true });
  await expect(roleSelect).toBeVisible();
  const labels = await roleSelect.locator("option").allTextContents();
  expect(labels).toEqual(["Cha sở", "Cha phó/Tuyên úy", "Phụ huynh", "Thiếu nhi"]);

  // Ô chọn cũ liệt kê đủ 14 vai trò, kể cả hai vai trò máy chủ LUÔN từ chối.
  expect(labels).not.toContain("Quản trị viên hệ thống");
  expect(labels).not.toContain("Giáo lý viên lớp");

  // Bỏ một đường đi thì phải chỉ đường thay thế.
  await expect(page.getByRole("link", { name: "mở Danh sách nhân sự" })).toHaveAttribute("href", "/staff");
});
