import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect, test, type Page, type TestInfo } from "@playwright/test";
import type { Database } from "../../src/types/database";

const DEV_PASSWORD = "123456";
const GUARDIAN_TWO_CHILDREN = "84912000001";
const GUARDIAN_ONE_CHILD = "84912000002";
const STAFF_GUARDIAN = "GLV910";

const EMPTY_FIXTURE = {
  "mobile-360": { index: 1, sourceClass: "Chiên Con 1" },
  "tablet-768": { index: 2, sourceClass: "Nghĩa 1" },
  "laptop-1366": { index: 3, sourceClass: "Hiệp 1" },
} as const;

type ProjectName = keyof typeof EMPTY_FIXTURE;

let adminClient: SupabaseClient<Database> | null = null;

function getLocalAdmin() {
  if (adminClient) return adminClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || !/^https?:\/\/(127\.0\.0\.1|localhost)(:|$)/.test(url)) {
    throw new Error("E2E M13 chỉ được chạy với Supabase local và service role key.");
  }
  adminClient = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return adminClient;
}

function fixtureUuid(kind: number, value: number): string {
  return `e${kind}000000-0000-4000-8000-${String(value).padStart(12, "0")}`;
}

function aliasEmail(username: string): string {
  const domain = process.env.INTERNAL_AUTH_DOMAIN || "choquan.internal";
  return `${username}@guardians.${domain}`;
}

async function ensureAccount(username: string, displayName: string): Promise<string> {
  const admin = getLocalAdmin();
  const { data: existing, error: existingError } = await admin
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) return existing.id;

  const { data: created, error: authError } = await admin.auth.admin.createUser({
    email: aliasEmail(username),
    password: DEV_PASSWORD,
    email_confirm: true,
  });
  if (authError || !created.user) throw new Error(`Tạo account ${username}: ${authError?.message}`);
  const { error } = await admin.from("profiles").insert({
    id: created.user.id,
    username,
    display_name: displayName,
    account_status: "active",
    must_change_password: false,
  });
  if (error) throw error;
  return created.user.id;
}

async function ensureGuardianRole(profileId: string) {
  const admin = getLocalAdmin();
  const { data, error: readError } = await admin
    .from("role_assignments")
    .select("id")
    .eq("profile_id", profileId)
    .eq("role", "guardian")
    .eq("is_active", true)
    .maybeSingle();
  if (readError) throw readError;
  if (data) return;
  const { error } = await admin.from("role_assignments").insert({ profile_id: profileId, role: "guardian" });
  if (error) throw error;
}

async function prepareEmptyStateFixtures(testInfo: TestInfo) {
  const fixture = EMPTY_FIXTURE[testInfo.project.name as ProjectName];
  if (!fixture) throw new Error(`Thiếu fixture M13-B cho ${testInfo.project.name}`);
  const admin = getLocalAdmin();
  const { data: year, error: yearError } = await admin
    .from("academic_years")
    .select("id, code, start_date")
    .eq("status", "current")
    .single();
  if (yearError) throw yearError;
  const { data: classRow, error: classError } = await admin
    .from("classes")
    .select("id")
    .eq("academic_year_id", year.id)
    .eq("display_name", fixture.sourceClass)
    .single();
  if (classError) throw classError;

  const unlinkedUsername = `84918888${fixture.index}01`;
  const noChildrenUsername = `84918888${fixture.index}02`;
  const noEnrollmentUsername = `84918888${fixture.index}03`;
  await ensureAccount(unlinkedUsername, `Portal chưa liên kết ${fixture.index}`);
  const noChildrenProfileId = await ensureAccount(noChildrenUsername, `Portal chưa có con ${fixture.index}`);
  const noEnrollmentProfileId = await ensureAccount(noEnrollmentUsername, `Portal chưa ghi danh ${fixture.index}`);

  const noChildrenGuardianId = fixtureUuid(1, fixture.index);
  const noEnrollmentGuardianId = fixtureUuid(2, fixture.index);
  const studentId = fixtureUuid(3, fixture.index);
  const enrollmentId = fixtureUuid(4, fixture.index);
  const { error: guardianError } = await admin.from("guardians").upsert([
    {
      id: noChildrenGuardianId,
      profile_id: noChildrenProfileId,
      full_name: `Người giám hộ chưa có con ${fixture.index}`,
      phone: noChildrenUsername,
    },
    {
      id: noEnrollmentGuardianId,
      profile_id: noEnrollmentProfileId,
      full_name: `Người giám hộ chưa ghi danh ${fixture.index}`,
      phone: noEnrollmentUsername,
    },
  ]);
  if (guardianError) throw guardianError;
  await Promise.all([
    ensureGuardianRole(noChildrenProfileId),
    ensureGuardianRole(noEnrollmentProfileId),
  ]);
  const { error: studentError } = await admin.from("students").upsert({
    id: studentId,
    student_code: `CQ98${fixture.index}1`,
    guardian_id: noEnrollmentGuardianId,
    saint_name: "Maria",
    full_name: `Em chưa ghi danh ${fixture.index}`,
    gender: "female",
    date_of_birth: "2015-05-01",
  });
  if (studentError) throw studentError;
  const { error: cleanupError } = await admin.from("enrollments").delete().eq("id", enrollmentId);
  if (cleanupError) throw cleanupError;

  return {
    admin,
    year,
    classId: classRow.id,
    studentId,
    enrollmentId,
    unlinkedUsername,
    noChildrenUsername,
    noEnrollmentUsername,
    noEnrollmentProfileId,
  };
}

