import ExcelJS from "exceljs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect, test, type Page, type TestInfo } from "@playwright/test";
import type { Database } from "../../src/types/database";

const DEV_PASSWORD = "123456";
const FUTURE_YEAR_ID = "f0000000-0000-4000-8000-000000000001";

const PROJECT_FIXTURE = {
  "mobile-360": {
    index: 1, sourceClass: "Chiên Con 1", targetGrade: "20000000-0000-0000-0000-000000000002",
    targetName: "Chiên Con 2 E2E", rep: "GLV920", guardian: "84919999991", studentCode: "CQ9901",
  },
  "tablet-768": {
    index: 2, sourceClass: "Nghĩa 1", targetGrade: "20000000-0000-0000-0000-000000000011",
    targetName: "Nghĩa 2 E2E", rep: "GLV921", guardian: "84919999992", studentCode: "CQ9911",
  },
  "laptop-1366": {
    index: 3, sourceClass: "Hiệp 1", targetGrade: "20000000-0000-0000-0000-000000000014",
    targetName: "Hiệp 2 E2E", rep: "GLV922", guardian: "84919999993", studentCode: "CQ9921",
  },
} as const;

type ProjectName = keyof typeof PROJECT_FIXTURE;
let adminClient: SupabaseClient<Database> | null = null;

function getLocalAdmin() {
  if (adminClient) return adminClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || !/^https?:\/\/(127\.0\.0\.1|localhost)(:|$)/.test(url)) {
    throw new Error("E2E Phase 5 chỉ được chạy với Supabase local và service role key.");
  }
  adminClient = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return adminClient;
}

function uuid(kind: number, value: number): string {
  return `f${kind}000000-0000-4000-8000-${String(value).padStart(12, "0")}`;
}

function aliasEmail(username: string): string {
  const domain = process.env.INTERNAL_AUTH_DOMAIN || "choquan.internal";
  if (/^GLV\d+$/.test(username)) return `${username.toLowerCase()}@staff.${domain}`;
  if (/^CQ\d+$/.test(username)) return `${username.toLowerCase()}@students.${domain}`;
  return `${username}@guardians.${domain}`;
}

async function ensureAccount(username: string, displayName: string): Promise<string> {
  const admin = getLocalAdmin();
  const { data: existing } = await admin.from("profiles").select("id").eq("username", username).maybeSingle();
  if (existing) return existing.id;
  const { data: created, error: authError } = await admin.auth.admin.createUser({
    email: aliasEmail(username), password: DEV_PASSWORD, email_confirm: true,
  });
  if (authError || !created.user) throw new Error(`Tạo account ${username}: ${authError?.message}`);
  const { error } = await admin.from("profiles").insert({
    id: created.user.id, username, display_name: displayName,
    account_status: "active", must_change_password: false,
  });
  if (error) throw new Error(`Tạo profile ${username}: ${error.message}`);
  return created.user.id;
}

async function ensureRole(profileId: string, role: Database["public"]["Enums"]["app_role"], scope: {
  academic_year_id?: string; class_id?: string;
} = {}) {
  const admin = getLocalAdmin();
  const { data } = await admin.from("role_assignments").select("id").eq("profile_id", profileId).eq("is_active", true).maybeSingle();
  if (data) return;
  const { error } = await admin.from("role_assignments").insert({ profile_id: profileId, role, ...scope });
  if (error) throw new Error(`Gán role ${role}: ${error.message}`);
}

