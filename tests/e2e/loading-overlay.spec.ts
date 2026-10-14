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
  await page.route("**/login", async (route) => {
    if (route.request().method() === "POST") await new Promise((resolve) => setTimeout(resolve, SLOW_MS));
    await route.continue();
  });

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.getByLabel("Tên đăng nhập").fill(username);
    await page.locator("input#password").fill(DEV_PASSWORD);
    await page.getByRole("button", { name: "Đăng nhập" }).click();
    await expectLuce(page);
    try {
      await page.waitForURL(/\/(dashboard|change-password)$/, { timeout: 10_000 });
      await expect(page).toHaveURL(/\/dashboard$/);
      await page.unroute("**/login");
      await waitForIdle(page);
      return;
    } catch {
      await page.goto("/login");
    }
  }
  throw new Error(`Không đăng nhập được bằng ${username}. Đã chạy seed:dev chưa?`);
}

/** Mở menu tài khoản hiện hành trước khi chọn liên kết, trên cả ba viewport. */
async function accountLink(page: Page) {
  await page.locator('[aria-label^="Mở tài khoản của"]:visible, summary[aria-label^="Menu tài khoản của"]:visible').click();
  return page.locator('a[href="/account"]:visible').first();
}

async function expectLuce(page: Page) {
  const overlay = page.getByTestId(LOADING_OVERLAY_TEST_ID);
  await expect(overlay).toBeVisible();
  const image = overlay.locator("img");
  await expect(image).toHaveAttribute("src", /^\/loading\/luce\d+\.jpg$/);
  await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true);
  await expect(overlay.locator("blockquote")).toHaveCount(1);
  await expect(overlay.locator("blockquote")).not.toBeEmpty();
  await expect(overlay.locator("figcaption")).not.toBeEmpty();
}

for (const reducedMotion of [false, true]) test(`Luce và Lời Chúa khi đăng nhập/chuyển trang${reducedMotion ? " — giảm chuyển động" : ""}`, async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: reducedMotion ? "reduce" : "no-preference" });
  await login(page, "GLV901");

  // Giữ lượt điều hướng để kiểm được ảnh/câu trong trạng thái đang chờ thật.
  await page.route("**/account**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, SLOW_MS));
    await route.continue();
  });

  const overlay = page.getByTestId(LOADING_OVERLAY_TEST_ID);
  await expect(overlay).toHaveCount(0);

  await (await accountLink(page)).click();

  await expectLuce(page);
  await expect(overlay).toHaveCSS("opacity", "1");
  await expect(overlay.locator("img")).toHaveCSS("animation-name", reducedMotion ? "none" : "loading-bob");
  const bounds = await overlay.locator("figure").boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  await page.screenshot({ path: info.outputPath(`luce-${reducedMotion ? "reduced" : "animated"}.png`) });
  // Trang trí cho mắt nhìn, KHÔNG phải vùng phát thông báo — nếu không nó cướp
  // `getByRole("status").first()` của `FormMessage` và đọc cả câu Kinh Thánh cho
  // trình đọc màn hình ở mỗi cú bấm.
  await expect(overlay).toHaveAttribute("aria-hidden", "true");
  await expect(overlay).toHaveAttribute("class", /pointer-events-none/);

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