async function login(page: Page, username: string) {
  await page.context().clearCookies();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.goto("/login", { waitUntil: "domcontentloaded" });
      await page.getByLabel("Tên đăng nhập").fill(username);
      await page.locator("input#password").fill(DEV_PASSWORD);
      await page.getByRole("button", { name: "Đăng nhập" }).click();
      await page.waitForURL(/\/(dashboard|change-password)$/, { timeout: 15_000 });
      await expect(page).toHaveURL(/\/dashboard$/);
      // Chờ nội dung máy chủ dựng xong, không chỉ chờ URL đổi. Nếu kiểm menu
      // ngay khi URL vừa đổi, `isVisible()` có thể trả false trong lúc dashboard
      // còn đang nạp và bài test sẽ nhầm sang nhánh mở drawer.
      await expect(
        page.getByRole("main").getByRole("heading", { level: 1, name: "Tổng quan" }),
      ).toBeVisible();
      return;
    } catch {
      await page.waitForTimeout(500);
    }
  }
  throw new Error(`Không đăng nhập được bằng ${username}. Đã chạy seed:dev chưa?`);
}

async function openParentChildrenFromNavigation(page: Page) {
  let link = page.locator('nav a[href="/parent/children"]:visible').first();
  const menuButton = page.getByRole("button", { name: "Mở menu" });

  // Chờ shell dựng xong rồi mới quyết định dùng thanh điều hướng hay drawer.
  // `isVisible()` tự nó không chờ, nên rẽ nhánh ngay có thể nhầm desktop đang
  // hydrate thành mobile và mở drawer không tồn tại.
  await expect(link.or(menuButton).first()).toBeVisible({ timeout: 20_000 });
  if (!(await link.isVisible())) {
    await menuButton.click();
    link = page.locator('nav a[href="/parent/children"]:visible').first();
  }
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("href", "/parent/children");

  // Vẫn xác nhận route thật sự có trong navigation, nhưng dùng full navigation
  // để ca portal không phụ thuộc thời điểm hoàn tất RSC refresh của shell.
  await page.goto("/parent/children", { waitUntil: "domcontentloaded" });
  await page.waitForURL(/\/parent\/children(?:\/|$)/);
}

async function expectNoHorizontalOverflow(page: Page, where: string) {
  await page.waitForLoadState("domcontentloaded");
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  expect(overflows, `${where} không được tràn ngang`).toBe(false);
}

async function studentUsername(): Promise<string> {
  const admin = getLocalAdmin();
  const { data: student, error: studentError } = await admin
    .from("students")
    .select("profile_id")
    .not("profile_id", "is", null)
    .limit(1)
    .single();
  if (studentError || !student.profile_id) {
    throw new Error(`Không tìm thấy tài khoản thiếu nhi: ${studentError?.message ?? "thiếu profile"}`);
  }
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("username")
    .eq("id", student.profile_id)
    .single();
  if (profileError) throw new Error(`Không đọc được username thiếu nhi: ${profileError.message}`);
  return profile.username;
}