async function prepareFixture(testInfo: TestInfo) {
  const fixture = PROJECT_FIXTURE[testInfo.project.name as ProjectName];
  if (!fixture) throw new Error(`Thiếu fixture cho ${testInfo.project.name}`);
  const admin = getLocalAdmin();
  const { data: year, error: yearError } = await admin.from("academic_years").select("id, code, start_date, end_date").eq("status", "current").single();
  if (yearError || !year) throw new Error(`Đọc năm hiện hành: ${yearError?.message}`);
  await admin.from("academic_years").update({ top5_enabled: true }).eq("id", year.id);
  const { data: sourceClass, error: classError } = await admin.from("classes")
    .select("id, grade_level_id").eq("academic_year_id", year.id).eq("display_name", fixture.sourceClass).single();
  if (classError || !sourceClass) throw new Error(`Đọc lớp nguồn: ${classError?.message}`);

  const { error: futureError } = await admin.from("academic_years").upsert({
    id: FUTURE_YEAR_ID, code: "2027-2028", name: "Năm đích E2E Phase 5",
    start_date: "2027-09-01", end_date: "2028-05-31", retention_until: "2033-05-31", status: "draft",
  });
  if (futureError) throw new Error(`Tạo năm đích: ${futureError.message}`);
  const targetClassId = uuid(6, 200 + fixture.index);
  const { error: targetError } = await admin.from("classes").upsert({
    id: targetClassId, academic_year_id: FUTURE_YEAR_ID, grade_level_id: fixture.targetGrade,
    section_code: null, class_kind: "catechism", term_scope: "full_year",
    display_name: fixture.targetName, status: "active",
  });
  if (targetError) throw new Error(`Tạo lớp đích: ${targetError.message}`);

  const representativeId = await ensureAccount(fixture.rep, `Đại diện E2E ${fixture.index}`);
  let { data: staff } = await admin.from("staff_profiles").select("id").eq("profile_id", representativeId).maybeSingle();
  if (!staff) {
    const result = await admin.from("staff_profiles").insert({
      profile_id: representativeId, staff_code: fixture.rep, title: "anh",
      full_name: `Đại diện E2E ${fixture.index}`, phone: `09880000${fixture.index}0`,
    }).select("id").single();
    if (result.error || !result.data) throw new Error(`Tạo staff E2E: ${result.error?.message}`);
    staff = result.data;
  }
  const { data: assignment } = await admin.from("class_staff_assignments").select("id")
    .eq("staff_profile_id", staff.id).eq("class_id", sourceClass.id).eq("is_active", true).maybeSingle();
  if (!assignment) {
    const { error } = await admin.from("class_staff_assignments").insert({
      class_id: sourceClass.id, staff_profile_id: staff.id, capacity: "representative", starts_on: year.start_date,
    });
    if (error) throw new Error(`Phân công đại diện E2E: ${error.message}`);
  }
  await ensureRole(representativeId, "class_representative", { academic_year_id: year.id, class_id: sourceClass.id });

  const guardianProfileId = await ensureAccount(fixture.guardian, `Phụ huynh E2E ${fixture.index}`);
  const guardianId = uuid(2, 100 + fixture.index);
  const { error: guardianError } = await admin.from("guardians").upsert({
    id: guardianId, profile_id: guardianProfileId, full_name: `Phụ huynh E2E ${fixture.index}`, phone: fixture.guardian,
  });
  if (guardianError) throw new Error(`Tạo phụ huynh E2E: ${guardianError.message}`);
  await ensureRole(guardianProfileId, "guardian");

  const studentProfileId = await ensureAccount(fixture.studentCode, `Thiếu nhi E2E ${fixture.index}`);
  const studentNames: string[] = [];
  const enrollmentIds: string[] = [];
  for (let offset = 1; offset <= 6; offset += 1) {
    const studentId = uuid(3, fixture.index * 10 + offset);
    const enrollmentId = uuid(4, fixture.index * 10 + offset);
    const saintName = ["Giuse", "Maria", "Phêrô", "Anna", "Phaolô", "Têrêsa"][offset - 1]!;
    const fullName = `Em E2E ${fixture.index}-${offset}`;
    studentNames.push(`${saintName} ${fullName}`);
    enrollmentIds.push(enrollmentId);
    const { error: studentError } = await admin.from("students").upsert({
      id: studentId, profile_id: offset === 1 ? studentProfileId : null,
      student_code: `CQ99${fixture.index - 1}${offset}`, guardian_id: guardianId,
      saint_name: saintName, full_name: fullName, gender: offset % 2 ? "male" : "female", date_of_birth: `2015-0${offset}-01`,
    });
    if (studentError) throw new Error(`Tạo thiếu nhi E2E ${offset}: ${studentError.message}`);
    const { error: enrollmentError } = await admin.from("enrollments").upsert({
      id: enrollmentId, student_id: studentId, academic_year_id: year.id,
      class_id: sourceClass.id, status: "active", enrolled_on: year.start_date,
    });
    if (enrollmentError) throw new Error(`Ghi danh E2E ${offset}: ${enrollmentError.message}`);
  }
  await ensureRole(studentProfileId, "student");

  return {
    admin, fixture, year, classId: sourceClass.id, targetClassId, representativeId,
    studentNames, enrollmentIds, firstStudentName: studentNames[0]!, firstEnrollmentId: enrollmentIds[0]!,
  };
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
  throw new Error(`Không đăng nhập được bằng ${username}.`);
}

async function expectNoHorizontalOverflow(page: Page, where: string) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(overflow, `${where} không được tràn ngang`).toBe(false);
}

