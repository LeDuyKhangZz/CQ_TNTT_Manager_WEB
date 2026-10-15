import { openStudentFilter, applyStudentFilter, beginStudentCreation } from "./helpers/student-ui";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key || !/^http:\/\/(localhost|127\.0\.0\.1):/.test(url)) throw new Error("R4 tests require local Supabase");
const db = createClient(url, key, { auth: { persistSession: false } });
const tag = `Rtest ${randomUUID().slice(0, 8).replace(/\d/g, digit => String.fromCharCode(103 + Number(digit)))}`;
const ids = Array.from({ length: 51 }, () => randomUUID());
let created = false;
const base = `/students?q=${encodeURIComponent(tag)}&status=temporarily_inactive`;
const rows = (page: Page) => page.getByRole("table", { name: "Danh sách thiếu nhi" }).locator("tbody tr");

async function login(page: Page, username = "GLV903") {
  await page.goto("/login");
  await page.getByLabel("Tên đăng nhập").fill(username);
  await page.locator("input#password").fill(process.env.E2E_PASSWORD ?? "123456");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test.beforeAll(async () => {
  // Dedicated, unassigned synthetic students; excluded from the default active list.
  const result = await db.from("students").insert(ids.map((id, index) => ({ id, saint_name: "Giuse", full_name: `${tag} ${String(index + 1).padStart(3, "0")}`, status: "temporarily_inactive" })));
  expect(result.error).toBeNull();
  created = true;
});
test.afterAll(async () => {
  // Exact IDs from this worker only; never touch enrollments or existing profiles.
  const result = await db.from("students").delete().in("id", ids).select("id");
  expect(result.error).toBeNull();
  expect(result.data).toHaveLength(created ? 51 : 0);
});

test("server sorting spans all 51 records; page size and clamping preserve the filters", async ({ page }) => {
  await login(page);
  await page.goto(`${base}&page=2`);
  await expect(rows(page)).toHaveCount(20);
  await expect(rows(page).first()).toContainText(`${tag} 021`);
  if (page.viewportSize()!.width >= 768) {
    await page.getByRole("columnheader", { name: /Tên thánh/ }).getByRole("link").click();
  } else {
    await page.goto(`${base}&dir=desc`);
  }
  await expect(rows(page).first()).toContainText(`${tag} 051`);
  expect(new URL(page.url()).searchParams.has("page")).toBe(false);
  await page.getByLabel("Số dòng mỗi trang").selectOption("50");
  await page.getByRole("button", { name: "Áp dụng", exact: true }).click();
  await expect(rows(page)).toHaveCount(50);
  await expect(rows(page).last()).toContainText(`${tag} 002`);
  await page.getByRole("link", { name: "Trang sau" }).click();
  await expect(rows(page)).toHaveCount(1);
  await expect(rows(page).first()).toContainText(`${tag} 001`);
  await page.goto(`${base}&size=50&page=9999&dir=desc`);
  await expect(rows(page)).toHaveCount(1);
  await expect(rows(page).first()).toContainText(`${tag} 001`);
});

test("multiple class choices include both classes; clearing all statuses means all", async ({ page }) => {
  await login(page);
  await page.goto("/students");
  let filters = await openStudentFilter(page,"class");
  await filters.getByRole("checkbox", { name: "Ấu 1A", exact: true }).check();
  await filters.getByRole("checkbox", { name: "Thiếu 1A", exact: true }).check();
  await applyStudentFilter(page,"class");
  expect(new URL(page.url()).searchParams.getAll("class")).toHaveLength(2);
  await expect(rows(page).filter({ hasText: "Nguyễn Minh An" })).toHaveCount(1);
  await expect(rows(page).filter({ hasText: "Đinh Gia Hân" })).toHaveCount(1);
  const selectedClass = new URL(page.url()).searchParams.get("class")!;
  await page.goto(`${base}&class=none&class=${selectedClass}`);
  await expect(page.getByText("51 hồ sơ · Tạm nghỉ", { exact: true })).toBeVisible();
  await expect(rows(page)).toHaveCount(20);
  await page.goto(base);
  filters = await openStudentFilter(page,"status");
  await filters.getByRole("checkbox", { name: "Tạm nghỉ", exact: true }).uncheck();
  await applyStudentFilter(page,"status");
  await expect(page.getByText("51 hồ sơ · Tất cả trạng thái", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Xoá bộ lọc" }).click();
  await expect(page.locator('input[name="q"]:visible')).toHaveValue("");
  filters = await openStudentFilter(page,"status");
  await expect(filters.getByRole("checkbox", { name: "Đang sinh hoạt", exact: true })).toBeChecked();
  await expect(filters.getByRole("checkbox", { name: "Tạm nghỉ", exact: true })).not.toBeChecked();
});

test("data appears early, compact rows fit ten records, and the page does not overflow", async ({ page }, testInfo) => {
  await login(page);
  await page.goto(base);
  await expect(rows(page)).toHaveCount(20);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  const first = await rows(page).first().boundingBox();
  expect(first!.y).toBeLessThanOrEqual(page.viewportSize()!.width === 1366 ? 300 : 400);
  if (page.viewportSize()!.width === 1366) {
    expect(first!.height).toBeGreaterThanOrEqual(44);
    expect(first!.height).toBeLessThanOrEqual(48);
    const tenth = await rows(page).nth(9).boundingBox();
    expect(tenth!.y + tenth!.height).toBeLessThanOrEqual(768);
  }
  await page.screenshot({ path: testInfo.outputPath("students-list.png"), fullPage: false });
});

test("column preference survives reload and keeps metadata accessible on mobile", async ({ page }) => {
  await login(page);
  await page.goto("/students?q=nguyen+minh+an");
  const phone = rows(page).first().locator('a[href^="tel:"]');
  await expect(phone).toBeVisible();
  expect(await phone.getAttribute("href")).toContain("0912000001");
  if (page.viewportSize()!.width >= 768) {
    await page.locator('summary[aria-label="Chọn cột hiển thị"]').click();
    await page.getByRole("menuitemcheckbox", { name: "Điện thoại", exact: true }).uncheck();
    await page.keyboard.press("Escape");
    await expect(phone).toBeHidden();
    await page.reload();
    await expect(phone).toBeHidden();
    await page.setViewportSize({ width: 360, height: 800 });
    await expect(phone).toBeVisible();
  }
  const cell = rows(page).first().locator('[data-column="phone"]');
  await cell.click({position:{x:4,y:4}});
  await expect(page).toHaveURL(/\/students\/[a-f0-9-]+$/);
});

test("creation forms live in a drawer and Escape keeps applied filters", async ({ page }) => {
  await login(page);
  await page.goto(`${base}&size=50`);
  await expect(page.getByRole("form", { name: "Thêm thiếu nhi", exact: true })).toHaveCount(0);
  await beginStudentCreation(page);
  const drawer = page.getByRole("dialog", { name: "Thêm thiếu nhi", exact: true });
  await expect(drawer.getByRole("form", { name: "Thêm thiếu nhi", exact: true })).toBeVisible();
  await expect.poll(() => drawer.evaluate(element => element.getAnimations().length)).toBe(0);
  const bounds = await drawer.boundingBox();
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.y + bounds!.height).toBeCloseTo(page.viewportSize()!.height, 0);
  expect(bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  if (page.viewportSize()!.width >= 768) expect(bounds!.y).toBe(0);
  await drawer.getByRole("link", { name: "Quay lại", exact: true }).click();
  await page.getByRole("link", { name: "Thêm người giám hộ", exact: true }).click();
  await expect(page.getByRole("form", { name: "Thêm người giám hộ", exact: true })).toBeVisible();
  const guardianDrawer = page.getByRole("dialog", { name: "Thêm người giám hộ", exact: true });
  await expect.poll(() => guardianDrawer.evaluate(element => element.getAnimations().length)).toBe(0);
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("hidden");
  await guardianDrawer.press("Escape");
  await expect.poll(() => new URL(page.url()).searchParams.get("new")).toBeNull();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(rows(page)).toHaveCount(50);
  expect(new URL(page.url()).searchParams.get("q")).toBe(tag);
});

test("no-JavaScript search, facet submission and drawer links remain usable", async ({ browser, page }) => {
  await login(page);
  const context = await browser.newContext({ javaScriptEnabled: false, storageState: await page.context().storageState(), viewport: page.viewportSize()! });
  try {
    const plain = await context.newPage();
    plain.setDefaultTimeout(8_000);
    await plain.goto(base);
    await expect(rows(plain)).toHaveCount(20);
    const facet = await openStudentFilter(plain,"class");
    await facet.getByRole("checkbox", { name: "Chưa xếp lớp", exact: true }).check();
    await applyStudentFilter(plain,"class");
    expect(new URL(plain.url()).searchParams.get("class")).toBe("none");
    await expect(rows(plain)).toHaveCount(20);
    await plain.locator('input[name="q"]:visible').fill(`${tag} 051`);
    await plain.getByRole("button", { name: plain.viewportSize()!.width < 768 ? "Tìm thiếu nhi" : "Lọc", exact: true }).click();
    await expect(rows(plain)).toHaveCount(1);
    await expect(rows(plain).first()).toContainText(`${tag} 051`);
    await test.step("Open the native drawer link", async () => {
      await beginStudentCreation(plain);
      await expect(plain.getByRole("dialog").getByRole("form", { name: "Thêm thiếu nhi", exact: true })).toBeVisible();
    });
    await test.step("Close the native drawer link", async () => {
      // Wait for the real CSS transition before asking the no-JS browser to
      // retry actionability. No forced click or disabled animation.
      await expect.poll(() => plain.getByRole("dialog").evaluate(element => element.getAnimations().length)).toBe(0);
      await plain.getByRole("link", { name: "Đóng", exact: true }).click();
      await expect(plain.getByRole("dialog")).toHaveCount(0);
    });
  } finally { await context.close(); }
});

test("treasurer can paginate the limited directory without profile links or creation", async ({ page }) => {
  await login(page, "GLV904");
  await page.goto(`${base}&size=50&page=2&new=1`);
  await expect(rows(page)).toHaveCount(1);
  await expect(rows(page).first()).toContainText(`${tag} 051`);
  await expect(page.getByRole("table").locator('a[href^="/students/"]')).toHaveCount(0);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText(/Chế độ chỉ xem theo quyền Thủ quỹ/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Thêm thiếu nhi", exact: true })).toHaveCount(0);
});
