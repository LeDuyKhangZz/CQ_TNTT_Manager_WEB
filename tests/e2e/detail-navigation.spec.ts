import { expect, test, type Locator, type Page } from "@playwright/test";

async function login(page: Page, username = "Khang.Nho") {
  await page.goto("/login");
  await page.getByLabel("Tên đăng nhập").fill(username);
  await page.locator("#password").fill(process.env.E2E_PASSWORD ?? "123456");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByRole("main").getByRole("heading", { level: 1 }).waitFor();
}

async function fits(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
}

/** Click padding, deliberately away from names, icons and action controls. */
async function openRowPadding(page: Page, row: Locator, href: string) {
  await row.scrollIntoViewIfNeeded();
  const box = (await row.boundingBox())!;
  const x = Math.min(box.width - 5, page.viewportSize()!.width - box.x - 24);
  await row.click({ position: { x, y: box.height - 5 } });
  await expect(page).toHaveURL(new RegExp(href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$"));
  await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toBeVisible();
}

test("Detail navigation: staff row padding and keyboard open the profile; edit stays independent", async ({ page }, info) => {
  await login(page);
  await page.goto("/staff");
  const row = page.locator('[data-table-id="staff-directory"] tbody tr').first();
  const link = row.locator("[data-row-link]");
  const href = (await link.getAttribute("href"))!;
  await fits(page);
  await page.screenshot({ path: info.outputPath("staff-list.png"), fullPage: true });
  await openRowPadding(page, row, href);
  await expect(page.locator("[data-entity-header]")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Hồ sơ", exact: true })).toBeVisible();
  await fits(page);
  await page.screenshot({ path: info.outputPath("staff-detail.png"), fullPage: true });
  await page.getByRole("button", { name: "Sửa hồ sơ", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Sửa hồ sơ", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("link", { name: "Danh sách nhân sự", exact: true }).click();
  await link.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(new RegExp(href + "$"));
});

test("Detail navigation: student row opens, phone stays a call, all profile sections fit", async ({ page }, info) => {
  await login(page);
  await page.goto("/students");
  const row = page.locator('[data-entity-table] tbody tr').filter({ has: page.locator('a[href^="tel:"]') }).first();
  const call = row.locator('a[href^="tel:"]').first();
  const phone = await call.getAttribute("href");
  await page.evaluate(() => document.addEventListener("click", event => {
    const anchor = (event.target as Element).closest<HTMLAnchorElement>('a[href^="tel:"]');
    if (anchor) { event.preventDefault(); document.body.dataset.calledPhone = anchor.getAttribute("href")!; }
  }, { capture: true }));
  await call.click();
  await expect(page.locator("body")).toHaveAttribute("data-called-phone", phone!);
  await expect(page).toHaveURL(/\/students$/);
  const href = (await row.locator("[data-row-link]").getAttribute("href"))!;
  await openRowPadding(page, row, href);
  const tabs = page.getByRole("navigation", { name: "Thông tin thiếu nhi" });
  await expect(tabs.getByRole("link")).toHaveCount(6);
  for (const link of await tabs.getByRole("link").all()) {
    const box = (await link.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  }
  await fits(page);
  await page.screenshot({ path: info.outputPath("student-detail.png"), fullPage: true });
  for (const name of ["Gia đình", "Lớp & Ghi danh", "Bí tích", "Sức khỏe", "Chuyên cần", "Tổng quan"]) {
    await tabs.getByRole("link", { name, exact: true }).click();
    await expect(tabs.getByRole("link", { name, exact: true })).toHaveAttribute("aria-current", "page");
    await fits(page);
  }
  await page.locator("summary").filter({ hasText: "Thao tác khác" }).click();
  const menu = page.getByRole("menu", { name: "Thao tác khác", exact: true });
  await expect(menu).toBeVisible();
  await fits(page);
  await menu.getByRole("menuitem", { name: "Đổi trạng thái hồ sơ", exact: true }).click({ timeout: 10_000 });
  await expect(page.getByRole("dialog", { name: "Trạng thái hồ sơ", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("Detail navigation: class and roster padding navigate; enrollment button opens its own sheet", async ({ page }, info) => {
  await login(page);
  await page.goto("/classes");
  const row = page.locator('[data-linked-row]').filter({ has: page.getByRole("link", { name: "Ấu 1A", exact: true }) }).first();
  const href = (await row.locator("[data-row-link]").getAttribute("href"))!;
  await openRowPadding(page, row, href);
  await fits(page);
  await page.screenshot({ path: info.outputPath("class-detail.png"), fullPage: true });
  const student = page.locator("[data-entity-row]").first();
  const studentHref = (await student.locator('a[href^="/students/"]').getAttribute("href"))!;
  await student.getByRole("button", { name: "Quản lý ghi danh", exact: true }).click();
  await expect(page.getByRole("dialog", { name: /^Ghi danh ·/ })).toBeVisible();
  await expect(page).toHaveURL(new RegExp(href + "$"));
  await page.keyboard.press("Escape");
  await openRowPadding(page, student, studentHref);
});

test("Detail navigation: work lists and committee surfaces open their destination", async ({ page }, info) => {
  test.setTimeout(90_000);
  await login(page);
  for (const route of ["/results", "/teaching-plan", "/attendance", "/committees", "/imports", "/reports/snapshots"]) {
    await page.goto(route);
    await fits(page);
    const row = page.locator("[data-linked-row]").first();
    const card = page.locator("[data-entity-link]").first();
    if (await row.count()) {
      const download = row.locator('a[href*="/export?"]').first();
      if (await download.count()) {
        const downloadHref = await download.getAttribute("href");
        await page.evaluate(() => document.addEventListener("click", event => {
          const anchor = (event.target as Element).closest<HTMLAnchorElement>('a[href*="/export?"]');
          if (anchor) { event.preventDefault(); document.body.dataset.downloadHref = anchor.getAttribute("href")!; }
        }, { capture: true }));
        await download.click({ timeout: 10_000 });
        await expect(page.locator("body")).toHaveAttribute("data-download-href", downloadHref!);
        expect(new URL(page.url()).pathname).toBe(route);
      }
      const href = (await row.locator("[data-row-link]").getAttribute("href"))!;
      await openRowPadding(page, row, href);
      await fits(page);
    } else if (await card.count()) {
      const href = (await card.getAttribute("href"))!;
      await openRowPadding(page, card, href);
      await fits(page);
    } else {
      // Real empty directories are valid; document the fixture gap explicitly.
      info.annotations.push({ type: "empty-fixture", description: route });
      await expect(page.getByRole("main")).toContainText(/Chưa có|Không có/);
    }
  }
});

test("Detail navigation: full row links work without JavaScript", async ({ page, browser }) => {
  await login(page);
  const context = await browser.newContext({ javaScriptEnabled: false, storageState: await page.context().storageState(), viewport: page.viewportSize()! });
  try {
    const plain = await context.newPage();
    for (const route of ["/staff", "/students", "/classes"]) {
      await plain.goto(route);
      const row = plain.locator("[data-linked-row]").first();
      const href = (await row.locator("[data-row-link]").getAttribute("href"))!;
      await openRowPadding(plain, row, href);
      await fits(plain);
    }
  } finally { await context.close(); }
});

test("Detail navigation: treasurer has no false student detail affordance", async ({ page }) => {
  await login(page, "GLV904");
  await page.goto("/students");
  await expect(page.locator('[data-row-link], [data-linked-row]')).toHaveCount(0);
  await expect(page.locator('main a[href^="/students/"]')).toHaveCount(0);
  await fits(page);
});
