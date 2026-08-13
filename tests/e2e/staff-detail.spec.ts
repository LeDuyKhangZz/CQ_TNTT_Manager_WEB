import { expect, test, type Page } from "@playwright/test";

/**
 * M01-B / TB-01 — trang chi tiết GLV `/staff/[id]`, phần bảo mật BẮT BUỘC XANH.
 *
 * Chỉ kiểm nhánh ĐỌC (không cấp/đổi tài khoản thật): bộ E2E dùng chung một
 * database qua ba viewport, tạo tài khoản trong test sẽ tiêu thụ trạng thái
 * "chưa có tài khoản" của lượt sau và làm spec chập chờn (WORKLOG nợ #10). Nhánh
 * cấp/đổi được phủ bằng unit (schema + trần vai trò) và pgTAP (`assign_primary_role`).
 *
 *   • AC-01.7 / S10 — GLV lớp mở hồ sơ đồng nghiệp KHÔNG thấy trường nhạy cảm.
 *   • AC-01.5 / S3  — chỉ Super Admin thấy khối "Tài khoản đăng nhập".
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

/**
 * Bấm rồi chờ, thử lại nếu cú bấm không dẫn tới đâu — cùng một helper
 * `attendance.spec.ts` đã dựng cho đúng loại chập chờn này (nợ #10).
 */
async function clickUntil(what: string, click: () => Promise<void>, done: () => Promise<boolean>) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (await done()) return;
    await click();
    for (let waited = 0; waited < 40; waited += 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (await done()) return;
    }
  }
  throw new Error(`Bấm ${what} 4 lần mà trang không chuyển.`);
}

async function expectNoHorizontalOverflow(page: Page) {
  await page.waitForLoadState("load");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, `trang chi tiết GLV tràn ngang ${overflow}px`).toBeLessThanOrEqual(1);
}

/**
 * M04-B: khẳng định về khối tài khoản nay phải nhắm vào TIÊU ĐỀ, không phải chữ
 * "Tài khoản đăng nhập" ở bất cứ đâu — khối "Xóa hồ sơ" mới có câu lý do
 * *"Hồ sơ đang gắn với một tài khoản đăng nhập…"* và phép so chuỗi lỏng khớp
 * luôn cả nó, biến một bài phân quyền thành bài đọc chính tả.
 */
async function openFirstStaffDetail(page: Page) {
  await page.goto("/staff");
  const link = page.locator('a[href^="/staff/"]').first();
  await expect(link).toBeVisible();
  await link.click();
  await page.waitForURL(/\/staff\/[0-9a-f-]{36}$/);
}

test("GLV lớp mở hồ sơ GLV không thấy ngày sinh, địa chỉ hay khối tài khoản (AC-01.7)", async ({ page }) => {
  await login(page, "GLV910");
  await openFirstStaffDetail(page);

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("Thông tin liên hệ riêng tư chỉ hiển thị cho vai trò quản trị.")).toBeVisible();
  await expect(page.getByText(/Ngày sinh/)).toHaveCount(0);
  await expect(page.getByText(/Địa chỉ/)).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Tài khoản đăng nhập" })).toHaveCount(0);
});

test("người không phải Super Admin không thấy khối 'Tài khoản đăng nhập' (AC-01.5 / S3)", async ({ page }) => {
  // Xứ đoàn trưởng: được ghi hồ sơ và xem trường nhạy cảm, nhưng KHÔNG quản trị
  // tài khoản — nên thấy 'Ngày sinh' mà không thấy khối tài khoản. Tách bạch
  // "đọc nhạy cảm" khỏi "quản trị tài khoản".
  await login(page, "GLV901");
  await openFirstStaffDetail(page);

  await expect(page.getByText(/Ngày sinh/).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Tài khoản đăng nhập" })).toHaveCount(0);
});

test("Super Admin thấy khối 'Tài khoản đăng nhập' trên hồ sơ GLV (positive control)", async ({ page }) => {
  await login(page, "Khang.Nho");
  await openFirstStaffDetail(page);

  await expect(page.getByRole("heading", { name: "Tài khoản đăng nhập" })).toBeVisible();
  await expect(page.getByText(/Ngày sinh/).first()).toBeVisible();
  // Trang chi tiết ở bản đầy đủ nhất (hồ sơ nhạy cảm + phân công + tài khoản +
  // sửa hồ sơ) không được tràn ngang, kể cả 360px.
  await expectNoHorizontalOverflow(page);
});

/**
 * M04-C — đóng điểm trừ duy nhất của M04-F09: đội ngũ lớp nay mở thẳng được hồ sơ
 * người phụ trách. Biên bản audit ghi "chưa link được vì `/staff/[staffId]` chưa
 * tồn tại"; trang đó có từ M01-B nên đây là nợ chỉ còn một dòng `<Link>`.
 */
test("từ đội ngũ lớp mở được hồ sơ Giáo lý viên (M04-F09)", async ({ page }) => {
  // Nợ #10, họ "bấm xong trang chưa kịp đổi": đo được ở M04-C là cú bấm thẻ lớp
  // mất ~15–20 giây khi máy tải nặng, và ở viewport chạy đầu tiên (server vừa
  // khởi động) có lượt **mất hẳn** cú bấm — đúng hình dạng bấm-trước-khi-hydrate.
  // Dùng `clickUntil` như `attendance.spec.ts` thay vì kéo dài một hạn chờ cứng.
  test.setTimeout(120_000);
  await login(page, "GLV901");
  await page.goto("/classes");

  const classCard = page.getByRole("link", { name: /Ấu 1A/ }).first();
  await expect(classCard).toBeVisible();
  await clickUntil(
    "thẻ lớp Ấu 1A",
    async () => classCard.click(),
    async () => /\/classes\/[0-9a-f-]{36}$/.test(page.url()),
  );

  await expect(page.getByRole("heading", { name: "Đội ngũ lớp" })).toBeVisible();
  // Trên trang chi tiết lớp, `/staff/<uuid>` CHỈ có ở khối đội ngũ — mục thanh
  // bên là `/staff` (không có dấu gạch chéo cuối) nên không lọt vào phép chọn.
  const staffLink = page.locator('a[href^="/staff/"]').first();
  await expect(staffLink).toBeVisible();
  const name = (await staffLink.textContent())?.trim() ?? "";
  expect(name.length, "tên người phụ trách phải đọc được, không phải dấu gạch").toBeGreaterThan(1);
  expect(name).not.toBe("—");

  await staffLink.click();
  await page.waitForURL(/\/staff\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(name.split(" ").pop() ?? "");
});
