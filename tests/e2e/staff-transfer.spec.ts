import { expect, test, type Page } from "@playwright/test";

/**
 * M04-A / D-105 — "Chuyển lớp" một bước, kiểm bằng TÀI KHOẢN THẬT của từng vai trò.
 *
 * Hai khẳng định bắt buộc xanh của `08_ACCEPTANCE_CRITERIA.md`:
 *
 *   • **AC-04.1 — không còn trạng thái zombie.** Đây là bài duy nhất chứng minh
 *     được điều mà pgTAP không chứng minh nổi: sau khi chuyển lớp, chính người
 *     GLV đó **đăng nhập lại và thấy lớp mới**. pgTAP kiểm dòng dữ liệu; chỉ E2E
 *     kiểm được rằng phiên đăng nhập, JWT và RLS cùng đồng ý với dòng đó.
 *   • **D-107 — Trưởng ngành chỉ chuyển được trong ngành mình.** Kiểm bằng cách
 *     bấm thật vào một lớp NGOÀI ngành và đọc câu bị từ chối.
 *
 * 🔴 Bài này ĐỔI DỮ LIỆU (GLV911 rời Ấu 1A sang Ấu 1B). Phải chạy sau
 * `npm run db:reset && npm run seed:dev` như mọi lượt E2E đầy đủ (WORKLOG). Cố ý
 * chọn **GLV911 (Dự trưởng phụ tá)** làm nhân vật: `grep GLV911 tests/e2e` = 0,
 * tức không spec nào khác dựa vào lớp của người này.
 */
const DEV_PASSWORD = "123456";

/** Vai trò trong lớp giữ nguyên khi chuyển ⇒ vai trò đăng nhập cũng giữ nguyên. */
const CAPACITY = "Dự trưởng phụ tá";
/**
 * 🔴 Hai lớp ĐỔI QUA ĐỔI LẠI, không phải một chiều cố định.
 *
 * Ba viewport (360 · 768 · 1366) chạy tuần tự trên **cùng một database**. Một bài
 * chuyển lớp một chiều xanh ở lượt đầu rồi đỏ ở hai lượt sau vì người ta đã nằm
 * sẵn ở lớp đích — đúng loại ma sát mà nợ #10 mô tả. Bài này vì thế ĐỌC lớp hiện
 * tại rồi chuyển sang lớp còn lại, nên mỗi lượt tự trả dữ liệu về trạng thái mà
 * lượt sau dùng được. Cả hai lớp đều thuộc ngành Ấu Nhi ⇒ vẫn đúng phạm vi D-107.
 */
const AU_CLASSES = ["Ấu 1A", "Ấu 1B"] as const;
const OUT_OF_SECTOR_CLASS = "Thiếu 1A";

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

/** Tên lớp mà tài khoản đang đăng nhập được phép điểm danh. */
async function attendanceClassOptions(page: Page): Promise<string[]> {
  await page.goto("/attendance");
  const options = page.locator("#attendance-class option");
  await expect(options.first()).toBeAttached();
  return (await options.allTextContents()).map((text) => text.trim()).filter(Boolean);
}

/**
 * M04-B thêm phân trang cho `/staff` (10 hồ sơ mỗi trang) và bộ lọc mặc định ẩn
 * người "Đã nghỉ" (D-108). Mở thẳng `/staff` rồi tìm một cái tên là cách chắc
 * chắn rớt khi hồ sơ đó rơi sang trang 2 — dùng ô tìm kiếm để thu về đúng một thẻ.
 */
async function openStaffDetail(page: Page, linkName: RegExp, search: string) {
  await page.goto(`/staff?service=all&q=${encodeURIComponent(search)}`);
  const link = page.getByRole("link", { name: linkName });
  await expect(link).toBeVisible();
  await link.click();
  await page.waitForURL(/\/staff\/[0-9a-f-]{36}$/);
}

