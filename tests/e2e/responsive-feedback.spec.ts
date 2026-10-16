import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import type { Database } from "../../src/types/database";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Tên đăng nhập").fill("Khang.Nho");
  await page.locator("#password").fill(process.env.E2E_PASSWORD ?? "123456");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function fits(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
}

test("promotion cards separate people, remove mobile labels and preserve selection/details", async ({ page }, info) => {
  await login(page);
  await page.goto("/promotions");
  await page.waitForLoadState("networkidle");
  const person = page.locator("[data-promotion-person]").first();
  await expect(person).toBeVisible();
  if (page.viewportSize()!.width < 768) {
    await expect(page.locator(".promotion-roster thead")).toBeHidden();
    await expect(person.getByText("Thiếu nhi", { exact: true })).toHaveCount(0);
    await expect(person.getByText("Lớp", { exact: true })).toHaveCount(0);
    await expect(person.getByText("Đề xuất", { exact: true })).toHaveCount(0);
    const style = await person.evaluate(el => ({ border: getComputedStyle(el).borderTopWidth, margin: getComputedStyle(el).marginBottom }));
    expect(parseFloat(style.border)).toBeGreaterThanOrEqual(1);
    expect(parseFloat(style.margin)).toBeGreaterThanOrEqual(8);
  } else {
    await expect(page.locator(".promotion-roster thead")).toBeVisible();
  }
  const choose = person.getByRole("checkbox");
  await page.screenshot({ path: info.outputPath("promotion-cards.png") });
  await choose.check();
  await expect(page.getByText("Đã chọn 1 em", { exact: true })).toBeVisible();
  await person.getByRole("button", { name: /Mở chi tiết của/ }).click();
  await expect(person.getByLabel("Ghi chú đại diện")).toBeVisible();
  await fits(page);
  await page.screenshot({ path: info.outputPath("promotions.png"), fullPage: true });
  await person.getByRole("button", { name: /Đóng chi tiết của/ }).click();
  await expect(person.getByLabel("Ghi chú đại diện")).toHaveCount(0);
  await expect(choose).toBeChecked();
  await choose.uncheck();
});

test("directories have readable desktop cell spacing and every module fits", async ({ page }, info) => {
  test.setTimeout(180_000);
  await login(page);
  for (const path of ["/staff", "/students", "/classes", "/results", "/teaching-plan", "/attendance", "/reports/snapshots", "/imports", "/committees", "/notifications", "/reports", "/admin", "/dashboard", "/account"]) {
    await page.goto(path);
    await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toBeVisible();
    await fits(page);
    if (page.viewportSize()!.width >= 768) {
      const paddings = await page.locator('[data-entity-table] th[data-column], [data-entity-table] td[data-column]').evaluateAll(nodes => nodes.filter(node => node.getBoundingClientRect().width > 0).map(node => ({ top: parseFloat(getComputedStyle(node).paddingTop), right: parseFloat(getComputedStyle(node).paddingRight) })));
      for (const padding of paddings) { expect(padding.top, path).toBeGreaterThanOrEqual(8); expect(padding.right, path).toBeGreaterThanOrEqual(12); }
    }
    await page.screenshot({ path: info.outputPath(`${path.slice(1).replaceAll("/", "-")}.png`), fullPage: true });
  }
});

