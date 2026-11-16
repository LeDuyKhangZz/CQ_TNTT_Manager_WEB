import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";

test.use({ channel: "chrome", trace: "off", video: "off" });
test.setTimeout(120_000);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
if (!/^http:\/\/(127\.0\.0\.1|localhost)(:|\/)/.test(url)) throw new Error("Password reset E2E requires local Supabase");
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
const password = "Local-fixture-9876";
const created: string[] = [];

async function account(role: "super_admin" | "parish_priest") {
  const username = `RESET.${randomUUID().slice(0, 8)}`.toUpperCase();
  const email = `${username.toLowerCase()}@accounts.${process.env.INTERNAL_AUTH_DOMAIN || "choquan.internal"}`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) throw new Error("Could not create local auth fixture");
  const id = data.user.id;
  created.push(id);
  const profile = await admin.from("profiles").insert({ id, username, display_name: username, account_status: "active", must_change_password: false });
  if (profile.error) throw profile.error;
  const assignment = await admin.from("role_assignments").insert({ profile_id: id, role, is_active: true, starts_on: "2026-01-01" });
  if (assignment.error) throw assignment.error;
  return { id, username, email };
}
async function login(page: Page, username: string, secret: string) {
  await page.goto("/login");
  await page.getByLabel("Tên đăng nhập").fill(username);
  await page.locator("#password").fill(secret);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
}
test.afterEach(async () => {
  for (const id of created.splice(0)) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) throw error;
  }
});

test("SA resets another SA on web; old password fails, temporary password forces change, non-SA denied", async ({ page, browser }) => {
  const actor = await account("super_admin");
  const target = await account("super_admin");
  const ordinary = await account("parish_priest");
  await login(page, actor.username, password);
  await page.waitForURL(/\/dashboard$/);
  await page.goto("/admin?section=accounts");
  await page.getByLabel("Tìm tài khoản", { exact: true }).fill(target.username);
  await page.getByRole("button", { name: `Đặt lại mật khẩu ${target.username}`, exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Đặt lại mật khẩu", exact: true });
  await expect(dialog.getByText(target.username, { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Hủy", exact: true }).click();
  await expect(dialog).toBeHidden();
  await page.getByRole("button", { name: `Đặt lại mật khẩu ${target.username}`, exact: true }).click();
  await dialog.getByRole("button", { name: "Xác nhận đặt lại" }).click();
  const secret = dialog.locator("code");
  await expect(secret).toBeVisible();
  const temporary = (await secret.textContent())!;
  expect(temporary.length).toBe(8);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await dialog.getByRole("button", { name: "Đã lưu mật khẩu" }).click();
  await expect(secret).toHaveCount(0);

  const verifier = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
  expect((await verifier.auth.signInWithPassword({ email: target.email, password })).error).not.toBeNull();
  const profile = await admin.from("profiles").select("must_change_password").eq("id", target.id).single();
  expect(profile.data?.must_change_password).toBe(true);
  const audit = await admin.from("account_audit_events").select("actor_profile_id,target_profile_id,action,detail").eq("target_profile_id", target.id).eq("action", "reset_password");
  expect(audit.data).toHaveLength(1);
  expect(audit.data?.[0].actor_profile_id).toBe(actor.id);
  expect(JSON.stringify(audit.data).includes(temporary)).toBe(false);

  const recipientContext = await browser.newContext();
  const recipient = await recipientContext.newPage();
  await login(recipient, target.username, temporary);
  await recipient.waitForURL(/\/change-password/);
  await recipient.goto("/classes");
  await expect(recipient).toHaveURL(/\/change-password/);
  await recipient.getByLabel("Mật khẩu mới", { exact: true }).fill("Local-final-6789");
  await recipient.getByLabel("Xác nhận mật khẩu mới", { exact: true }).fill("Local-final-6789");
  await recipient.getByRole("button", { name: "Lưu mật khẩu mới" }).click();
  await recipient.waitForURL(/\/classes/);
  expect((await admin.from("profiles").select("must_change_password").eq("id", target.id).single()).data?.must_change_password).toBe(false);
  await recipientContext.close();

  await page.context().clearCookies();
  await login(page, ordinary.username, password);
  await page.waitForURL(/\/dashboard$/);
  await page.goto("/admin?section=accounts");
  await expect(page).toHaveURL(/\/access-denied$/);
});
