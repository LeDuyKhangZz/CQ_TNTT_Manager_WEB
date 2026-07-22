import { expect, test, type Page } from "@playwright/test";

/**
 * P7-T4 — privacy/security review, phần kiểm được bằng máy.
 *
 * Ba nhóm: header bảo vệ trình duyệt, ID rác không được làm sập server
 * (AGENTS §5), và RLS negative smoke qua đường direct URL — thứ mà ẩn nút không
 * ngăn được.
 */
const DEV_PASSWORD = "123456";
const BAD_UUID = "11111111-1111-4111-8111-111111111111"; // đúng dạng, không tồn tại
const NOT_A_UUID = "khong-phai-uuid";

async function login(page: Page, username: string) {
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

test("mọi trang trả về header bảo vệ trình duyệt", async ({ request }) => {
  const response = await request.get("/login");
  const headers = response.headers();

  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  // URL của app mang UUID thiếu nhi — không được rò sang miền khác.
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["strict-transport-security"]).toContain("max-age=");
  // Next tự tắt, nhưng để lộ phiên bản framework thì không có lợi gì.
  expect(headers["x-powered-by"]).toBeUndefined();
});

test("ID rác trả 404/điều hướng chứ không phải lỗi 500", async ({ page }) => {
  await login(page, "GLV901");

  const routes = [
    `/students/${BAD_UUID}`,
    `/students/${NOT_A_UUID}`,
    `/classes/${BAD_UUID}`,
    `/classes/${NOT_A_UUID}`,
    `/committees/${NOT_A_UUID}`,
    `/results/${NOT_A_UUID}`,
    `/teaching-plan/${NOT_A_UUID}`,
    `/attendance/${NOT_A_UUID}`,
  ];

  for (const route of routes) {
    const response = await page.goto(route);
    const status = response?.status() ?? 0;
    expect(status, `${route} không được trả 5xx`).toBeLessThan(500);
  }
});

test("GLV lớp mở thẳng URL lớp khác vẫn bị chặn", async ({ page, browser }) => {
  // GLV910 dạy Ấu 1A. Lấy id lớp Ấu 1B bằng phiên global-write rồi mở chính
  // URL đó bằng một phiên độc lập của GLV910 — ẩn nút không phải
  // authorization (AGENTS §5). Hai context riêng để không phải đăng xuất.
  await login(page, "GLV901");
  await page.goto("/classes");
  const links = page.locator('a[href^="/classes/"]');
  await expect(links.first()).toBeVisible();

  const otherClassHref = await links
    .filter({ hasText: "Ấu 1B" })
    .first()
    .getAttribute("href");
  expect(otherClassHref, "fixture phải có lớp Ấu 1B").toBeTruthy();

  const classTeacherContext = await browser.newContext();
  try {
    const classTeacherPage = await classTeacherContext.newPage();
    await login(classTeacherPage, "GLV910");

    const response = await classTeacherPage.goto(otherClassHref!);
    expect(response?.status() ?? 0, "lớp khác không được trả 5xx").toBeLessThan(500);
    // Không được thấy một em nào của lớp khác.
    await expect(classTeacherPage.locator('a[href^="/students/"]')).toHaveCount(0);
  } finally {
    await classTeacherContext.close();
  }
});
