import ExcelJS from "exceljs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";
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
    // 🔴 `ended_on`/`previous_enrollment_id` phải đặt lại về null TƯỜNG MINH.
    // `upsert` chỉ ghi đè đúng những cột được liệt kê, nên bản cũ để lại nguyên
    // giá trị của lượt chạy trước. Chính bài test này kết thúc ghi danh khi
    // duyệt chuyển lớp (`status='completed'`, `ended_on=<ngày>`); lượt chạy sau
    // đặt lại `status='active'` mà `ended_on` vẫn còn ⇒ vi phạm ràng buộc
    // `enrollments_open_has_no_end` ngay ở bước dựng dữ liệu. Đo được: cả 3
    // viewport rớt ở đúng dòng này, và bộ E2E chỉ chạy được **một lần** sau mỗi
    // `db:reset` — đúng loại ma sát khiến nợ #9 (E2E chưa chạy) kéo dài.
    const { error: enrollmentError } = await admin.from("enrollments").upsert({
      id: enrollmentId, student_id: studentId, academic_year_id: year.id,
      class_id: sourceClass.id, status: "active", enrolled_on: year.start_date,
      ended_on: null, previous_enrollment_id: null,
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
  // 🔴 Xoá cookie TRƯỚC khi mở /login — M14 NC-3.
  // Từ nay `/login` chuyển thẳng vào `/dashboard` khi đã có phiên hợp lệ, nên
  // "đăng nhập lại bằng người khác trên cùng một trang" không còn thấy biểu mẫu
  // (đo được: 6 test rớt vì chờ mãi ô "Tên đăng nhập"). Trong ứng dụng thật,
  // đổi tài khoản là **Đăng xuất rồi đăng nhập** — chức năng đăng xuất vừa được
  // thêm ở A-01, trước đó chưa hề tồn tại nên các spec mới phải làm vòng này.
  // Xoá cookie là cách diễn đạt đúng ý "bắt đầu như một người mới trên máy
  // sạch"; mỗi context là độc lập nên không đụng tới phiên của context khác
  // (bài tranh chấp/tiếp quản ở attendance dùng hai context riêng).
  await page.context().clearCookies();
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

/**
 * 🔴 **Nợ #10 — phần "chờ cứng 5 giây" của `results.spec.ts`, trả ở M07-A đúng
 * như bảng nợ đã hẹn.** (Phần `window.confirm` của cùng món nợ thuộc đợt C.)
 *
 * Sau một thao tác ghi, câu báo thành công hiện **ngay** vì nó là state phía
 * client đặt từ kết quả action; còn thứ **dẫn xuất từ dữ liệu máy chủ** — thẻ Top
 * 5 vừa tạo, nút "Ẩn" sau khi công bố, nhãn "Đã khóa" — chỉ về sau khi
 * `router.refresh()` lấy lại trang. Hai mốc ấy cách nhau đúng một vòng
 * round-trip, và ngưỡng mặc định của Playwright là **5 giây**.
 *
 * ⚠️ **Đây là che triệu chứng, không phải chữa** — và lượt chạy của M07-A đo được
 * nguyên nhân rõ hơn mọi lượt trước: khi bài rớt ở dòng "thẻ Top 5 vừa tạo",
 * `psql` cho thấy **cả hai bản ghi đã nằm trong bảng `leaderboards`**, câu *"Đã
 * tạo bảng Top 5"* đã hiện, mà nút thì vẫn kẹt ở **"Đang tạo…" [disabled]** —
 * tức `startTransition` chưa chốt vì lượt làm mới chưa về. Ghi vào được, câu trả
 * lời không về: đúng kết luận M03-C đã đo, không phải lỗi của mã ứng dụng.
 *
 * 20 giây là mốc `committees.spec.ts` đã dùng từ M09-C cho cùng loại khẳng định.
 */
async function expectSoon(locator: Locator) {
  await expect(locator).toBeVisible({ timeout: 20_000 });
}

/** Chờ action trả kết quả thật, rồi nạp lại dữ liệu dẫn xuất thay vì đua với router.refresh(). */
async function reloadAfterSuccess(page: Page, message: string | RegExp) {
  await expectSoon(page.getByRole("status").filter({ hasText: message }).last());
  await page.reload();
}

/**
 * Trên mobile chỉ một cột điểm được dựng. Một `router.refresh()` muộn của thao
 * tác thêm cột có thể remount editor ngay sau lần chọn đầu và đưa select về cột
 * thứ nhất. Lặp cả thao tác chọn lẫn hậu điều kiện để test chờ đúng trạng thái
 * ổn định, thay vì chỉ kéo dài timeout trên một nút sẽ không bao giờ xuất hiện.
 */
async function selectScoreColumn(page: Page, title: string) {
  const button = page.getByRole("button", { name: `Lưu điểm ${title}` });
  const mobileSelect = page.locator("#mobile-assessment");
  if (await mobileSelect.isVisible()) {
    await expect(async () => {
      await mobileSelect.selectOption({ label: title });
      await expect(button).toBeVisible();
    }).toPass({ timeout: 20_000 });
  }
  await expectSoon(button);
}

/**
 * M07-B — thẻ chứa một biểu mẫu cấu hình cột điểm.
 *
 * 🔴 Badge *"N điểm đã nhập"* / *"Chưa có điểm"* nằm **ngoài** `<form>`: form giữ
 * ba ô nhập và hàng nút, còn hàng badge là một khối riêng ngay dưới nó. Neo
 * `getByText` vào form thì bài đỏ với *"element(s) not found"* trong khi giao
 * diện **đang hiện đúng chữ ấy** — lượt chạy đầu của đợt B bắt được đúng chỗ này.
 */
function settingsCardOf(form: Locator): Locator {
  return form.locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
}

/**
 * M07-C · **nợ #1** — bốn chỗ `window.confirm` cuối cùng của toàn hệ thống đã
 * thành `ConfirmDialog`, nên `page.once("dialog", …)` không còn bắt được gì:
 * lời hỏi nay là DOM thật, không phải hộp thoại của trình duyệt.
 *
 * 🔴 Phải neo nút xác nhận **vào trong hộp thoại**. Ba trong bốn chỗ có nhãn
 * nút xác nhận **trùng** nhãn nút mở hộp thoại (*"Xóa cột"* · *"Khóa bảng
 * điểm"* · *"Mở khóa"*) — đúng thiết kế, vì `11` §5 đòi nút xác nhận nói ra
 * việc sẽ làm chứ không phải *"Đồng ý"*. Tìm theo tên ở cấp trang sẽ khớp hai
 * phần tử và Playwright ném `strict mode violation`.
 */
async function acceptConfirm(page: Page, confirmLabel: string) {
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible({ timeout: 20_000 });
  await dialog.getByRole("button", { name: confirmLabel, exact: true }).click();
  await expect(dialog).toHaveCount(0, { timeout: 20_000 });
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

    // Nợ #20 (M07-A) — **chỗ cuối cùng** của món nợ vùng chạm 44px. Đo
    // `boundingBox()`, tức **chiều cao thật đã dựng**: bài kiểm tên lớp CSS sẽ
    // xanh giả khi một lớp khác đè lên `min-h-11`.
    const backLink = page.getByRole("link", { name: "← Danh sách lớp" });
    const backBox = await backLink.boundingBox();
    expect(backBox, "link quay lại phải dựng được để đo").not.toBeNull();
    expect(backBox!.height, "vùng chạm link quay lại ≥ 44px (11 §5)").toBeGreaterThanOrEqual(44);

    const addForm = page.getByRole("heading", { name: "Thêm cột điểm" }).locator("xpath=../following-sibling::div/form");
    await addForm.locator('select[name="kind"]').selectOption("custom");
    await addForm.locator('input[name="title"]').fill(publishedTitle);
    await addForm.locator('input[name="weight"]').fill("2");
    await addForm.getByRole("button", { name: "Thêm cột" }).click();
    await reloadAfterSuccess(page, "Đã thêm cột điểm.");
    await selectScoreColumn(page, publishedTitle);

    const scoreForm = page.getByRole("button", { name: `Lưu điểm ${publishedTitle}` }).locator("xpath=ancestor::form");
    for (let index = 0; index < setup.studentNames.length; index += 1) {
      await scoreForm.getByLabel(`Điểm ${setup.studentNames[index]}`).fill(String(10 - index));
    }
    await scoreForm.getByRole("button", { name: `Lưu điểm ${publishedTitle}` }).click();
    // M07-A — đơn vị đếm đổi từ "dòng" sang "ô", và con số nay là **số ô thật sự
    // thay đổi**. Sáu em vừa được nhập lần đầu nên vẫn là 6; điều mới là bấm Lưu
    // lần thứ hai mà không sửa gì thì **không gửi gì lên máy chủ** — bài ngay
    // dưới canh đúng chỗ đó, vì nó chính là nguyên nhân gốc của F04.
    await expectSoon(scoreForm.getByText("Đã lưu 6 ô điểm."));
    await page.reload();
    await selectScoreColumn(page, publishedTitle);
    await scoreForm.getByRole("button", { name: `Lưu điểm ${publishedTitle}` }).click();
    await expect(scoreForm.getByText("Chưa có ô nào thay đổi nên không có gì để lưu.")).toBeVisible();
    const settingsForm = page.locator(`input[name="title"][value="${publishedTitle}"]`).locator("xpath=ancestor::form");
    await settingsForm.getByRole("button", { name: "Công bố" }).click();
    await reloadAfterSuccess(page, "Đã công bố kết quả cho phụ huynh và thiếu nhi trong lớp.");
    // M07-B — nhãn nút công bố đổi thành "Ẩn khỏi cổng". Nhãn cũ là đúng một chữ
    // "Ẩn", mà từ đợt này nút bên cạnh có thể đọc là "Ẩn cột" — hai chữ "Ẩn"
    // cạnh nhau với hai nghĩa khác hẳn, và bộ định vị theo tên sẽ khớp cả hai.
    await expectSoon(settingsForm.getByRole("button", { name: "Ẩn khỏi cổng" }));
    // TB-M07-01 — cột này đã có 6 điểm thật ⇒ chỉ được **ẩn**, không xóa được.
    // ⚠️ Badge đếm điểm nằm **ngoài** `<form>` (khối badge ngay dưới nó), nên phải
    // neo vào **thẻ**, không neo vào form — đúng cái bẫy lượt chạy đầu đã bắt.
    await expect(settingsForm.getByRole("button", { name: "Ẩn cột" })).toBeVisible();
    await expect(settingsCardOf(settingsForm).getByText("6 điểm đã nhập")).toBeVisible();

    // Một cột nháp chứng minh portal lọc published ngay cả khi đã có điểm khác công bố.
    await addForm.locator('input[name="title"]').fill(draftTitle);
    await addForm.locator('input[name="weight"]').fill("1");
    await addForm.getByRole("button", { name: "Thêm cột" }).click();
    await reloadAfterSuccess(page, "Đã thêm cột điểm.");
    await selectScoreColumn(page, draftTitle);

    /**
     * M07-B · **TB-M07-01 / AC-01-01** — cột tạo nhầm phải xóa được.
     *
     * 🔴 Trước đợt này đây là việc **không làm được**, và lý do nằm ở chỗ khác
     * hẳn nơi người dùng nhìn: biểu mẫu ghi cả roster nên cột nào cũng lập tức
     * có một dòng điểm rỗng cho mỗi em, khoá ngoại `on delete restrict` chặn
     * lại, và câu lỗi đọc được là *"Cột đã có điểm"* trong khi chưa ai nhập gì.
     *
     * Cột dựng riêng ở đây rồi xóa ngay, **không dùng lại** hai cột trên: chúng
     * còn phải đi tiếp qua phần xuất tệp và phần cổng phụ huynh.
     */
    const strayTitle = `Cột tạo nhầm ${suffix}`;
    await addForm.locator('input[name="title"]').fill(strayTitle);
    await addForm.locator('input[name="weight"]').fill("1");
    await addForm.getByRole("button", { name: "Thêm cột" }).click();
    await reloadAfterSuccess(page, "Đã thêm cột điểm.");
    const strayForm = page.locator(`input[name="title"][value="${strayTitle}"]`).locator("xpath=ancestor::form");
    await expectSoon(strayForm.getByRole("button", { name: "Xóa cột" }));
    await expect(settingsCardOf(strayForm).getByText("Chưa có điểm")).toBeVisible();
    await strayForm.getByRole("button", { name: "Xóa cột" }).click();
    await acceptConfirm(page, "Xóa cột");
    // D-61 — câu xác nhận phải sống sót qua lượt làm mới đã **xóa chính thẻ vừa
    // bấm**. Đây đúng hình dạng lỗi M05-B từng để lọt.
    await expectSoon(page.getByText(`Đã xóa cột “${strayTitle}”.`));
    // ⚠️ **Nợ #10 lại đúng chỗ này, và lượt chạy đầu của đợt B đo được cả hai
    // đầu.** Băng-rôn trên là state phía client, đặt ngay khi action trả về ⇒ nó
    // hiện tức thì và chứng minh dòng đã bị xóa dưới cơ sở dữ liệu. Thẻ cột biến
    // mất thì phải chờ `router.refresh()`, và ảnh chụp lỗi cho thấy nút vẫn nằm
    // ở trạng thái `[disabled]` — tức lượt làm mới **chưa về**, đúng chữ ký mà
    // M05-C dặn cách phân biệt. Nới lên cùng mốc 20 giây của `expectSoon`.
    await page.reload();
    await expect(page.locator(`input[name="title"][value="${strayTitle}"]`)).toHaveCount(0, { timeout: 20_000 });

    /**
     * **M07-C · nợ #21 — đường quay lại cho một cột đã ẩn**, món nợ do chính
     * M07-B mở ra. Đi trọn vòng ẩn → hiện lại trên cột **đã công bố**, vì đó là
     * ca đáng lo nhất: hiện lại một cột như thế là phụ huynh **thấy lại điểm
     * ngay**, và câu xác nhận phải nói ra điều đó.
     *
     * Vòng khép kín nên trạng thái trả về đúng chỗ cũ cho phần kiểm cổng phụ
     * huynh ở cuối bài.
     */
    await expect(page.getByRole("heading", { name: "Cột đã ẩn" })).toHaveCount(0);
    await settingsForm.getByRole("button", { name: "Ẩn cột" }).click();
    await acceptConfirm(page, "Ẩn cột");
    await expectSoon(page.getByText(`Đã ẩn cột “${publishedTitle}”.`, { exact: false }));
    await page.reload();
    await expectSoon(page.getByRole("heading", { name: "Cột đã ẩn" }));
    await page.getByRole("button", { name: "Xem 1 cột đã ẩn" }).click();
    const hiddenRow = page.getByRole("heading", { name: "Cột đã ẩn" })
      .locator("xpath=ancestor::section[1]").getByRole("listitem")
      .filter({ hasText: publishedTitle });
    await expect(hiddenRow).toBeVisible();
    await hiddenRow.getByRole("button", { name: "Hiện lại" }).click();
    await expect(page.getByRole("dialog")).toContainText("thấy lại điểm ngay lập tức");
    await acceptConfirm(page, "Hiện lại cột");
    await expectSoon(page.getByText(`Đã hiện lại cột “${publishedTitle}”.`));
    await page.reload();
    await expect(page.getByRole("heading", { name: "Cột đã ẩn" })).toHaveCount(0, { timeout: 20_000 });
    await expectSoon(page.locator(`input[name="title"][value="${publishedTitle}"]`));

    const commentCard = page.getByRole("heading", { name: setup.firstStudentName, exact: true })
      .locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
    const commentForm = commentCard.locator("form");
    // M07-B · **AC-05-01** — mặc định phải là **nội bộ**. Trước đợt này mặc định
    // là "Công khai cho phụ huynh/thiếu nhi", nên viết vội một câu về một em rồi
    // bấm Thêm là câu ấy ra thẳng cổng phụ huynh, không một dòng cảnh báo.
    await expect(commentForm.locator('select[name="visibility"]')).toHaveValue("staff_only");
    await commentForm.locator('select[name="visibility"]').selectOption("staff_only");
    await commentForm.locator('textarea[name="content"]').fill(internalComment);
    await commentForm.getByRole("button", { name: "Thêm nhận xét" }).click();
    await reloadAfterSuccess(page, "Đã thêm nhận xét.");
    await expectSoon(commentCard.getByText(internalComment, { exact: true }));
    await commentForm.locator('select[name="visibility"]').selectOption("student_visible");
    await commentForm.locator('textarea[name="content"]').fill(publicComment);
    await commentForm.getByRole("button", { name: "Thêm nhận xét" }).click();
    await reloadAfterSuccess(page, "Đã thêm nhận xét.");
    await expectSoon(commentCard.getByText(publicComment, { exact: true }));

    const newTopForm = page.getByRole("heading", { name: "Tạo Top 5" }).locator("xpath=../following-sibling::div/form");
    await newTopForm.locator('input[name="title"]').fill(topTitle);
    await newTopForm.locator('select[name="sourceAssessmentId"]').selectOption({ label: publishedTitle });
    await newTopForm.getByRole("button", { name: "Tạo bảng Top 5" }).click();
    const topCard = page.getByRole("heading", { name: topTitle, exact: true }).locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
    await expectSoon(topCard);
    await topCard.getByRole("button", { name: "Xem trước" }).click();
    await expect(topCard.locator("ol li")).toHaveCount(5);
    await topCard.getByRole("button", { name: "Công bố snapshot" }).click();
    await acceptConfirm(page, "Công bố");
    await expectSoon(topCard.getByText("Đã công bố", { exact: true }));
    // M07-C · D-155 — chốt lần đầu **không** sinh bản lịch sử nào; chỉ lần thay
    // mới sinh. Thẻ phải im lặng đúng lúc này, nếu không con số ấy vô nghĩa.
    await expect(topCard.getByText(/bản trước trong lịch sử/)).toHaveCount(0);

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

    await page.getByRole("button", { name: "Khóa bảng điểm" }).click();
    // M07-C · D-154 — câu xác nhận phải NÓI RA rằng công bố vẫn làm được sau
    // khi khóa. Không nói thì người dùng vẫn tưởng khóa là đóng sạch, rồi cuối
    // năm đi nhờ mở khóa cả bảng điểm chỉ để công bố một cột.
    await expect(page.getByRole("dialog")).toContainText("vẫn bật/tắt được sau khi khóa");
    await acceptConfirm(page, "Khóa bảng điểm");
    await expectSoon(page.getByText("Đã khóa", { exact: true }).first());
    await expect(page.getByRole("heading", { name: "Thêm cột điểm" })).toHaveCount(0);
    await expect(page.getByLabel(`Điểm ${setup.firstStudentName}`).first()).toBeDisabled();
    await expectNoHorizontalOverflow(page, "bảng điểm đã khóa");

    /**
     * 🔴 **M07-C · AC-02-01 / D-154 — hạng mục rủi ro cao nhất của module, đo
     * trên bộ máy thật.**
     *
     * pgTAP `045` đã chứng minh luật ở tầng cơ sở dữ liệu, nhưng đường công bố
     * đi qua **ba** lớp kiểm và lớp thứ ba nằm ở **bảng khác**: đổi
     * `assessments.is_published` làm trigger đồng bộ chạy một lệnh UPDATE lên
     * `assessment_scores`, mà trigger dòng của bảng ấy cũng ném `GRADEBOOK_LOCKED`.
     * Chỉ một lượt bấm thật mới chứng minh cả ba lớp cùng thông.
     *
     * Bật rồi tắt lại ngay: **cả hai chiều** là điều chủ dự án chốt, và trả
     * trạng thái về đúng chỗ cũ để phần kiểm cổng phụ huynh ở cuối bài (cột
     * nháp **không** được hiện) vẫn đo đúng thứ nó định đo.
     */
    const draftForm = page.locator(`input[name="title"][value="${draftTitle}"]`).locator("xpath=ancestor::form");
    const draftCard = settingsCardOf(draftForm);
    await expect(draftForm.getByRole("button", { name: "Công bố" })).toBeEnabled();
    await expect(draftForm.getByRole("button", { name: "Lưu" })).toBeDisabled();
    await draftForm.getByRole("button", { name: "Công bố" }).click();
    await expectSoon(draftCard.getByText("Đã công bố kết quả cho phụ huynh và thiếu nhi trong lớp."));
    await expectSoon(draftForm.getByRole("button", { name: "Ẩn khỏi cổng" }));
    await draftForm.getByRole("button", { name: "Ẩn khỏi cổng" }).click();
    await expectSoon(draftCard.getByText("Đã ẩn kết quả khỏi cổng phụ huynh."));
    await expectSoon(draftForm.getByRole("button", { name: "Công bố" }));

    await login(page, "KHANG.NHO");
    await page.goto(`/results/${setup.classId}`);
    await page.getByRole("button", { name: "Mở khóa" }).click();
    await acceptConfirm(page, "Mở khóa");
    await expectSoon(page.getByText("Đang mở", { exact: true }).first());

    /**
     * 🔴 **M08-A đã thiết kế lại `/promotions`, nên đoạn này phải viết lại.**
     *
     * Trang không còn là một lưới thẻ, mỗi thẻ một `<h3>` tên em kèm hai biểu
     * mẫu bung sẵn; nó là **bảng có bộ lọc**, trạng thái nằm trên URL, và hai
     * biểu mẫu nằm trong panel **đóng sẵn** (TO-BE 1). Đây là bài E2E **duy
     * nhất** chạy hết đường ghi của module chuyển lớp — AC-01 (đề xuất) và
     * AC-04 (duyệt là nguyên tử) — nên nó phải theo kịp giao diện, không được
     * bỏ đi.
     *
     * Lọc thẳng theo tên để dòng cần thao tác là **duy nhất**: fixture dựng 6 em
     * trong lớp nguồn, và panel bung ra là một `<tr>` **kế tiếp** chứ không nằm
     * trong dòng vừa bấm — nên bộ định vị của biểu mẫu phải neo ở mức trang.
     */
    const proposalQuery = `/promotions?q=${encodeURIComponent(setup.firstStudentName)}`;
    const rosterRow = () =>
      page.getByRole("table", { name: /Danh sách thiếu nhi/ }).locator("tbody tr")
        .filter({ hasText: setup.firstStudentName });

    await login(page, setup.fixture.rep);
    await page.goto(proposalQuery);
    await expect(rosterRow().first()).toBeVisible();
    await rosterRow().getByRole("button", { name: /Mở chi tiết của/ }).click();
    await page.getByLabel("Đề xuất", { exact: true }).selectOption("recommended_promote");
    // BR-M08-X2: lớp đích của fixture là lớp DUY NHẤT đúng cấp ở năm sau và
    // không chia nhánh, nên mặc định phải rơi đúng vào nó mà không cần chọn tay.
    // `exact: true` cùng lý do với `name: "Lọc"` ở `promotions.spec.ts`: từ M08-C
    // trang có thêm nhãn *"Lớp đích chung"* (thanh hàng loạt) và *"Lớp đích khi
    // duyệt"*, mà phép khớp nhãn mặc định là **chứa chuỗi**.
    await expect(page.getByLabel("Lớp đích", { exact: true })).toHaveValue(setup.targetClassId);
    await page.getByRole("button", { name: "Gửi đề xuất cho Trưởng ngành" }).click();
    await expectSoon(page.getByText(/Đã gửi đề xuất của/));

    await page.goto(proposalQuery);
    await expectSoon(rosterRow().getByText("Chờ duyệt", { exact: true }));

    await login(page, "GLV901");
    await page.goto(proposalQuery);
    await expect(rosterRow().first()).toBeVisible();
    await rosterRow().getByRole("button", { name: /Mở chi tiết của/ }).click();
    await page.getByRole("button", { name: "Duyệt", exact: true }).click();
    /**
     * 🔴 **M08-C / AC-14 — "Duyệt" nay HỎI LẠI trước khi chạy, và bước này là
     * bắt buộc chứ không phải một cú bấm thừa.**
     *
     * Đây chính là chỗ lượt E2E đầu của M08-C bắt được lỗi: bài này bấm "Duyệt"
     * rồi đọc thẳng cơ sở dữ liệu, nên khi hộp xác nhận xuất hiện thì ghi danh
     * vẫn `active` và bài đỏ ở **cả ba viewport** — đúng hình dạng của một thay
     * đổi hành vi có chủ đích, không phải nợ #10 (đỏ đều ở mọi viewport, không
     * đổi chỗ giữa các lượt).
     *
     * Nhãn nút xác nhận nói ra **việc sắp làm** (`review-consequence.ts`), nên
     * neo vào đúng chữ ấy thay vì một nút "Xác nhận" chung chung.
     */
    const approveDialog = page.getByRole("dialog");
    await expect(approveDialog).toBeVisible();
    await expect(approveDialog).toContainText(setup.firstStudentName);
    await approveDialog.getByRole("button", { name: "Duyệt lên lớp" }).click();
    await reloadAfterSuccess(page, `Đã duyệt và cập nhật ghi danh của ${setup.firstStudentName}.`);
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
