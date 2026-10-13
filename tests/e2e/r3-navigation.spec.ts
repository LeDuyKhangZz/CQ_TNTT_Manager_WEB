import { createClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";
import { getAllFeaturesNavigation, getMobileNavigation } from "../../src/config/navigation";
import { APP_ROLES, getAudienceForRole, getScopeKindForRole, type AppRole } from "../../src/lib/permissions/roles";

const users: Partial<Record<AppRole, string>> = {
  super_admin: "Khang.Nho", parish_priest: "ChaSo", chaplain: "ChaPho",
  group_leader: "GLV901", deputy_group_leader: "GLV902", secretary: "GLV903", treasurer: "GLV904",
  sector_leader: "GLV905", sector_deputy: "GLV906", class_representative: "GLV909",
  class_teacher: "GLV910", trainee_assistant: "GLV911", guardian: "84912000001",
};
const password = process.env.E2E_PASSWORD ?? "123456";

async function studentUsername() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || !/^http:\/\/(localhost|127\.0\.0\.1):/.test(url)) throw new Error("R3 checks require local seeded Supabase");
  const client = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await client.from("students").select("profile_id").not("profile_id", "is", null).eq("status", "active").limit(1).single();
  expect(error).toBeNull();
  const profile = await client.from("profiles").select("username").eq("id", data!.profile_id).single();
  expect(profile.error).toBeNull();
  return profile.data!.username as string;
}

async function login(page: Page, username: string) {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Tên đăng nhập").fill(username);
  await page.locator("input#password").fill(password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("main").getByRole("heading", { name: "Tổng quan", exact: true })).toBeVisible();
  await page.waitForLoadState("networkidle");
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
}
async function signOut(page: Page) {
  await page.locator('summary[aria-label^="Menu tài khoản"]').click();
  await page.getByRole("menuitem", { name: "Đăng xuất", exact: true }).click();
  await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
}

for (const role of APP_ROLES) {
  test(`R3 ${role}: complete feature directory, primary menu and frozen bottom navigation`, async ({ page }, testInfo) => {
    await login(page, users[role] ?? await studentUsername());
    const viewer = { role, audience: getAudienceForRole(role), scopeKind: getScopeKindForRole(role), hasGuardianProfile: role === "class_teacher" };
    const catalogue = page.getByRole("navigation", { name: "Tất cả chức năng", exact: true });
    const expected = getAllFeaturesNavigation(viewer);
    await expect(catalogue.getByRole("link")).toHaveCount(expected.length);
    for (const item of expected) await expect(catalogue.locator(`a[href="${item.href}"]`)).toHaveText(item.label);
    await expect(catalogue.locator('a[href="/imports"], a[href="/staff/bulk"]')).toHaveCount(0);
    if (page.viewportSize()!.width < 1024) {
      const bottom = page.getByRole("navigation", { name: "Điều hướng nhanh" });
      expect(await bottom.getByRole("link").evaluateAll(links => links.map(link => link.getAttribute("href")))).toEqual(getMobileNavigation(viewer).map(item => item.href));
      await expect(page.getByRole("button", { name: "Mở menu", exact: true })).toHaveText("Menu");
      await page.getByRole("button", { name: "Mở menu", exact: true }).click();
      await expect(page.getByRole("dialog", { name: "Menu điều hướng" })).toBeVisible();
    }
    const primary = page.locator('nav[aria-label="Điều hướng chính"]:visible');
    if (["class_representative", "class_teacher", "trainee_assistant"].includes(role)) {
      await expect(primary.getByRole("link", { name: /^Lớp của tôi/ })).toHaveAttribute("href", /^\/classes\/[a-f0-9-]{36}$/);
      await expect(primary.getByRole("link")).toHaveCount(role === "class_teacher" ? 10 : 8);
      await expect(primary.locator('a[href="/teaching-plan"], a[href="/results"]')).toHaveCount(0);
    }
    if (role === "treasurer") await expect(primary.locator('a[href="/attendance"], a[href="/promotions"]')).toHaveCount(0);
    await noOverflow(page);
    await page.screenshot({ path: testInfo.outputPath(`${role}-navigation.png`) });
    if (["class_representative", "class_teacher", "trainee_assistant"].includes(role)) {
      const ownLink = primary.getByRole("link", { name: /^Lớp của tôi/ });
      const ownHref = await ownLink.getAttribute("href");
      await ownLink.click();
      const work = page.getByRole("navigation", { name: "Công việc của lớp" });
      await expect(work.getByRole("link", { name: "Điểm danh", exact: true })).toHaveAttribute("href", "/attendance");
      await expect(work.getByRole("link", { name: "Giáo án", exact: true })).toHaveAttribute("href", ownHref!.replace("/classes/", "/teaching-plan/"));
      await page.goto("/classes");
      const otherHref = await page.locator('main a[href^="/classes/"]').evaluateAll((links, own) => links.map(link => link.getAttribute("href")).find(href => href !== own) ?? null, ownHref);
      if (otherHref) {
        await page.goto(otherHref);
        // The attendance hub defaults to the actor's own class, so a shortcut
        // on someone else's class would silently change the class context.
        await expect(page.getByRole("navigation", { name: "Công việc của lớp" }).getByRole("link", { name: "Điểm danh", exact: true })).toHaveCount(0);
      }
    }
  });
}

