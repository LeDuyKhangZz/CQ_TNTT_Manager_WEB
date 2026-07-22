import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect, test, type Page, type TestInfo } from "@playwright/test";
import type { Database } from "../../src/types/database";

/**
 * Phase 6 — Ban, thiết bị, thông báo, báo cáo.
 *
 * Cần DB local đã `npm run db:reset && npm run seed:dev`.
 *
 * Ba viewport chạy song song trên CÙNG một bộ fixture seed, nên mọi dữ liệu do
 * test tạo ra đều mang chỉ số riêng của project (mã thiết bị, tiêu đề thông
 * báo, tuần công việc, ngày điểm danh). Không có chỉ số này thì ba project
 * tranh nhau cùng một dòng và số liệu nhảy loạn.
 */
const DEV_PASSWORD = "123456";
const COMMITTEE_SINH_HOAT = "30000000-0000-0000-0000-000000000001";
const COMMITTEE_KY_THUAT = "30000000-0000-0000-0000-000000000002";

const PROJECT_INDEX: Record<string, number> = {
  "mobile-360": 1,
  "tablet-768": 2,
  "laptop-1366": 3,
};

function indexOf(testInfo: TestInfo): number {
  const index = PROJECT_INDEX[testInfo.project.name];
  if (!index) throw new Error(`Project chưa khai báo chỉ số: ${testInfo.project.name}`);
  return index;
}

let adminClient: SupabaseClient<Database> | null = null;

function getLocalAdmin(): SupabaseClient<Database> {
  if (adminClient) return adminClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || !/^https?:\/\/(127\.0\.0\.1|localhost)(:|$)/.test(url)) {
    throw new Error("E2E Phase 6 chỉ chạy với Supabase local và service role key.");
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
      await page.waitForURL(/\/dashboard$/, { timeout: 10_000 });
      return;
    } catch {
      await page.goto("/login");
    }
  }
  throw new Error(`Không đăng nhập được bằng ${username}. Đã chạy seed:dev chưa?`);
}

async function expectNoHorizontalOverflow(page: Page, where: string) {
  await page.waitForLoadState("domcontentloaded");
  await page.locator("body").waitFor({ state: "attached" });
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  expect(overflows, `${where} không được tràn ngang`).toBe(false);
}

async function currentYear() {
  const admin = getLocalAdmin();
  const { data } = await admin
    .from("academic_years")
    .select("id, start_date, end_date")
    .eq("status", "current")
    .single();
  if (!data) throw new Error("Chưa có năm học hiện hành. Chạy seed:dev trước.");
  return data;
}

async function classIdByName(name: string): Promise<string> {
  const admin = getLocalAdmin();
  const year = await currentYear();
  const { data } = await admin
    .from("classes")
    .select("id")
    .eq("academic_year_id", year.id)
    .eq("display_name", name)
    .single();
  if (!data) throw new Error(`Không tìm thấy lớp ${name}`);
  return data.id;
}

/** Thứ Năm thứ `offset` kể từ đầu năm học — mỗi project một ngày riêng. */
function thursdayInYear(startDate: string, offset: number): string {
  const date = new Date(`${startDate}T00:00:00Z`);
  while (date.getUTCDay() !== 4) date.setUTCDate(date.getUTCDate() + 1);
  date.setUTCDate(date.getUTCDate() + offset * 7);
  return date.toISOString().slice(0, 10);
}