test("admin search clears and stays typed, isolated from account password forms", async ({ page }, info) => {
  await login(page);
  await page.goto("/admin?section=accounts");
  await page.waitForLoadState("networkidle");
  const search = page.getByRole("searchbox", { name: "Tìm tài khoản", exact: true });
  await expect(search).toBeVisible();
  await search.fill("KHANG.NHO");
  await expect(page.getByText("1 tài khoản · trang 1/1")).toBeVisible();
  await search.clear();
  await search.pressSequentially("GLV910");
  await expect(search).toHaveValue("GLV910");
  await page.getByLabel("Lọc theo trạng thái").selectOption("active");
  await expect(search).toHaveValue("GLV910");
  await expect(page.getByText("1 tài khoản · trang 1/1")).toBeVisible();
  const ownership = await search.evaluate(input => {
    const field = input as HTMLInputElement;
    return { formRole: field.form?.getAttribute("role"), complete: field.autocomplete, passwordCount: field.form?.querySelectorAll('input[type="password"]').length };
  });
  expect(ownership).toEqual({ formRole: "search", complete: "off", passwordCount: 0 });
  await page.getByRole("button", { name: "Quản lý", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Tài khoản GLV910", exact: true });
  await expect(dialog.locator('input[type="password"]')).toHaveAttribute("autocomplete", "new-password");
  await page.keyboard.press("Escape");
  await expect(search).toHaveValue("GLV910");
  await search.clear();
  await expect(search).toHaveValue("");
  await page.reload();
  await expect(search).toHaveValue("");
  await fits(page);
  await page.screenshot({ path: info.outputPath("admin-search.png"), fullPage: true });
});

test("committee picker combines name sector class, selects a person and keeps draft", async ({ page }, info) => {
  await login(page);
  await page.goto("/committees/30000000-0000-0000-0000-000000000002?tab=members");
  await page.getByRole("button", { name: "Thêm thành viên", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Thêm thành viên", exact: true });
  const sector = dialog.getByLabel("Ngành", { exact: true });
  const firstSector = await sector.locator('option:not([value="all"]):not([value="unassigned"])').first().getAttribute("value");
  expect(firstSector).toBeTruthy();
  await sector.selectOption(firstSector!);
  const classFilter = dialog.getByLabel("Lớp", { exact: true });
  const classOption = classFilter.locator('option:not([value="all"])').first();
  const classId = (await classOption.getAttribute("value"))!;
  const className = (await classOption.textContent())!;
  await classFilter.selectOption(classId);
  const people = dialog.getByRole("radio");
  expect(await people.count()).toBeGreaterThan(0);
  for (const radio of await people.all()) await expect(radio.locator("..")).toContainText(className);
  const person = dialog.locator('input[type="radio"]:not(:disabled)').first();
  const name = (await person.getAttribute("aria-label"))!;
  const unaccented = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
  await dialog.getByRole("searchbox", { name: "Tìm theo tên" }).fill(unaccented);
  await expect(person).toBeVisible();
  await person.check();
  await expect(dialog.getByRole("button", { name: "Thêm vào Ban", exact: true })).toBeEnabled();
  await expect(dialog.locator('input[name="staffProfileId"]')).toHaveValue((await person.getAttribute("value"))!);
  await dialog.getByRole("searchbox", { name: "Tìm theo tên" }).fill("KhongTrungBatKyAi");
  await expect(dialog.getByText(/Không tìm thấy nhân sự phù hợp/)).toBeVisible();
  await expect(dialog.getByText("Người đã chọn đang nằm ngoài bộ lọc hiện tại.")).toBeVisible();
  await dialog.getByRole("button", { name: "Xóa bộ lọc" }).click();
  await fits(page);
  const rosterBox = (await dialog.getByRole("radiogroup", { name: "Nhân sự để thêm vào Ban" }).boundingBox())!;
  const footerBox = (await dialog.getByText("Đã chọn:", { exact: false }).boundingBox())!;
  expect(rosterBox.y + rosterBox.height).toBeLessThanOrEqual(footerBox.y);
  await expect(dialog.getByRole("button", { name: "Thêm vào Ban", exact: true })).toBeInViewport();
  await page.screenshot({ path: info.outputPath("committee-picker.png") });
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await page.getByRole("button", { name: "Thêm thành viên", exact: true }).click();
  await expect(dialog.getByRole("radio", { name, exact: true })).toBeChecked();
});

test("committee picker saves the chosen member and clears the successful draft", async ({ page }, info) => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || !/^http:\/\/(127\.0\.0\.1|localhost):/.test(url)) throw new Error("Local database required");
  const db = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const staffId = randomUUID();
  const name = `Thành viên kiểm thử ${info.project.name} ${staffId.slice(0, 8)}`;
  const committeeId = "30000000-0000-0000-0000-000000000002";
  const { error } = await db.from("staff_profiles").insert({ id: staffId, full_name: name, title: "anh", service_status: "active" });
  expect(error).toBeNull();
  try {
    await login(page);
    await page.goto(`/committees/${committeeId}?tab=members`);
    await page.getByRole("button", { name: "Thêm thành viên", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Thêm thành viên", exact: true });
    await dialog.getByRole("searchbox", { name: "Tìm theo tên" }).fill(name);
    await dialog.getByRole("radio", { name, exact: true }).check();
    await dialog.getByLabel("Chức vụ", { exact: true }).selectOption("deputy");
    await dialog.getByRole("button", { name: "Thêm vào Ban", exact: true }).click();
    await expect(page.getByText("Đã thêm nhân sự vào Ban.").first()).toBeVisible();
    const { data, error: readError } = await db.from("committee_memberships").select("committee_id, position, is_active").eq("staff_profile_id", staffId);
    expect(readError).toBeNull();
    expect(data).toEqual([{ committee_id: committeeId, position: "deputy", is_active: true }]);
    await expect(dialog.getByRole("button", { name: "Thêm vào Ban", exact: true })).toBeDisabled();
    await page.keyboard.press("Escape");
    await expect(page.getByText(name, { exact: true })).toBeVisible();
  } finally {
    const memberships = await db.from("committee_memberships").delete().eq("staff_profile_id", staffId);
    expect(memberships.error).toBeNull();
    const profile = await db.from("staff_profiles").delete().eq("id", staffId);
    expect(profile.error).toBeNull();
  }
});