test.describe("Kết quả và chuyển lớp Phase 5", () => {
  test.describe.configure({ timeout: 240_000 });

  test("đại diện nhập/công bố/khóa/xuất/Top 5; portal ownership; duyệt chuyển lớp nguyên tử", async ({ page }, testInfo) => {
    const setup = await prepareFixture(testInfo);
    const suffix = `${testInfo.project.name}-${Date.now()}`;
    const publishedTitle = `Điểm công bố ${suffix}`;
    const draftTitle = `Điểm nội bộ ${suffix}`;
    const publicComment = `Nhận xét công khai ${suffix}`;
    const internalComment = `Ghi chú nội bộ ${suffix}`;
    const topTitle = `Top 5 ${suffix}`;

    await login(page, setup.fixture.rep);
    await page.goto(`/results/${setup.classId}`);
    await expect(page.getByRole("heading", { name: `Bảng điểm ${setup.fixture.sourceClass}` })).toBeVisible();
    const addForm = page.getByRole("heading", { name: "Thêm cột điểm" }).locator("xpath=../following-sibling::div/form");
    await addForm.locator('select[name="kind"]').selectOption("custom");
    await addForm.locator('input[name="title"]').fill(publishedTitle);
    await addForm.locator('input[name="weight"]').fill("2");
    await addForm.getByRole("button", { name: "Thêm cột" }).click();
    if (await page.locator("#mobile-assessment").isVisible()) {
      await page.locator("#mobile-assessment").selectOption({ label: publishedTitle });
    }
    await expect(page.getByRole("button", { name: `Lưu điểm ${publishedTitle}` })).toBeVisible();

    const scoreForm = page.getByRole("button", { name: `Lưu điểm ${publishedTitle}` }).locator("xpath=ancestor::form");
    for (let index = 0; index < setup.studentNames.length; index += 1) {
      await scoreForm.getByLabel(`Điểm ${setup.studentNames[index]}`).fill(String(10 - index));
    }
    await scoreForm.getByRole("button", { name: `Lưu điểm ${publishedTitle}` }).click();
    await expect(scoreForm.getByText("Đã lưu 6 dòng điểm.")).toBeVisible();
    const settingsForm = page.locator(`input[name="title"][value="${publishedTitle}"]`).locator("xpath=ancestor::form");
    await settingsForm.getByRole("button", { name: "Công bố" }).click();
    await expect(settingsForm.getByRole("button", { name: "Ẩn" })).toBeVisible();

    // Một cột nháp chứng minh portal lọc published ngay cả khi đã có điểm khác công bố.
    await addForm.locator('input[name="title"]').fill(draftTitle);
    await addForm.locator('input[name="weight"]').fill("1");
    await addForm.getByRole("button", { name: "Thêm cột" }).click();
    if (await page.locator("#mobile-assessment").isVisible()) {
      await page.locator("#mobile-assessment").selectOption({ label: draftTitle });
    }
    await expect(page.getByRole("button", { name: `Lưu điểm ${draftTitle}` })).toBeVisible();

    const commentCard = page.getByRole("heading", { name: setup.firstStudentName, exact: true })
      .locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
    const commentForm = commentCard.locator("form");
    await commentForm.locator('select[name="visibility"]').selectOption("staff_only");
    await commentForm.locator('textarea[name="content"]').fill(internalComment);
    await commentForm.getByRole("button", { name: "Thêm nhận xét" }).click();
    await expect(commentCard.getByText(internalComment, { exact: true })).toBeVisible();
    await commentForm.locator('select[name="visibility"]').selectOption("student_visible");
    await commentForm.locator('textarea[name="content"]').fill(publicComment);
    await commentForm.getByRole("button", { name: "Thêm nhận xét" }).click();
    await expect(commentCard.getByText(publicComment, { exact: true })).toBeVisible();

    const newTopForm = page.getByRole("heading", { name: "Tạo Top 5" }).locator("xpath=../following-sibling::div/form");
    await newTopForm.locator('input[name="title"]').fill(topTitle);
    await newTopForm.locator('select[name="sourceAssessmentId"]').selectOption({ label: publishedTitle });
    await newTopForm.getByRole("button", { name: "Tạo bảng Top 5" }).click();
    const topCard = page.getByRole("heading", { name: topTitle, exact: true }).locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
    await expect(topCard).toBeVisible();
    await topCard.getByRole("button", { name: "Xem trước" }).click();
    await expect(topCard.locator("ol li")).toHaveCount(5);
    page.once("dialog", (dialog) => dialog.accept());
    await topCard.getByRole("button", { name: "Công bố snapshot" }).click();
    await expect(topCard.getByText("Đã công bố", { exact: true })).toBeVisible();

    const excelResponse = await page.request.get(`/results/${setup.classId}/export?format=xlsx`);
    expect(excelResponse.ok()).toBe(true);
    expect(excelResponse.headers()["content-type"]).toContain("spreadsheetml");
    const workbook = new ExcelJS.Workbook();
    const excelBody = await excelResponse.body();
    const excelArrayBuffer = excelBody.buffer.slice(
      excelBody.byteOffset,
      excelBody.byteOffset + excelBody.byteLength,
    ) as ArrayBuffer;
    await workbook.xlsx.load(excelArrayBuffer);
    const sheet = workbook.worksheets[0]!;
    // Hai dòng tiêu đề + một dòng header + đúng sáu thiếu nhi của lớp.
    expect(sheet.rowCount).toBe(9);
    const workbookText = JSON.stringify(sheet.getSheetValues());
    expect(workbookText).toContain(publishedTitle);
    expect(workbookText).toContain(draftTitle);
    expect(workbookText).not.toContain("Nguyễn Minh An");
    const pdfResponse = await page.request.get(`/results/${setup.classId}/export?format=pdf`);
    expect(pdfResponse.ok()).toBe(true);
    expect((await pdfResponse.body()).subarray(0, 4).toString("ascii")).toBe("%PDF");

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Khóa bảng điểm" }).click();
    await expect(page.getByText("Đã khóa", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Thêm cột điểm" })).toHaveCount(0);
    await expect(page.getByLabel(`Điểm ${setup.firstStudentName}`).first()).toBeDisabled();
    await expectNoHorizontalOverflow(page, "bảng điểm đã khóa");

    await login(page, "KHANG.NHO");
    await page.goto(`/results/${setup.classId}`);
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Mở khóa" }).click();
    await expect(page.getByText("Đang mở", { exact: true }).first()).toBeVisible();

    await login(page, setup.fixture.rep);
    await page.goto("/promotions");
    const proposalCard = page.getByRole("heading", { name: setup.firstStudentName, exact: true })
      .locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
    await expect(proposalCard).toBeVisible();
    await proposalCard.locator('select').first().selectOption("recommended_promote");
    await proposalCard.getByRole("button", { name: "Lưu đề xuất" }).click();
    await expect(proposalCard.getByText("Chờ duyệt", { exact: true })).toBeVisible();

    await login(page, "GLV901");
    await page.goto("/promotions");
    const reviewCard = page.getByRole("heading", { name: setup.firstStudentName, exact: true })
      .locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
    await reviewCard.getByRole("button", { name: "Duyệt", exact: true }).click();
    // Sau duyệt, cùng em xuất hiện lại ở ghi danh năm đích nên không dùng việc
    // biến mất của heading làm tín hiệu; poll trực tiếp trạng thái giao dịch.
    await expect.poll(async () => {
      const { data } = await setup.admin.from("enrollments").select("status").eq("id", setup.firstEnrollmentId).single();
      return data?.status;
    }, { timeout: 10_000 }).toBe("completed");
    const { data: oldEnrollment } = await setup.admin.from("enrollments").select("status, ended_on").eq("id", setup.firstEnrollmentId).single();
    expect(oldEnrollment?.status).toBe("completed");
    expect(oldEnrollment?.ended_on).toBe(setup.year.end_date);
    const { data: newEnrollment } = await setup.admin.from("enrollments").select("class_id, previous_enrollment_id, status")
      .eq("previous_enrollment_id", setup.firstEnrollmentId).single();
    expect(newEnrollment).toMatchObject({ class_id: setup.targetClassId, previous_enrollment_id: setup.firstEnrollmentId, status: "active" });

    await login(page, setup.fixture.guardian);
    await page.goto("/results");
    await expect(page.getByText(publishedTitle, { exact: true }).first()).toBeVisible();
    await expect(page.getByText(publicComment, { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: topTitle, exact: true }).first()).toBeVisible();
    await expect(page.getByText(draftTitle, { exact: true })).toHaveCount(0);
    await expect(page.getByText(internalComment, { exact: true })).toHaveCount(0);
    await expect(page.getByText("Nguyễn Minh An", { exact: true })).toHaveCount(0);
    await expectNoHorizontalOverflow(page, "portal phụ huynh");

    await login(page, setup.fixture.studentCode);
    await page.goto("/results");
    await expect(page.getByText(publishedTitle, { exact: true }).first()).toBeVisible();
    await expect(page.getByText(publicComment, { exact: true })).toBeVisible();
    await expect(page.getByText(draftTitle, { exact: true })).toHaveCount(0);
    await expect(page.getByText(internalComment, { exact: true })).toHaveCount(0);
    await expectNoHorizontalOverflow(page, "portal thiếu nhi");
  });
});