test.describe("Phase 6 — Ban và thiết bị", () => {
  test("Trưởng ban đăng nội dung, thành viên chỉ đọc, người ngoài Ban không thấy", async ({ page }, testInfo) => {
    const index = indexOf(testInfo);
    const admin = getLocalAdmin();
    // Chạy lại suite trên cùng một DB là chuyện thường; tiêu đề mang dấu thời
    // gian để lần chạy trước không làm locator khớp nhiều phần tử.
    const runId = Date.now().toString(36);
    const assetCode = `E2E-P6-${index}`;
    const announcementTitle = `Thông báo Ban E2E ${index}-${runId}`;
    const meetingTitle = `Họp Ban E2E ${index}-${runId}`;

    // Thiết bị riêng cho project này để ba viewport không trừ kho của nhau.
    // Phiếu mượn tham chiếu thiết bị bằng ON DELETE RESTRICT nên phải dọn trước.
    const { data: staleItem } = await admin
      .from("equipment_items")
      .select("id")
      .eq("asset_code", assetCode)
      .maybeSingle();
    if (staleItem) {
      await admin.from("equipment_loans").delete().eq("equipment_item_id", staleItem.id);
      await admin.from("equipment_items").delete().eq("id", staleItem.id);
    }
    const { error: itemError } = await admin.from("equipment_items").insert({
      committee_id: COMMITTEE_KY_THUAT,
      asset_code: assetCode,
      name: `Đèn sân khấu E2E ${index}`,
      category: "Ánh sáng",
      total_quantity: 3,
      available_quantity: 3,
      storage_location: "Kho E2E",
    });
    expect(itemError, "tạo thiết bị fixture").toBeNull();

    // ── GLV909: Trưởng Ban Sinh hoạt, đồng thời là thành viên Ban Kỹ thuật ──
    await login(page, "GLV909");
    await page.goto("/committees");
    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { name: "Ban", exact: true })).toBeVisible();
    await expect(page.getByText("Ban Sinh hoạt")).toBeVisible();
    await expect(page.getByText("Ban Kỹ thuật")).toBeVisible();
    // Thành viên chỉ thấy Ban mình: hai Ban, không phải cả sáu.
    await expect(page.getByText("Ban Y tế")).toHaveCount(0);
    await expect(page.getByText("Ban Phụng vụ")).toHaveCount(0);
    await expectNoHorizontalOverflow(page, "/committees");

    // ── Đăng thông báo, lịch họp, công việc tuần ở Ban mình làm Trưởng ──────
    await page.goto(`/committees/${COMMITTEE_SINH_HOAT}`);
    await expect(main.getByRole("heading", { name: "Ban Sinh hoạt" })).toBeVisible();
    await page.getByLabel("Tiêu đề").fill(announcementTitle);
    await page.getByLabel("Nội dung thông báo").fill("Chuẩn bị đạo cụ cho Trung Thu.");
    await page.getByRole("button", { name: "Đăng thông báo" }).click();
    await expect(page.getByText("Đã đăng thông báo Ban.")).toBeVisible();
    await expect(page.getByText(announcementTitle)).toBeVisible();

    await page.getByLabel("Nội dung buổi họp").fill(meetingTitle);
    await page.getByLabel("Bắt đầu", { exact: true }).fill("2026-10-03T19:00");
    await page.getByRole("button", { name: "Lưu lịch họp" }).click();
    await expect(page.getByText("Đã lưu lịch họp.")).toBeVisible();
    await expect(page.getByText(meetingTitle)).toBeVisible();

    // Mỗi Ban chỉ có một bản công việc cho mỗi tuần, nên mỗi project một tuần.
    const weekStart = `2026-10-${String(5 + (index - 1) * 7).padStart(2, "0")}`;
    await page.getByLabel("Tuần bắt đầu (thứ Hai)").fill(weekStart);
    await page.getByLabel("Checklist (mỗi dòng một việc)").fill("Mua đèn\nTập múa");
    await page.getByRole("button", { name: "Lưu công việc tuần" }).click();
    await expect(page.getByText("Đã lưu công việc tuần.")).toBeVisible();
    await expect(page.getByText("Mua đèn").first()).toBeVisible();
    await expectNoHorizontalOverflow(page, "/committees/sinh-hoat");

    // ── Ban Kỹ thuật: chỉ là thành viên nên không có form đăng thông báo ────
    await page.goto(`/committees/${COMMITTEE_KY_THUAT}`);
    await expect(main.getByRole("heading", { name: "Ban Kỹ thuật" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Đăng thông báo" })).toHaveCount(0);
    // ...nhưng vẫn mượn/trả được (docs/05: thành viên Ban Kỹ thuật có quyền).
    const itemCard = page.locator("li", { hasText: assetCode }).first();
    await expect(itemCard.getByText("Khả dụng 3/3")).toBeVisible();
    await itemCard.getByRole("button", { name: "Cho mượn" }).click();
    await itemCard.getByLabel("Người mượn").selectOption({ index: 1 });
    await itemCard.getByLabel("Số lượng", { exact: true }).fill("2");
    await itemCard.getByRole("button", { name: "Ghi nhận mượn" }).click();
    await expect(page.getByText("Đã ghi nhận lượt mượn.")).toBeVisible();
    await expect(page.locator("li", { hasText: assetCode }).first().getByText("Khả dụng 1/3")).toBeVisible();

    // Trả thiếu một cái: phần mất phải rời khỏi tổng số, không âm thầm biến mất.
    const loanCard = page.locator("div", { hasText: `Đèn sân khấu E2E ${index}` }).filter({
      has: page.getByRole("button", { name: "Ghi nhận trả" }),
    }).first();
    await loanCard.getByLabel("Số lượng trả được").fill("1");
    await loanCard.getByRole("button", { name: "Ghi nhận trả" }).click();
    await expect(page.getByText("Đã ghi nhận lượt trả.")).toBeVisible();
    await expect(page.locator("li", { hasText: assetCode }).first().getByText("Khả dụng 2/2")).toBeVisible();

    // ── Người ngoài Ban: không thấy Ban nào và không mở được bằng URL trực tiếp
    await page.context().clearCookies();
    await login(page, "GLV907");
    await page.goto("/committees");
    await expect(page.getByText("Bạn chưa thuộc Ban nào")).toBeVisible();
    await page.goto(`/committees/${COMMITTEE_SINH_HOAT}`);
    await expect(page.getByRole("heading", { name: "Không tìm thấy trang" })).toBeVisible();
    // Điều thật sự quan trọng: không rò nội dung Ban của người khác.
    await expect(page.getByText(announcementTitle)).toHaveCount(0);
    await expect(page.getByText(meetingTitle)).toHaveCount(0);
  });
});

test.describe("Phase 6 — Thông báo", () => {
  test("thông báo lớp tới đúng người nhận và có read state riêng", async ({ page }, testInfo) => {
    const index = indexOf(testInfo);
    const title = `Chúa nhật mặc đồng phục ${index}-${Date.now().toString(36)}`;
    const classId = await classIdByName("Ấu 1A");

    // ── Đại diện lớp Ấu 1A gửi thông báo cho lớp mình ───────────────────────
    await login(page, "GLV909");
    await page.goto("/notifications");
    await page.getByLabel("Phạm vi").selectOption("class");
    await page.getByLabel("Đối tượng nhận").selectOption(classId);
    await page.getByLabel("Tiêu đề").fill(title);
    await page.getByLabel("Nội dung", { exact: true }).fill("Các em nhớ mặc đồng phục Chúa nhật này.");
    await page.getByLabel("Liên kết kèm theo (tùy chọn)").selectOption("/attendance");
    await page.getByRole("button", { name: "Gửi thông báo" }).click();
    await expect(page.getByText("Đã gửi thông báo.")).toBeVisible();
    await expectNoHorizontalOverflow(page, "/notifications");

    // ── Phụ huynh có con trong lớp: nhận được, badge đếm và đánh dấu đã đọc ──
    await page.context().clearCookies();
    await login(page, "84912000001");
    await expect(page.getByTestId("unread-notification-badge")).toBeVisible();
    await page.goto("/notifications");
    const row = page.locator("li", { hasText: title }).first();
    await expect(row).toBeVisible();
    await expect(row.getByRole("link", { name: "Mở trang liên quan" })).toHaveAttribute("href", "/attendance");
    await row.getByRole("button", { name: "Đánh dấu đã đọc" }).click();
    await expect(page.locator("li", { hasText: title }).first().getByRole("button", { name: "Đánh dấu đã đọc" }))
      .toHaveCount(0);

    // ── Giáo lý viên lớp khác: không nằm trong danh sách nhận ───────────────
    await page.context().clearCookies();
    await login(page, "GLV912");
    await page.goto("/notifications");
    await expect(page.getByText(title)).toHaveCount(0);
  });
});

test.describe("Phase 6 — Báo cáo và snapshot", () => {
  test("báo cáo giữ đúng filter, chốt xong tải lại được bản không đổi", async ({ page }, testInfo) => {
    const index = indexOf(testInfo);
    const admin = getLocalAdmin();
    const year = await currentYear();
    const classId = await classIdByName("Ấu 1A");
    const attendanceDate = thursdayInYear(year.start_date, index + 3);

    // Buổi điểm danh đã chốt để báo cáo có số liệu. Dùng service role vì đây là
    // dữ liệu nền, không phải thao tác đang được kiểm.
    await admin
      .from("attendance_sessions")
      .delete()
      .eq("class_id", classId)
      .eq("attendance_date", attendanceDate);
    const { data: finalizer } = await admin
      .from("profiles")
      .select("id")
      .eq("username", "GLV909")
      .single();
    const { data: session, error: sessionError } = await admin
      .from("attendance_sessions")
      .insert({
        class_id: classId,
        academic_year_id: year.id,
        attendance_date: attendanceDate,
        meeting_type: "thursday",
        status: "completed",
        // CHECK `attendance_sessions_finalized_shape`: chốt thì phải có người chốt.
        finalized_at: new Date().toISOString(),
        finalized_by: finalizer!.id,
      })
      .select("id")
      .single();
    expect(sessionError?.message ?? null, "tạo buổi điểm danh fixture").toBeNull();

    const { data: enrollments } = await admin
      .from("enrollments")
      .select("id, student_id")
      .eq("class_id", classId)
      .eq("status", "active");
    expect((enrollments ?? []).length, "lớp Ấu 1A phải có ghi danh từ seed:dev").toBeGreaterThan(0);
    const { error: recordError } = await admin.from("student_attendance_records").insert(
      (enrollments ?? []).map((enrollment, position) => ({
        attendance_session_id: session!.id,
        enrollment_id: enrollment.id,
        class_id: classId,
        student_id: enrollment.student_id,
        mass_status: position === 0 ? ("unexcused_absence" as const) : ("present" as const),
        catechism_status: "present" as const,
      })),
    );
    expect(recordError?.message ?? null, "tạo bản ghi điểm danh fixture").toBeNull();

    // ── Xem báo cáo đúng tuần và đúng lớp ──────────────────────────────────
    await login(page, "GLV901");
    const filterQuery = `reportType=attendance&periodType=week&anchorDate=${attendanceDate}&scopeType=class&scopeId=${classId}`;
    await page.goto(`/reports?${filterQuery}`);
    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { name: "Báo cáo", exact: true })).toBeVisible();
    const reportTable = page.getByRole("table");
    await expect(reportTable.getByText("Ấu 1A", { exact: true })).toBeVisible();
    await expectNoHorizontalOverflow(page, "/reports");

    // File tải về dùng lại chính chuỗi filter đang xem (D-52).
    const excel = await page.request.get(`/reports/export?${filterQuery}&format=xlsx`);
    expect(excel.status()).toBe(200);
    expect(excel.headers()["content-type"]).toContain("spreadsheetml");
    const pdf = await page.request.get(`/reports/export?${filterQuery}&format=pdf`);
    expect(pdf.status()).toBe(200);
    expect(pdf.headers()["content-type"]).toContain("pdf");

    // ── Chốt báo cáo rồi tải lại bản chốt ──────────────────────────────────
    await page.getByRole("button", { name: "Chốt báo cáo" }).click();
    await expect(page.getByText("Đã chốt báo cáo.", { exact: false })).toBeVisible();
    const snapshotLink = page.getByRole("link", { name: "Tải bản chốt" }).first();
    await expect(snapshotLink).toBeVisible();
    const snapshotHref = await snapshotLink.getAttribute("href");
    expect(snapshotHref).toBeTruthy();
    const snapshotFile = await page.request.get(snapshotHref!);
    expect(snapshotFile.status()).toBe(200);
    expect(snapshotFile.headers()["content-type"]).toContain("spreadsheetml");

    // Dữ liệu nguồn đổi sau khi chốt không được làm đổi bản đã chốt.
    //
    // So sánh theo `payload_json`/`checksum` chứ KHÔNG so kích thước file: file
    // Excel được sinh lại từ payload mỗi lần tải, mà ExcelJS nhúng mốc thời gian
    // vào workbook nên hai lần tải cùng một snapshot có thể lệch nhau một byte.
    // Kích thước file chưa bao giờ là thứ cần bất biến — payload mới là.
    const snapshotId = snapshotHref!.split("/").at(-2);
    const sealed = await admin
      .from("report_snapshots")
      .select("payload_json, checksum, generated_at")
      .eq("id", snapshotId!)
      .single();
    expect(sealed.data).toBeTruthy();

    await admin.from("attendance_sessions").delete().eq("id", session!.id);

    const afterChange = await admin
      .from("report_snapshots")
      .select("payload_json, checksum, generated_at")
      .eq("id", snapshotId!)
      .single();
    expect(afterChange.data, "bản chốt không được đổi khi dữ liệu nguồn bị xóa").toEqual(
      sealed.data,
    );

    const snapshotAfterChange = await page.request.get(snapshotHref!);
    expect(snapshotAfterChange.status()).toBe(200);
    expect(snapshotAfterChange.headers()["content-type"]).toContain("spreadsheetml");
    expect((await snapshotAfterChange.body()).byteLength).toBeGreaterThan(0);
  });
});