test("R3 discovery link reaches the complete map and hidden class tools remain reachable", async ({ page }) => {
  await login(page, "GLV909");
  if (page.viewportSize()!.width < 1024) await page.getByRole("button", { name: "Mở menu", exact: true }).click();
  await page.locator('nav[aria-label="Điều hướng chính"]:visible').getByRole("link", { name: /^Lớp của tôi/ }).click();
  await expect(page).toHaveURL(/\/classes\/[a-f0-9-]{36}$/);
  const work = page.getByRole("navigation", { name: "Công việc của lớp" });
  await work.getByRole("link", { name: "Giáo án", exact: true }).click();
  await expect(page).toHaveURL(/\/teaching-plan\/[a-f0-9-]{36}$/);
  await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toBeVisible();
  if (page.viewportSize()!.width < 1024) await page.getByRole("button", { name: "Mở menu", exact: true }).click();
  await page.locator('nav[aria-label="Điều hướng chính"]:visible').getByRole("link", { name: "Tất cả chức năng", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard#all-features$/);
  await expect(page.getByRole("heading", { name: "Tất cả chức năng" })).toBeInViewport();
  await expect(page.getByRole("heading", { name: "Tất cả chức năng" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("navigation", { name: "Tất cả chức năng", exact: true }).getByRole("link").first()).toBeFocused();
  await page.getByRole("navigation", { name: "Tất cả chức năng", exact: true }).getByRole("link", { name: "Kết quả học tập", exact: true }).click();
  await expect(page).toHaveURL(/\/results$/);
  await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toBeVisible();
});

test("R3 rail persistence is isolated per account; mobile drawer remains usable", async ({ page }) => {
  await login(page, "GLV909");
  if (page.viewportSize()!.width < 1024) {
    await page.getByRole("button", { name: "Mở menu", exact: true }).click();
    await expect(page.getByRole("button", { name: "Đóng menu" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Mở menu", exact: true })).toBeFocused();
    await page.getByRole("button", { name: "Mở menu", exact: true }).click();
    await page.setViewportSize({ width: 1366, height: 768 });
    await expect(page.getByRole("dialog", { name: "Menu điều hướng" })).toHaveCount(0);
    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
  }
  await page.getByRole("button", { name: "Thu gọn thanh bên" }).click();
  await expect(page.getByRole("complementary", { name: "Thanh bên ứng dụng" })).toHaveAttribute("data-collapsed", "true");
  const sidebar = await page.getByRole("complementary", { name: "Thanh bên ứng dụng" }).boundingBox();
  expect(sidebar?.width).toBe(72);
  const own = page.locator('aside nav').getByRole("link", { name: /^Lớp của tôi/ });
  await own.focus();
  await expect(page.getByRole("tooltip")).toContainText("Lớp của tôi");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await expect(own).toBeFocused();
  await page.reload();
  await expect(page.getByRole("button", { name: "Mở rộng thanh bên" })).toBeVisible();
  await signOut(page);
  await login(page, "GLV901");
  await expect(page.getByRole("button", { name: "Thu gọn thanh bên" })).toBeVisible();
  await page.setViewportSize({ width: 1366, height: 600 });
  await page.getByRole("button", { name: "Thu gọn thanh bên" }).click();
  await page.locator('aside nav').evaluate(element => { element.scrollTop = 0; });
  await page.locator('aside nav').getByRole("link", { name: "Tài khoản", exact: true }).focus();
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await expect(page.getByRole("tooltip")).toHaveText("Tài khoản");
  await page.keyboard.press("Escape");
  await signOut(page);
  await login(page, "GLV909");
  await expect(page.getByRole("button", { name: "Mở rộng thanh bên" })).toBeVisible();
  await noOverflow(page);
});

test("R3 feature directory renders without JavaScript", async ({ page, browser }) => {
  await login(page, "GLV909");
  const context = await browser.newContext({ javaScriptEnabled: false, storageState: await page.context().storageState(), viewport: page.viewportSize()! });
  try {
    const native = await context.newPage();
    await native.goto(new URL("/dashboard#all-features", page.url()).href);
    await expect(native.getByRole("navigation", { name: "Tất cả chức năng", exact: true }).getByRole("link", { name: "Giáo án", exact: true })).toBeVisible();
    await native.getByRole("navigation", { name: "Tất cả chức năng", exact: true }).getByRole("link", { name: "Kết quả học tập", exact: true }).click();
    await expect(native.getByRole("main").getByRole("heading", { level: 1 })).toBeVisible();
    await noOverflow(native);
  } finally { await context.close(); }
});

test("R3 Menu hint is dismissible and appears only once", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await login(page, "GLV909");
  // Same-page hash navigation must move keyboard focus out of the menu.
  const hint = page.getByRole("note", { name: "Hướng dẫn menu" });
  await expect(hint).toBeVisible();
  await page.getByRole("button", { name: "Ẩn hướng dẫn menu" }).click();
  await expect(hint).toHaveCount(0);
  await page.reload();
  await page.waitForTimeout(1100);
  await expect(hint).toHaveCount(0);
  await page.getByRole("button", { name: "Mở menu", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Menu điều hướng" })).toBeVisible();
  await page.locator('nav[aria-label="Điều hướng chính"]:visible').getByRole("link", { name: "Tất cả chức năng", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Tất cả chức năng" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("navigation", { name: "Tất cả chức năng", exact: true }).getByRole("link").first()).toBeFocused();
  await noOverflow(page);
});
