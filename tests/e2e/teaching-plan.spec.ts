import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect, test, type Page, type TestInfo } from "@playwright/test";
import type { Database } from "../../src/types/database";

const DEV_PASSWORD = "123456";
const PROJECT_DATE: Record<string, string> = {
  "mobile-360": "2026-09-02",
  "tablet-768": "2026-09-03",
  "laptop-1366": "2026-09-04",
};

let adminClient: SupabaseClient<Database> | null = null;

function getLocalAdmin() {
  if (adminClient) return adminClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || !/^https?:\/\/(127\.0\.0\.1|localhost)(:|$)/.test(url)) {
    throw new Error("E2E giáo án chỉ được chạy với Supabase local và service role key.");
  }
  adminClient = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return adminClient;
}

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

async function setupPlan(testInfo: TestInfo) {
  const admin = getLocalAdmin();
  const plannedDate = PROJECT_DATE[testInfo.project.name];
  if (!plannedDate) throw new Error(`Thiếu ngày riêng cho project ${testInfo.project.name}`);
  const { data: year } = await admin.from("academic_years").select("id").eq("status", "current").single();
  const { data: classRow } = await admin.from("classes").select("id").eq("display_name", "Ấu 1A").eq("academic_year_id", year!.id).single();
  const { data: plan, error: planError } = await admin
    .from("teaching_plans")
    .upsert({ class_id: classRow!.id, academic_year_id: year!.id, title: "Kế hoạch giảng dạy Ấu 1A" }, { onConflict: "class_id" })
    .select("id")
    .single();
  if (planError || !plan) throw new Error(`Không chuẩn bị được giáo án E2E: ${planError?.message}`);

  const { data: oldItems } = await admin
    .from("teaching_plan_items")
    .select("id, material_path")
    .eq("teaching_plan_id", plan.id)
    .eq("planned_date", plannedDate);
  for (const item of oldItems ?? []) {
    if (item.material_path) await admin.storage.from("teaching-materials").remove([item.material_path]);
  }
  await admin.from("teaching_plan_items").delete().eq("teaching_plan_id", plan.id).eq("planned_date", plannedDate);
  return { admin, classId: classRow!.id, plannedDate };
}

test.describe("Giáo án Phase 4", () => {
  test.describe.configure({ timeout: 120_000 });

  test("đại diện CRUD + private material; GLV đọc; portal chỉ thấy trường an toàn", async ({ page }, testInfo) => {
    const { admin, classId, plannedDate } = await setupPlan(testInfo);
    const suffix = testInfo.project.name;
    const title = `Bài E2E ${suffix}`;
    const preparation = `Chuẩn bị E2E ${suffix}`;
    const restricted = `Mục tiêu nội bộ ${suffix}`;
    const fileName = `tai-lieu-${suffix}.txt`;

    await login(page, "GLV909");
    await page.goto(`/teaching-plan/${classId}`);
    const addForm = page.getByRole("heading", { name: "Thêm mục giáo án" }).locator("xpath=../following-sibling::div/form");
    await expect(addForm).toBeVisible();
    await addForm.locator('input[name="plannedDate"]').fill(plannedDate);
    await addForm.locator('input[name="title"]').fill(title);
    await addForm.locator('textarea[name="objectives"]').fill(restricted);
    await addForm.locator('textarea[name="preparation"]').fill(preparation);
    const teacherValue = await addForm.locator('select[name="teacherStaffId"] option:not([value=""])').first().getAttribute("value");
    expect(teacherValue).toBeTruthy();
    await addForm.locator('select[name="teacherStaffId"]').selectOption(teacherValue!);
    await addForm.getByRole("button", { name: "Thêm vào giáo án" }).click();

    const itemCard = page.locator("[data-teaching-plan-item]").filter({ hasText: title });
    await expect(itemCard).toBeVisible();
    await expect(itemCard.getByText(restricted, { exact: true })).toBeVisible();
    await itemCard.locator('input[type="file"]').setInputFiles({
      name: fileName,
      mimeType: "text/plain",
      buffer: Buffer.from(`Nội dung tài liệu ${suffix}`, "utf8"),
    });
    await itemCard.getByRole("button", { name: "Lưu tài liệu" }).click();
    await expect(itemCard.getByText(new RegExp(fileName))).toBeVisible();
    const itemId = await itemCard.getAttribute("data-teaching-plan-item");
    expect(itemId).toBeTruthy();

    // GLV thành viên đọc được toàn bộ giáo án và tải qua signed URL, nhưng không sửa.
    await login(page, "GLV910");
    await page.goto(`/teaching-plan/${classId}`);
    const readOnlyCard = page.locator(`[data-teaching-plan-item="${itemId}"]`);
    await expect(readOnlyCard.getByText(restricted, { exact: true })).toBeVisible();
    await expect(readOnlyCard.getByRole("button", { name: "Sửa" })).toHaveCount(0);
    const downloadPromise = page.waitForEvent("download");
    await readOnlyCard.getByRole("button", { name: "Tải xuống" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe(fileName);

    // Portal không được nhận mục tiêu nội bộ hay tài liệu, chỉ lịch tuần an toàn.
    await login(page, "84912000001");
    await page.goto("/teaching-plan");
    await expect(page.getByRole("heading", { name: "7 ngày sắp tới" })).toBeVisible();
    await expect(page.getByText(title, { exact: true })).toBeVisible();
    await expect(page.getByText(preparation, { exact: true })).toBeVisible();
    await expect(page.getByText(restricted, { exact: true })).toHaveCount(0);
    await expect(page.getByText(new RegExp(fileName))).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Giáo án theo lớp" })).toHaveCount(0);

    // Gỡ tệp qua UI và xác nhận Storage API đã xóa object vật lý.
    await login(page, "GLV909");
    await page.goto(`/teaching-plan/${classId}`);
    const editableCard = page.locator(`[data-teaching-plan-item="${itemId}"]`);
    page.once("dialog", (dialog) => dialog.accept());
    await editableCard.getByRole("button", { name: "Gỡ tệp" }).click();
    await expect(editableCard.getByText("Chưa đính kèm tài liệu.")).toBeVisible();
    const { data: objects } = await admin.storage.from("teaching-materials").list(`${classId}/${itemId}`);
    expect(objects ?? []).toHaveLength(0);

    // Xóa cả item khi đang có tệp cũng phải dọn object, không để orphan.
    await editableCard.locator('input[type="file"]').setInputFiles({
      name: `delete-${fileName}`,
      mimeType: "text/plain",
      buffer: Buffer.from("Tệp phải được dọn cùng item", "utf8"),
    });
    await editableCard.getByRole("button", { name: "Lưu tài liệu" }).click();
    await expect(editableCard.getByText(new RegExp(`delete-${fileName}`))).toBeVisible();
    page.once("dialog", (dialog) => dialog.accept());
    await editableCard.getByRole("button", { name: "Xóa" }).click();
    await expect(page.locator(`[data-teaching-plan-item="${itemId}"]`)).toHaveCount(0);
    const { data: afterItemDelete } = await admin.storage.from("teaching-materials").list(`${classId}/${itemId}`);
    expect(afterItemDelete ?? []).toHaveLength(0);
  });
});
