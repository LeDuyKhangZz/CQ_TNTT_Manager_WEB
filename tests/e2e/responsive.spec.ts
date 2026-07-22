import { expect, test, type Page } from "@playwright/test";

/**
 * P7-T1 — responsive QA cho toàn bộ route nghiệp vụ, không chỉ Phase 2.
 *
 * Từng phase trước chỉ kiểm tràn ngang trên vài trang mình vừa làm. Ở đây quét
 * một lượt mọi trang bằng một phiên global-write, ở cả ba viewport, và kiểm
 * thêm kích thước vùng bấm — 360px là màn hình thật của giáo lý viên đứng lớp
 * (docs/06, AGENTS §8).
 */
const DEV_PASSWORD = "123456";
const MIN_TAP_TARGET = 44;

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

/**
 * Chờ trang dựng xong rồi mới đo. Bản đầu chỉ chờ `domcontentloaded` và đo
 * trúng lúc bố cục chưa xong: phần tử còn 0×0 nên bị bỏ qua, `/imports` lọt
 * lưới hai lần liền rồi mới bị bắt. Đo sớm thì test xanh giả.
 */
async function waitForLayout(page: Page) {
  await page.waitForLoadState("load");
  const main = page.getByRole("main");
  if (await main.count()) await main.first().waitFor({ state: "visible" });
}

async function expectNoHorizontalOverflow(page: Page, route: string) {
  await waitForLayout(page);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow, `${route} tràn ngang ${overflow}px`).toBeLessThanOrEqual(1);
}

/**
 * Nút và mục điều hướng phải đủ lớn để bấm bằng ngón tay. Chỉ đo phần tử điều
 * khiển thật — link trong câu văn cố ý bỏ qua, ép chúng cao 44px sẽ làm vỡ dòng
 * chữ mà chẳng ai được lợi.
 *
 * Ô tick đo theo `<label>` bao quanh chứ không theo chính cái ô: ô tick gốc của
 * trình duyệt luôn 16–20px, vùng bấm thật là cả dòng nhãn.
 */
async function expectTapTargets(page: Page, route: string) {
  await waitForLayout(page);
  const undersized = await page.evaluate((minimum) => {
    const controls = document.querySelectorAll<HTMLElement>(
      'button, [role="button"], nav a[href], header a[href], input[type="checkbox"], input[type="radio"], select',
    );
    const offenders: string[] = [];

    const hitArea = (control: HTMLElement) => {
      if (control instanceof HTMLInputElement && (control.type === "checkbox" || control.type === "radio")) {
        const label =
          control.closest("label") ??
          (control.id ? document.querySelector<HTMLLabelElement>(`label[for="${control.id}"]`) : null);
        if (label) return label.getBoundingClientRect();
      }
      return control.getBoundingClientRect();
    };

    for (const control of controls) {
      const box = hitArea(control);
      if (box.width === 0 && box.height === 0) continue; // ẩn
      if (box.height + 0.5 < minimum || box.width + 0.5 < minimum) {
        const label =
          control.getAttribute("aria-label") ??
          control.textContent?.trim().slice(0, 40) ??
          control.getAttribute("name") ??
          control.tagName;
        offenders.push(
          `${control.tagName.toLowerCase()} "${label}" ${Math.round(box.width)}×${Math.round(box.height)}`,
        );
      }
    }
    return offenders;
  }, MIN_TAP_TARGET);

  expect(undersized, `${route} có vùng bấm nhỏ hơn ${MIN_TAP_TARGET}px`).toEqual([]);
}

const GLOBAL_WRITE_ROUTES = [
  "/dashboard",
  "/notifications",
  "/account",
  "/students",
  "/classes",
  "/staff",
  "/attendance",
  "/teaching-plan",
  "/results",
  "/promotions",
  "/committees",
  "/reports",
  "/imports",
];

test.describe("Responsive QA toàn hệ thống", () => {
  test("mọi trang của Xứ đoàn trưởng vừa khung và bấm được", async ({ page }) => {
    await login(page, "GLV901");

    for (const route of GLOBAL_WRITE_ROUTES) {
      await page.goto(route);
      await expect(page).toHaveURL(new RegExp(`${route}$`));
      await expectNoHorizontalOverflow(page, route);
      await expectTapTargets(page, route);
    }
  });

  test("trang quản trị của Super Admin vừa khung và bấm được", async ({ page }) => {
    await login(page, "Khang.Nho");
    await page.goto("/admin");
    await expectNoHorizontalOverflow(page, "/admin");
    await expectTapTargets(page, "/admin");
  });

  test("portal phụ huynh vừa khung và bấm được", async ({ page }) => {
    await login(page, "84912000001");
    for (const route of ["/dashboard", "/parent/absence-requests"]) {
      await page.goto(route);
      await expectNoHorizontalOverflow(page, route);
      await expectTapTargets(page, route);
    }
  });
});
