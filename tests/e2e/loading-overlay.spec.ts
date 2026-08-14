import { expect, test, type Page } from "@playwright/test";
import { LOADING_OVERLAY_TEST_ID, waitForIdle } from "./utils/wait-for-idle";

/**
 * Màn hình chờ toàn cục — kế hoạch 17 Đợt A, `09` §12 A3/A4.
 *
 * 🔴 Độ chậm ở đây là **giả và có kiểm soát** (`page.route` giữ lượt lấy dữ liệu
 * lại 2 giây), không phải chờ máy chậm thật. Một bài đo "trang này thường lâu hơn
 * 1 giây" là bài xanh-đỏ tuỳ máy — đúng loại nợ ổn định mà `P3-UX-001` đang dọn.
 *
 * Cần DB local đã `npm run db:reset && npm run seed:dev`.
 */
const DEV_PASSWORD = "123456";
const SLOW_MS = 2000;

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

/** Mục `Tài khoản` có mặt ở cả thanh bên (≥1024px) lẫn thanh dưới — cả 3 viewport. */
function accountLink(page: Page) {
  return page.locator('a[href="/account"]:visible').first();
}

test("điều hướng chậm: cửa sổ chờ hiện rồi tự biến mất", async ({ page }) => {
  await login(page, "GLV901");

  // Giữ lượt điều hướng lại đúng 2 giây — vượt ngưỡng 1 giây của `SHOW_AFTER_MS`.
  await page.route("**/account**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, SLOW_MS));
    await route.continue();
  });

  const overlay = page.getByTestId(LOADING_OVERLAY_TEST_ID);
  await expect(overlay).toHaveCount(0);

  await accountLink(page).click();

  await expect(overlay).toBeVisible({ timeout: 10_000 });
  await expect(overlay).toHaveAttribute("role", "status");
  await expect(overlay).toHaveAttribute("aria-live", "polite");

  // Không phải hộp thoại: `Escape` KHÔNG đóng được, và focus vẫn ở nơi cũ.
  await page.keyboard.press("Escape");
  await expect(overlay).toBeVisible();
  const focusInsideOverlay = await page.evaluate((testId) => {
    const box = document.querySelector(`[data-testid="${testId}"]`);
    return box !== null && document.activeElement !== null && box.contains(document.activeElement);
  }, LOADING_OVERLAY_TEST_ID);
  expect(focusInsideOverlay, "màn hình chờ không được cướp focus").toBe(false);

  await page.unroute("**/account**");
  await waitForIdle(page);

  // Ẩn là UNMOUNT HẲN — không còn phần tử nào đứng chặn cú bấm tiếp theo.
  await expect(overlay).toHaveCount(0);
  await expect(page).toHaveURL(/\/account$/);
});

/**
 * ⏸️ CỐ Ý KHÔNG có bài E2E cho vế *"thao tác nhanh thì không chớp overlay"*.
 *
 * Vế ấy là một phép đo **đồng hồ treo tường**: nó chỉ xanh khi DB local trả lời
 * dưới một giây, và sẽ đỏ trên máy đang tải nặng dù mã hoàn toàn đúng. Bộ 585 bài
 * đang có nợ ổn định đúng loại này (`P3-UX-001`), thêm một nguồn nhiễu nữa là đi
 * ngược việc đang làm. Vế ấy được canh bằng **đồng hồ giả**, tất định, ở
 * `tests/unit/loading-provider.test.tsx` — nơi 1000ms là 1000ms.
 */
