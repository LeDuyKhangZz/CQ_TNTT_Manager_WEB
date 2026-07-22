import { expect, test, type Page } from "@playwright/test";

/**
 * Gate Phase 2 — "Student/guardian/staff/class UI usable".
 *
 * Đăng nhập thật rồi đi hết các trang nghiệp vụ của Phase 2 ở cả ba viewport.
 * Cần DB local đã `npm run db:reset && npm run seed:dev` (mật khẩu dev, tài
 * khoản GLV9xx). Nếu chưa seed thì test báo trượt ngay ở bước đăng nhập, đó là
 * tín hiệu đúng chứ không phải nhiễu.
 */
const DEV_PASSWORD = "123456";

async function login(page: Page, username: string) {
  await page.goto("/login");

  // Form gửi bằng handler của React. Nếu bấm trước khi hydrate xong thì trình
  // duyệt submit kiểu native và ở lại /login, nên thử lại vài lần thay vì chờ
  // một mốc thời gian đoán mò.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.getByLabel("Tên đăng nhập").fill(username);
    // Ô mật khẩu có nút "Hiện mật khẩu" cùng nhãn, nên phải trỏ thẳng vào input.
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

/** Không trang nào được tràn ngang — yêu cầu mobile-first của docs/06. */
async function expectNoHorizontalOverflow(page: Page, where: string) {
  // Trang có thể vừa chuyển hướng xong; đo trước khi DOM mới sẵn sàng sẽ ném
  // "context destroyed".
  await page.waitForLoadState("domcontentloaded");
  await page.locator("body").waitFor({ state: "attached" });
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  expect(overflows, `${where} không được tràn ngang`).toBe(false);
}

test.describe("Xứ đoàn trưởng đi hết các trang Phase 2", () => {
  test("students, class, staff, imports đều dùng được", async ({ page }) => {
    await login(page, "GLV901");

    // ── Danh sách thiếu nhi ────────────────────────────────────────────────
    await page.goto("/students");
    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { name: "Thiếu nhi", exact: true })).toBeVisible();
    const studentLinks = page.locator('a[href^="/students/"]');
    await expect(studentLinks.first()).toBeVisible();
    await expectNoHorizontalOverflow(page, "/students");

    // ── Hồ sơ một em: có tab nhạy cảm vì đây là role global ────────────────
    const firstStudent = await studentLinks.first().getAttribute("href");
    expect(firstStudent).toBeTruthy();
    await page.goto(firstStudent!);
    await expect(page.getByText("Sức khỏe")).toBeVisible();
    await expect(page.getByText("Bí tích")).toBeVisible();
    await expectNoHorizontalOverflow(page, firstStudent!);

    // ── 19 thẻ lớp ─────────────────────────────────────────────────────────
    await page.goto("/classes");
    await expect(main.getByRole("heading", { name: "Lớp học", exact: true })).toBeVisible();
    const classLinks = page.locator('a[href^="/classes/"]');
    await expect(classLinks).toHaveCount(19);
    await expectNoHorizontalOverflow(page, "/classes");

    // ── Chi tiết lớp: đội ngũ + roster ─────────────────────────────────────
    const firstClass = await classLinks.first().getAttribute("href");
    await page.goto(firstClass!);
    await expect(page.getByText(/Ghi danh|Sĩ số|Đội ngũ/).first()).toBeVisible();
    await expectNoHorizontalOverflow(page, firstClass!);

    // ── Nhân sự và nhập liệu ───────────────────────────────────────────────
    await page.goto("/staff");
    await expect(main.getByText(/GLV901 · 0901000001/)).toBeVisible();
    await expectNoHorizontalOverflow(page, "/staff");

    await page.goto("/imports");
    await expect(page.getByRole("button", { name: "Kiểm tra file" })).toBeVisible();
    await expectNoHorizontalOverflow(page, "/imports");
  });
});

test.describe("Phạm vi hiển thị theo vai trò", () => {
  test("GLV lớp chỉ thấy lớp mình trong danh sách thiếu nhi", async ({ page }) => {
    await login(page, "GLV910");
    await page.goto("/students");
    const rows = page.locator('a[href^="/students/"]');
    const seen = await rows.count();
    expect(seen).toBeGreaterThan(0);
    // Toàn xứ đoàn có hàng trăm em; GLV một lớp không được thấy cỡ đó.
    expect(seen).toBeLessThan(60);
    await expectNoHorizontalOverflow(page, "/students (GLV lớp)");
  });

  // D-45: phụ huynh không dùng module nghiệp vụ; mọi trang staff phải trả về
  // /access-denied chứ không phải một trang lỗi hay một trang rỗng.
  for (const route of ["/imports", "/students", "/classes", "/staff"]) {
    test(`phụ huynh bị chặn khỏi ${route}`, async ({ page }) => {
      await login(page, "84912000001");
      await page.goto(route);
      await expect(page).toHaveURL(/\/access-denied$/);
      await expectNoHorizontalOverflow(page, "/access-denied");
    });
  }
});