test("D-105 + AC-04.1: Trưởng ngành chuyển lớp trong ngành mình, GLV giữ đăng nhập và thấy lớp mới", async ({ page }) => {
  // ---- Trước khi chuyển: GLV911 chỉ điểm danh được ĐÚNG MỘT lớp ------------
  await login(page, "GLV911");
  const before = (await attendanceClassOptions(page)).join(" | ");
  const fromClass = AU_CLASSES.find((name) => before.includes(name));
  expect(fromClass, `GLV911 phải đang ở một trong ${AU_CLASSES.join(" / ")}, đọc được: ${before}`).toBeTruthy();
  const toClass = AU_CLASSES.find((name) => name !== fromClass)!;
  expect(before).not.toContain(toClass);

  // ---- Trưởng ngành Ấu Nhi (GLV905) thao tác -------------------------------
  await login(page, "GLV905");
  await openStaffDetail(page, /Trịnh Dự Trưởng/, "GLV911");

  // D-105 ở tầng giao diện: Trưởng ngành KHÔNG có quyền ghi hồ sơ/kết thúc phân
  // công, nên chỉ thấy đúng một nút.
  await expect(page.getByRole("button", { name: "Chuyển lớp" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Kết thúc phân công" })).toHaveCount(0);

  await page.getByRole("button", { name: "Chuyển lớp" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  // D-107 — thử một lớp NGOÀI ngành trước: phải bị từ chối bằng lời, không phải
  // bằng một trang lỗi. Nút vẫn bấm được vì hàng rào nằm ở cơ sở dữ liệu.
  await dialog.getByLabel("Lớp mới", { exact: true }).selectOption({ label: OUT_OF_SECTOR_CLASS });
  await dialog.getByRole("button", { name: "Xác nhận chuyển lớp" }).click();
  await expect(dialog.getByText("Bạn không có quyền thực hiện thao tác này.")).toBeVisible({ timeout: 20_000 });

  // Hộp thoại giữ nguyên các ô đã điền ⇒ chọn lại lớp đúng ngành và làm tiếp.
  await dialog.getByLabel("Lớp mới", { exact: true }).selectOption({ label: toClass });
  await dialog.getByLabel("Vai trò trong lớp mới").selectOption({ label: CAPACITY });

  // Câu xem trước là lời xác nhận: nêu tên người, hai lớp, và vai trò đăng nhập.
  await expect(dialog).toContainText("Trịnh Dự Trưởng");
  await expect(dialog).toContainText(fromClass!);
  await expect(dialog).toContainText(toClass);
  await expect(dialog).toContainText(/Vai trò đăng nhập chuyển từ/);

  await dialog.getByRole("button", { name: "Xác nhận chuyển lớp" }).click();
  // D-61 — thao tác ghi phải có phản hồi, và phản hồi nêu tên.
  await expect(page.getByText(new RegExp(`Đã chuyển .*sang lớp ${toClass}`))).toBeVisible({ timeout: 20_000 });

  // Lịch sử được giữ: dòng cũ còn đó, đánh dấu đã kết thúc.
  await expect(page.getByText("Đã kết thúc").first()).toBeVisible();

  // ---- AC-04.1: GLV911 đăng nhập LẠI và thấy lớp mới -----------------------
  // Không đổi mật khẩu, không bị buộc đổi mật khẩu, không mất quyền.
  await login(page, "GLV911");
  const after = (await attendanceClassOptions(page)).join(" | ");
  expect(after).toContain(toClass);
  expect(after).not.toContain(fromClass!);
});

test("AC-03.1: hộp xác nhận 'Kết thúc phân công' nêu hậu quả bằng tên riêng, bấm Huỷ thì không đổi gì", async ({ page }) => {
  // Xứ đoàn trưởng có quyền ghi ⇒ thấy cả hai nút.
  await login(page, "GLV901");
  await openStaffDetail(page, /Cao GLV 1B/, "GLV913");

  await page.getByRole("button", { name: "Kết thúc phân công" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("Cao GLV 1B");
  // GLV913 luôn ở Ấu 1B — bài này không đổi dữ liệu (bấm Huỷ), nên hằng số cố định được.
  await expect(dialog).toContainText("Ấu 1B");
  await expect(dialog).toContainText(/vô hiệu hoá vai trò đăng nhập/i);

  await dialog.getByRole("button", { name: "Huỷ" }).click();
  await expect(dialog).toHaveCount(0);

  // Không có thay đổi nào: người đó vẫn đang phục vụ lớp cũ.
  await page.reload();
  await expect(page.getByText("Đang phục vụ").first()).toBeVisible();
});

test("thông báo trên trang chi tiết KHÔNG bị nuốt sau khi tạo hồ sơ (5W-05)", async ({ page }) => {
  // Bản M01-B điều hướng về `/staff/<id>?created=1` nhưng trang không đọc phần
  // `?...` nên người dùng không thấy gì — thành công và thất bại trông giống hệt.
  await login(page, "Khang.Nho");
  await openStaffDetail(page, /Trịnh Dự Trưởng/, "GLV911");
  const url = page.url();

  await page.goto(`${url}?created=1`);
  await expect(page.getByText(/Đã tạo hồ sơ/)).toBeVisible();

  await page.goto(`${url}?error=transfer`);
  await expect(page.getByText("Không chuyển được lớp.")).toBeVisible();
});