test.describe("M13-A — cổng phụ huynh và thiếu nhi", () => {
  // Hai ca M13-B/C đổi qua 3 tài khoản và nhiều route trong một ca; 30 giây mặc
  // định không đủ trên máy OneDrive dù từng thao tác riêng đều hoàn tất.
  test.describe.configure({ timeout: 120_000 });

  test.afterEach(async ({}, testInfo) => {
    const fixture = EMPTY_FIXTURE[testInfo.project.name as ProjectName];
    if (!fixture) return;
    const admin = getLocalAdmin();
    const { error: scoreError } = await admin
      .from("assessment_scores")
      .delete()
      .in("id", [fixtureUuid(7, fixture.index), fixtureUuid(8, fixture.index)]);
    if (scoreError) throw scoreError;
    const { error: assessmentError } = await admin
      .from("assessments")
      .delete()
      .in("id", [fixtureUuid(5, fixture.index), fixtureUuid(6, fixture.index)]);
    if (assessmentError) throw assessmentError;
    const { error: enrollmentError } = await admin
      .from("enrollments")
      .delete()
      .eq("id", fixtureUuid(4, fixture.index));
    if (enrollmentError) throw enrollmentError;
  });

  test("D-64: phụ huynh một con đi thẳng vào hồ sơ", async ({ page }) => {
    await login(page, GUARDIAN_ONE_CHILD);
    await openParentChildrenFromNavigation(page);

    await expect(page).toHaveURL(/\/parent\/children\/[0-9a-f-]{36}$/, { timeout: 20_000 });
    await expect(
      page.getByRole("main").getByRole("heading", { level: 1, name: "Maria Trần Bảo Châu" }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page, "hồ sơ con duy nhất");
  });

  test("D-64/D-70: phụ huynh nhiều con thấy đúng hai con của mình", async ({ page }) => {
    await login(page, GUARDIAN_TWO_CHILDREN);
    await openParentChildrenFromNavigation(page);

    await expect(page).toHaveURL(/\/parent\/children$/);
    const main = page.getByRole("main");
    await expect(main.getByRole("link", { name: "Giuse Nguyễn Minh An" })).toBeVisible();
    await expect(main.getByRole("link", { name: "Phêrô Nguyễn Minh Khoa" })).toBeVisible();
    await expect(main.getByText("Maria Trần Bảo Châu", { exact: true })).toHaveCount(0);

    const childLink = main.getByRole("link", { name: "Phêrô Nguyễn Minh Khoa" });
    const childHref = await childLink.getAttribute("href");
    expect(childHref).toMatch(/^\/parent\/children\/[0-9a-f-]{36}$/);
    await page.goto(childHref!, { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("main").getByRole("heading", { level: 1, name: "Phêrô Nguyễn Minh Khoa" }),
    ).toBeVisible();
    await expect(page.getByRole("main").getByRole("link", { name: "Con của tôi" })).toBeVisible();
    await expectNoHorizontalOverflow(page, "hồ sơ một trong nhiều con");
  });

  test("D-25: GLV đồng thời là phụ huynh vẫn có mục Con của tôi", async ({ page }) => {
    await login(page, STAFF_GUARDIAN);
    await openParentChildrenFromNavigation(page);

    const childLink = page.getByRole("main").getByRole("link", { name: "Anna Đinh Gia Hân" });
    const childHeading = page
      .getByRole("main")
      .getByRole("heading", { level: 1, name: "Anna Đinh Gia Hân" });
    await expect(childLink.or(childHeading).first()).toBeVisible({ timeout: 20_000 });
    if (await childLink.isVisible()) {
      const childHref = await childLink.getAttribute("href");
      expect(childHref).toMatch(/^\/parent\/children\/[0-9a-f-]{36}$/);
      await page.goto(childHref!, { waitUntil: "domcontentloaded" });
    }
    await expect(childHeading).toBeVisible({ timeout: 20_000 });
  });

  test("BR-M13-02: URL con của người khác trả 404 và không lộ tên", async ({ page }) => {
    await login(page, GUARDIAN_ONE_CHILD);
    await openParentChildrenFromNavigation(page);
    // `openParentChildrenFromNavigation` chủ ý chấp nhận cả URL danh sách và
    // chi tiết; trường hợp một con còn một redirect D-64 ở phía máy chủ.
    await expect(page).toHaveURL(/\/parent\/children\/[0-9a-f-]{36}$/, { timeout: 20_000 });
    const otherChildUrl = page.url();

    await login(page, GUARDIAN_TWO_CHILDREN);
    await page.goto(otherChildUrl);

    await expect(page.getByRole("heading", { level: 1, name: "Không tìm thấy trang" })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Trần Bảo Châu");
  });

  test("AC-01-01/02: vai trò sai bị chặn, thiếu nhi vẫn thấy chính mình", async ({ page }) => {
    await login(page, GUARDIAN_TWO_CHILDREN);
    await page.goto("/student/attendance");
    await expect(page).toHaveURL(/\/access-denied$/);

    await login(page, await studentUsername());
    await page.goto("/student/attendance");
    await expect(page).toHaveURL(/\/student\/attendance$/);
    await expect(page.getByRole("heading", { level: 1, name: "Điểm danh của em" })).toBeVisible();
  });

  test("TB-M13-03/04: bốn nguyên nhân rỗng khác nhau và mật độ dễ đọc", async ({ page }, testInfo) => {
    const fixture = await prepareEmptyStateFixtures(testInfo);

    await login(page, fixture.unlinkedUsername);
    await page.goto("/parent/children");
    await expect(page.getByRole("heading", { level: 3, name: "Tài khoản chưa được gắn với hồ sơ" })).toBeVisible();

    await login(page, fixture.noChildrenUsername);
    await page.goto("/parent/children");
    await expect(page.getByRole("heading", { level: 3, name: "Hồ sơ người giám hộ chưa có thiếu nhi" })).toBeVisible();
    const comfortable = page.locator('[data-density="comfortable"]').first();
    await expect(comfortable).toBeVisible();
    const density = await comfortable.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        body: style.getPropertyValue("--text-base").trim(),
        control: style.getPropertyValue("--control-height").trim(),
      };
    });
    expect(density).toEqual({ body: "17px", control: "48px" });

    await login(page, fixture.noEnrollmentUsername);
    await page.goto("/parent/children");
    await expect(page).toHaveURL(new RegExp(`/parent/children/${fixture.studentId}$`));
    await expect(page.getByRole("heading", { level: 3, name: "Chưa có ghi danh trong năm học hiện hành" })).toBeVisible();
    await expect(page.getByText(/chưa được ghi danh trong năm học/)).toBeVisible();

    await page.goto("/results");
    await expect(page.getByRole("heading", { level: 3, name: "Chưa có ghi danh trong năm học hiện hành" })).toBeVisible();

    const { error: enrollmentError } = await fixture.admin.from("enrollments").upsert({
      id: fixture.enrollmentId,
      student_id: fixture.studentId,
      academic_year_id: fixture.year.id,
      class_id: fixture.classId,
      status: "active",
      enrolled_on: fixture.year.start_date,
      ended_on: null,
      previous_enrollment_id: null,
    });
    if (enrollmentError) throw enrollmentError;

    await page.goto(`/parent/children/${fixture.studentId}`);
    await expect(page.getByRole("heading", { level: 3, name: "Chưa có buổi điểm danh nào được chốt" })).toBeVisible();
    await expect(
      page.getByRole("main").getByText(
        `Năm học ${fixture.year.code} chưa có buổi điểm danh đã chốt cho hồ sơ này.`,
        { exact: true },
      ),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page, "trạng thái rỗng portal");
  });

  test("TB-M13-06: kết quả, giáo án và thông báo dùng chung route nhưng giữ đúng portal", async ({ page }) => {
    await login(page, GUARDIAN_TWO_CHILDREN);
    await page.goto("/results");
    await expect(page.getByRole("heading", { level: 1, name: "Kết quả học tập" })).toBeVisible();
    await page.goto("/teaching-plan");
    await expect(page.getByRole("heading", { level: 1, name: "Giáo án" })).toBeVisible();
    await expect(page.getByText("Lịch học 7 ngày tới của con")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Giáo án theo lớp" })).toHaveCount(0);
    await page.goto("/notifications");
    await expect(page.getByRole("heading", { level: 1, name: "Thông báo" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Soạn thông báo" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Đã gửi" })).toHaveCount(0);
    await expectNoHorizontalOverflow(page, "ba route portal dùng chung");

    await login(page, await studentUsername());
    for (const route of ["/results", "/teaching-plan", "/notifications"]) {
      await page.goto(route);
      await expect(page).toHaveURL(new RegExp(`${route}$`));
    }
    await expect(page.getByRole("heading", { level: 1, name: "Thông báo" })).toBeVisible();
  });

  test("TB-M13-06: ẩn cột công bố cập nhật lại điểm trung bình trên portal", async ({ page }, testInfo) => {
    const fixture = await prepareEmptyStateFixtures(testInfo);
    const firstAssessmentId = fixtureUuid(5, EMPTY_FIXTURE[testInfo.project.name as ProjectName].index);
    const secondAssessmentId = fixtureUuid(6, EMPTY_FIXTURE[testInfo.project.name as ProjectName].index);
    const firstTitle = `Điểm hệ số hai M13-${testInfo.project.name}`;
    const secondTitle = `Điểm hệ số một M13-${testInfo.project.name}`;

    const { error: enrollmentError } = await fixture.admin.from("enrollments").upsert({
      id: fixture.enrollmentId,
      student_id: fixture.studentId,
      academic_year_id: fixture.year.id,
      class_id: fixture.classId,
      status: "active",
      enrolled_on: fixture.year.start_date,
      ended_on: null,
      previous_enrollment_id: null,
    });
    if (enrollmentError) throw enrollmentError;

    const { error: assessmentError } = await fixture.admin.from("assessments").upsert([
      {
        id: firstAssessmentId,
        academic_year_id: fixture.year.id,
        class_id: fixture.classId,
        created_by: fixture.noEnrollmentProfileId,
        kind: "custom",
        title: firstTitle,
        weight: 2,
        max_score: 10,
        is_active: true,
        is_published: true,
      },
      {
        id: secondAssessmentId,
        academic_year_id: fixture.year.id,
        class_id: fixture.classId,
        created_by: fixture.noEnrollmentProfileId,
        kind: "custom",
        title: secondTitle,
        weight: 1,
        max_score: 10,
        is_active: true,
        is_published: true,
      },
    ]);
    if (assessmentError) throw assessmentError;

    const { error: scoreError } = await fixture.admin.from("assessment_scores").upsert([
      {
        id: fixtureUuid(7, EMPTY_FIXTURE[testInfo.project.name as ProjectName].index),
        academic_year_id: fixture.year.id,
        assessment_id: firstAssessmentId,
        assessment_published: true,
        class_id: fixture.classId,
        enrollment_id: fixture.enrollmentId,
        student_id: fixture.studentId,
        score: 10,
      },
      {
        id: fixtureUuid(8, EMPTY_FIXTURE[testInfo.project.name as ProjectName].index),
        academic_year_id: fixture.year.id,
        assessment_id: secondAssessmentId,
        assessment_published: true,
        class_id: fixture.classId,
        enrollment_id: fixture.enrollmentId,
        student_id: fixture.studentId,
        score: 4,
      },
    ]);
    if (scoreError) throw scoreError;

    const { count: publishedBefore, error: beforeError } = await fixture.admin
      .from("assessments")
      .select("id", { count: "exact", head: true })
      .eq("class_id", fixture.classId)
      .eq("is_active", true)
      .eq("is_published", true);
    if (beforeError) throw beforeError;

    await login(page, fixture.noEnrollmentUsername);
    await page.goto("/results");
    const main = page.getByRole("main");
    await expect(main.getByText(firstTitle, { exact: true })).toBeVisible();
    await expect(main.getByText(secondTitle, { exact: true })).toBeVisible();
    await expect(main.getByText("TB 8", { exact: true })).toBeVisible();
    await expect(
      main.getByText(`Tính trên 2/${publishedBefore ?? 2} cột đã công bố.`, { exact: true }),
    ).toBeVisible();

    const { error: hideError } = await fixture.admin
      .from("assessments")
      .update({ is_published: false })
      .eq("id", firstAssessmentId);
    if (hideError) throw hideError;

    const { count: publishedAfter, error: afterError } = await fixture.admin
      .from("assessments")
      .select("id", { count: "exact", head: true })
      .eq("class_id", fixture.classId)
      .eq("is_active", true)
      .eq("is_published", true);
    if (afterError) throw afterError;

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(main.getByText(firstTitle, { exact: true })).toHaveCount(0);
    await expect(main.getByText(secondTitle, { exact: true })).toBeVisible();
    await expect(main.getByText("TB 4", { exact: true })).toBeVisible();
    await expect(
      main.getByText(`Tính trên 1/${publishedAfter ?? 1} cột đã công bố.`, { exact: true }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page, "đối chiếu điểm trung bình portal");
  });
});
