import { createClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";
import { getAllFeaturesNavigation } from "../../src/config/navigation";
import { APP_ROLES, getAudienceForRole, getScopeKindForRole, type AppRole } from "../../src/lib/permissions/roles";

const accounts: Partial<Record<AppRole, string>> = {
  super_admin: "Khang.Nho", parish_priest: "ChaSo", chaplain: "ChaPho", group_leader: "GLV901",
  deputy_group_leader: "GLV902", secretary: "GLV903", treasurer: "GLV904", sector_leader: "GLV905",
  sector_deputy: "GLV906", class_representative: "GLV909", class_teacher: "GLV910", trainee_assistant: "GLV911", guardian: "84912000001",
};
async function login(page: Page, role: AppRole = "super_admin") {
  let username = accounts[role];
  if (!username) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(url)) throw new Error("Local fixtures only");
    const client = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
    const { data, error } = await client.from("students").select("profile_id").not("profile_id", "is", null).eq("status", "active").limit(1).single();
    expect(error).toBeNull();
    const profile = await client.from("profiles").select("username").eq("id", data!.profile_id).single();
    expect(profile.error).toBeNull(); username = profile.data!.username;
  }
  await page.goto("/login");
  await page.getByLabel("Tên đăng nhập").fill(username!);
  await page.locator("input#password").fill(process.env.E2E_PASSWORD ?? "123456");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByRole("main").getByRole("heading", { level: 1 }).waitFor();
}
async function fits(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
}
for (const role of APP_ROLES) {
  test(`Mobile module review: ${role}`, async ({ page }, info) => {
    test.skip(info.project.name !== "mobile-360", "All roles on phone; separate tablet/desktop interaction checks below.");
    test.setTimeout(180_000);
    const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
    await login(page, role);
    const viewer = { role, audience: getAudienceForRole(role), scopeKind: getScopeKindForRole(role), hasGuardianProfile: role === "class_teacher" };
    for (const item of getAllFeaturesNavigation(viewer)) {
      const response = await page.goto(item.href);
      expect(response?.status(), item.href).toBeLessThan(400);
      await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.getByRole("main")).not.toContainText("Không có quyền truy cập");
      await fits(page);
      await page.screenshot({ path: info.outputPath(`${role}-${item.href.replaceAll("/", "_")}.png`) });
    }
    expect(errors).toEqual([]);
  });
}

test("Staff create and edit open focused forms; closing keeps the list position", async ({ page }) => {
  await login(page);
  await page.goto("/staff");
  const before = await page.evaluate(() => scrollY);
  await page.getByRole("link", { name: "Thêm nhân sự", exact: true }).click();
  const create = page.getByRole("dialog", { name: "Thêm nhân sự" });
  await expect(create).toBeVisible(); await fits(page);
  await expect(create.getByLabel("Họ tên", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(create).toHaveCount(0);
  expect(await page.evaluate(() => scrollY)).toBe(before);
  await page.locator('main a[href^="/staff/"]:not([href="/staff/bulk"])').first().click();
  const edit = page.getByRole("button", { name: "Sửa hồ sơ", exact: true });
  await expect(edit).toHaveAttribute("aria-haspopup", "dialog");
  await edit.click();
  const sheet = page.getByRole("dialog", { name: "Sửa hồ sơ", exact: true });
  await expect(sheet).toBeVisible();
  const input = sheet.locator('input[name="fullName"]');
  const original = await input.inputValue();
  await input.fill(`${original} test draft`);
  await page.keyboard.press("Escape"); await expect(edit).toBeFocused();
  await edit.click(); await expect(input).toHaveValue(`${original} test draft`);
  await fits(page);
  // No save: this check never changes the staff record.
});

test("Roster details and report filters fit short phone screens", async ({ page }, info) => {
  await login(page);
  if (info.project.name === "mobile-360") await page.setViewportSize({ width: 390, height: 664 });
  await page.goto("/attendance");
  await page.locator('main a[href^="/attendance/"]').first().click();
  const row = page.locator("[data-roster-row]").first(); await row.waitFor();
  await expect(row.getByRole("combobox")).toHaveCount(2);
  for (const select of await row.getByRole("combobox").all()) await expect(select.locator("option")).toHaveCount(5);
  await row.locator("[data-roster-toggle]").click();
  const detail = page.getByRole("dialog");
  await expect(detail).toBeVisible(); await fits(page);
  await expect(detail.getByText("Phụ huynh không nhìn thấy.")).toBeVisible();
  await page.keyboard.press("Escape"); await expect(detail).toHaveCount(0);
  await page.goto("/reports");
  await page.getByRole("button", { name: "Lọc báo cáo" }).click();
  await expect(page.getByRole("dialog", { name: "Lọc báo cáo" })).toBeVisible(); await fits(page);
  await page.screenshot({ path: info.outputPath("report-filter.png") });
});

test("Staff and promotion filters apply from a sheet; progress opens in place", async ({ page }) => {
  await login(page);
  await page.goto("/staff");
  await page.getByRole("searchbox", { name: "Tìm theo họ tên" }).fill("An");
  await page.getByRole("button", { name: "Lọc", exact: true }).click();
  const staffFilter = page.getByRole("dialog", { name: "Bộ lọc nhân sự" });
  await expect(staffFilter).toBeVisible(); await fits(page);
  await staffFilter.getByRole("button", { name: "Áp dụng bộ lọc" }).click();
  await expect(page).toHaveURL(/q=An/);
  await expect(staffFilter).toHaveCount(0);
  await page.goto("/promotions");
  await page.getByRole("button", { name: "Bộ lọc", exact: true }).click();
  const filter = page.getByRole("dialog", { name: "Lọc danh sách chuyển lớp" });
  await filter.getByRole("searchbox", { name: "Tìm tên thiếu nhi" }).fill("An");
  await filter.getByRole("button", { name: "Lọc", exact: true }).click();
  await expect(page).toHaveURL(/q=An/);
  await expect(filter).toHaveCount(0);
  const position = await page.evaluate(() => scrollY);
  await page.getByRole("button", { name: "Tiến độ theo lớp", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Tiến độ theo lớp", exact: true })).toBeVisible();
  expect(await page.evaluate(() => scrollY)).toBe(position);
  expect(new URL(page.url()).hash).toBe("");
  await fits(page);
});
