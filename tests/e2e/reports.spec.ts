import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";
import type { Database } from "../../src/types/database";

/**
 * M11 — Báo cáo & Dashboard trên trình duyệt thật.
 *
 * 🔴 **N-6 (`07_IMPLEMENTATION_IMPACT` §5): trước file này, `/reports` và
 * `/dashboard` KHÔNG có một bài E2E nào.** Hai màn hình mà mọi vai trò đều đi
 * qua — `/dashboard` là nơi ai cũng đổ vào ngay sau khi đăng nhập — và cả hai
 * đợt kiểm của Phase 6/7 đều bỏ trắng. Đó là lý do bốn trong sáu lỗi mà M11-A
 * tìm ra sống sót được: chúng chỉ hiện ra khi có người **mở trang**.
 *
 * 🔴 **Vì sao spec này tự dựng dữ liệu điểm danh.** `seed:dev` tạo lớp, thiếu
 * nhi và nhân sự nhưng **không tạo một buổi điểm danh đã chốt nào** — đã đo:
 * `report_attendance_rows` trả 0 dòng cho cả vai trò toàn cục. Với 0 dòng thì
 * nút "Chốt báo cáo" luôn `disabled`, tức đường ghi của module — thao tác
 * **không lùi được** và là thứ nguy hiểm nhất ở đây — sẽ không bao giờ được
 * chạy tới. Một bộ E2E xanh mà chưa từng bấm nút nguy hiểm nhất là một bộ E2E
 * nói dối.
 *
 * Mỗi viewport dùng **một tháng riêng**: bản chốt trùng được nhận diện theo
 * (loại · phạm vi · kỳ), nên ba viewport dùng chung một kỳ sẽ khiến bài "chưa
 * có bản trùng" của lượt thứ hai xanh/đỏ tuỳ thứ tự chạy — đúng loại xanh giả
 * mà M10-C đã vấp.
 *
 * Cần DB local đã `npm run db:reset && npm run seed:dev`.
 */
const DEV_PASSWORD = "123456";
/** Thư ký — `app.can_global_write()`, chốt được báo cáo ở mọi phạm vi. */
const SECRETARY = "GLV903";
/** Thủ quỹ — D-170: đọc được số gộp, không bao giờ chốt được. */
const TREASURER = "GLV904";
/** Trưởng ngành Ấu — phạm vi mặc định phải là ngành Ấu (AC-B07). */
const SECTOR_LEADER_AU = "GLV905";
/** Giáo lý viên lớp Ấu 1A — AC-B01, AC-B04. */
const CLASS_TEACHER_AU_1A = "GLV910";
/** Phụ huynh — AC-B02/B03. */
const GUARDIAN = "84912000001";

/** Tháng riêng cho từng viewport — xem ghi chú đầu file. */
const PROJECT_MONTH: Readonly<Record<string, number>> = {
  "mobile-360": 9,
  "tablet-768": 10,
  "laptop-1366": 11,
};

let adminClient: SupabaseClient<Database> | null = null;

function getLocalAdmin() {
  if (adminClient) return adminClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || !/^https?:\/\/(127\.0\.0\.1|localhost)(:|$)/.test(url)) {
    throw new Error("E2E M11 chỉ được chạy với Supabase local và service role key.");
  }
  adminClient = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return adminClient;
}

/**
 * 🔴 Vòng thử lại bọc **cả** lượt `goto`, không chỉ lượt điền biểu mẫu.
 *
 * Bản chép từ `notifications.spec.ts` đặt `page.goto("/login")` ở nhánh `catch`,
 * nên khi lượt điều hướng trước còn đang bay thì lượt goto mới bị huỷ với
 * `net::ERR_ABORTED; maybe frame was detached` và bài đỏ vì **hạ tầng đăng
 * nhập**, không vì thứ nó đang đo. Spec này đăng nhập ~15 lượt mỗi viewport với
 * sáu tài khoản khác nhau nên nó chạm vào cái bẫy ấy thường xuyên hơn hẳn các
 * spec khác — đúng chữ ký "nợ #15" đã ghi trong sổ.
 */
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
      return;
    } catch {
      await page.waitForTimeout(500);
    }
  }
  throw new Error(`Không đăng nhập được bằng ${username}. Đã chạy seed:dev chưa?`);
}

interface Fixture {
  yearId: string;
  classId: string;
  className: string;
  month: number;
  anchorDate: string;
  periodStart: string;
  periodEnd: string;
}

let fixture: Fixture | null = null;

/**
 * Một buổi Chúa nhật ĐÃ CHỐT của lớp Ấu 1A trong tháng riêng của viewport này.
 * Idempotent: ba project chạy cùng file nên `beforeAll` chạy ba lần trên cùng
 * một cơ sở dữ liệu.
 */
async function ensureFinalizedSession(projectName: string): Promise<Fixture> {
  const admin = getLocalAdmin();
  const month = PROJECT_MONTH[projectName] ?? 9;

  const { data: year } = await admin
    .from("academic_years").select("id").eq("status", "current").maybeSingle();
  if (!year) throw new Error("Chưa có năm học hiện hành — chạy seed:dev trước.");

  const { data: klass } = await admin
    .from("classes").select("id, display_name")
    .eq("academic_year_id", year.id).eq("display_name", "Ấu 1A").maybeSingle();
  if (!klass) throw new Error("Không tìm thấy lớp Ấu 1A trong seed:dev.");

  // Chúa nhật đầu tiên của tháng — `attendance_sessions_meeting_day` bắt
  // `meeting_type = 'sunday'` phải rơi đúng isodow 7.
  const first = new Date(Date.UTC(2026, month - 1, 1));
  const sunday = new Date(first);
  sunday.setUTCDate(1 + ((7 - first.getUTCDay()) % 7));
  const attendanceDate = sunday.toISOString().slice(0, 10);
  const lastDay = new Date(Date.UTC(2026, month, 0)).toISOString().slice(0, 10);

  const { data: existing } = await admin
    .from("attendance_sessions").select("id")
    .eq("class_id", klass.id).eq("attendance_date", attendanceDate)
    .eq("meeting_type", "sunday").maybeSingle();

  if (!existing) {
    const { data: secretary } = await admin
      .from("profiles").select("id").eq("username", SECRETARY).maybeSingle();
    if (!secretary) throw new Error(`Không tìm thấy tài khoản ${SECRETARY} — chạy seed:dev trước.`);
    const { data: session, error } = await admin
      .from("attendance_sessions")
      .insert({
        class_id: klass.id,
        academic_year_id: year.id,
        attendance_date: attendanceDate,
        meeting_type: "sunday",
        status: "completed",
        finalized_at: new Date().toISOString(),
        finalized_by: secretary.id,
      })
      .select("id").single();
    if (error) throw new Error(`Dựng buổi điểm danh: ${error.message}`);

    const { data: enrollments } = await admin
      .from("enrollments").select("id, student_id")
      .eq("class_id", klass.id).eq("academic_year_id", year.id).eq("status", "active");
    if (!enrollments || enrollments.length === 0) {
      throw new Error("Lớp Ấu 1A không có ghi danh nào — seed:dev chưa chạy đủ.");
    }
    const { error: recordError } = await admin.from("student_attendance_records").insert(
      enrollments.map((enrollment, index) => ({
        attendance_session_id: session.id,
        enrollment_id: enrollment.id,
        class_id: klass.id,
        student_id: enrollment.student_id,
        session_finalized_at: new Date().toISOString(),
        mass_status: index === 0 ? ("present" as const) : ("unexcused_absence" as const),
        catechism_status: "present" as const,
      })),
    );
    if (recordError) throw new Error(`Dựng bản ghi điểm danh: ${recordError.message}`);
  }

  return {
    yearId: year.id,
    classId: klass.id,
    className: klass.display_name,
    month,
    anchorDate: `2026-${String(month).padStart(2, "0")}-15`,
    periodStart: `2026-${String(month).padStart(2, "0")}-01`,
    periodEnd: lastDay,
  };
}

/** Số bản chốt đúng bộ (loại · phạm vi · kỳ) của viewport này — đọc THẲNG cơ sở dữ liệu. */
async function snapshotCount(current: Fixture): Promise<number> {
  const { count } = await getLocalAdmin()
    .from("report_snapshots")
    .select("id", { count: "exact", head: true })
    .eq("report_type", "attendance")
    .eq("scope_type", "class")
    .eq("scope_id", current.classId)
    .eq("period_start", current.periodStart)
    .eq("period_end", current.periodEnd);
  return count ?? 0;
}

/**
 * 🔴 Vỏ ứng dụng có **hai** thanh điều hướng (dọc + dưới đáy) và cả hai đều
 * chứa chữ "Lớp", "Thiếu nhi", "Con của tôi". Định vị bằng `getByText` trần thì
 * một bài đo ô KPI có thể xanh vì trúng một mục menu — đúng loại xanh giả mà
 * M10-C đã ghi vào sổ. Mọi phép đo KPI đi qua đúng vùng `Chỉ số năm học`.
 */
function kpiSection(page: Page) {
  return page.getByLabel("Chỉ số năm học");
}

function kpiTile(page: Page, label: string) {
  return kpiSection(page).getByText(label, { exact: true }).locator("xpath=..");
}

/** Dòng "Đang xem: …" — vùng `aria-live` của AC-B15, không phải mọi vùng aria-live. */
function summaryLine(page: Page) {
  return page.locator("p[aria-live='polite']");
}

function reportsUrl(current: Fixture): string {
  return `/reports?reportType=attendance&periodType=month&anchorDate=${current.anchorDate}`
    + `&scopeType=class&scopeId=${current.classId}`;
}

/**
 * 30 giây mặc định là quá sát cho spec này: nó vừa dựng dữ liệu qua service
 * role, vừa đăng nhập lại ở gần như mọi bài (sáu tài khoản khác nhau), trên một
 * máy đang chạy Docker + `next start` cùng lúc. Đây **không** phải cách chữa
 * một bài chậm bất thường — nó là thừa nhận đúng khối lượng thật của spec.
 */
test.describe.configure({ timeout: 60_000 });

test.beforeAll(async ({}, testInfo) => {
  fixture = await ensureFinalizedSession(testInfo.project.name);
});

test.describe("M11 · /reports — phạm vi nói đúng sự thật", () => {
  test("AC-B07 — Trưởng ngành mở trang trần thì thấy ngay NGÀNH MÌNH, không phải toàn xứ đoàn", async ({ page }) => {
    await login(page, SECTOR_LEADER_AU);
    await page.goto("/reports");

    // Bản trước 2026-08-11 mặc định `global` cho mọi người, nên trạng thái mặc
    // định của Trưởng ngành luôn là trạng thái sẽ bị cơ sở dữ liệu từ chối.
    await expect(page.getByLabel("Phạm vi")).toHaveValue("sector");
    await expect(summaryLine(page)).toContainText("Ngành Ấu");
  });

  test("AC-B08 — đổi sang toàn xứ đoàn thì nút Chốt vô hiệu KÈM LÝ DO, không biến mất", async ({ page }) => {
    await login(page, SECTOR_LEADER_AU);
    await page.goto("/reports?scopeType=global");

    const button = page.getByRole("button", { name: "Chốt báo cáo" });
    await expect(button).toBeVisible();
    await expect(button).toBeDisabled();
    await expect(page.getByText("Bạn chỉ chốt được báo cáo trong phạm vi lớp hoặc ngành mình phụ trách."))
      .toBeVisible();
  });

  test("🔴 AC-B04 — 'ngoài phạm vi' ra một câu KHÁC HẲN 'chưa có dữ liệu'", async ({ page }) => {
    const current = fixture!;
    const admin = getLocalAdmin();
    const { data: other } = await admin
      .from("classes").select("id").eq("academic_year_id", current.yearId)
      .eq("display_name", "Thiếu 1A").maybeSingle();
    test.skip(!other, "seed:dev không có lớp Thiếu 1A");

    await login(page, CLASS_TEACHER_AU_1A);
    await page.goto(`/reports?scopeType=class&scopeId=${other!.id}`);

    await expect(page.getByText("Phạm vi này nằm ngoài phần bạn phụ trách")).toBeVisible();
  });

  test("AC-B01 — ô 'Lớp' của trang tổng quan đếm đúng phạm vi Giáo lý viên lớp", async ({ page }) => {
    await login(page, CLASS_TEACHER_AU_1A);
    await page.goto("/dashboard");

    await expect(kpiTile(page, "Lớp")).toContainText("1");
  });
});

test.describe("M11 · D-171 — báo cáo Kết quả học tập luôn là cả năm học", () => {
  test("🔴 AC-B14 — ô chọn kỳ biến mất và trang NÓI RA vì sao", async ({ page }) => {
    await login(page, SECRETARY);
    await page.goto("/reports?reportType=results");

    await expect(page.getByLabel("Kỳ báo cáo")).toHaveCount(0);
    await expect(page.getByText("Báo cáo Kết quả học tập luôn tính cho cả năm học.")).toBeVisible();
    await expect(page.getByLabel("Ngày trong kỳ")).toHaveCount(0);
  });

  test("kỳ trên URL bị ép về năm học, và khoảng ngày đi theo", async ({ page }) => {
    await login(page, SECRETARY);
    await page.goto("/reports?reportType=results&periodType=month&anchorDate=2026-10-05");

    // Dòng tóm tắt là nơi duy nhất nói ra kỳ thật đang được dùng.
    await expect(summaryLine(page)).toContainText("Năm học");
  });
});

test.describe("M11 · D-170 — Thủ quỹ đọc được số gộp, không chốt được", () => {
  test("🔴 AC-B13 — Thủ quỹ mở /reports THẤY SỐ, không còn bảng trống", async ({ page }) => {
    const current = fixture!;
    await login(page, TREASURER);
    await page.goto(reportsUrl(current));

    // Trước D-170: cơ sở dữ liệu chặn sạch nên bảng trống hoàn toàn, dù giao
    // diện vẫn mời họ vào trang.
    await expect(page.getByRole("cell", { name: current.className })).toBeVisible();
    await expect(summaryLine(page)).toContainText("1 dòng");
  });

  test("🔴 và KHÔNG thấy nút 'Chốt báo cáo' ở bất kỳ phạm vi nào (D-19 vẫn đứng)", async ({ page }) => {
    const current = fixture!;
    await login(page, TREASURER);
    await page.goto(reportsUrl(current));
    await expect(page.getByRole("button", { name: "Chốt báo cáo" })).toHaveCount(0);

    await page.goto("/reports?scopeType=global");
    await expect(page.getByRole("button", { name: "Chốt báo cáo" })).toHaveCount(0);
  });

  test("Thủ quỹ mở trang tổng quan thấy số thật, không phải một dãy số 0", async ({ page }) => {
    await login(page, TREASURER);
    await page.goto("/dashboard");

    // Trước D-170, cả bốn ô là 0 — "0 thiếu nhi" không phải "chưa biết", đó là
    // một câu sai nói với một chức việc cấp xứ đoàn.
    await expect(kpiTile(page, "Thiếu nhi")).not.toContainText(/Thiếu nhi\s*0/);
    await expect(page.getByText(/danh sách tên từng em thuộc quyền của Ban điều hành/)).toBeVisible();
  });
});

test.describe("M11 · D-172 / AC-B09 — hộp xác nhận trước một thao tác không lùi được", () => {
  test("🔴 huỷ hộp xác nhận thì KHÔNG có bản chốt nào được tạo — đo thẳng cơ sở dữ liệu", async ({ page }) => {
    const current = fixture!;
    const before = await snapshotCount(current);

    await login(page, SECRETARY);
    await page.goto(reportsUrl(current));
    await expect(page.getByRole("cell", { name: current.className })).toBeVisible();

    await page.getByRole("button", { name: "Chốt báo cáo" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(`Lớp ${current.className}`);
    await expect(dialog).toContainText("Bản chốt không sửa và không xoá được.");

    await dialog.getByRole("button", { name: "Huỷ" }).click();
    await expect(dialog).toHaveCount(0);
    expect(await snapshotCount(current)).toBe(before);
  });

  test("🔴 xác nhận thì chốt thật, và lần sau hộp NÊU RA bản trùng kèm tên người chốt", async ({ page }) => {
    const current = fixture!;
    await login(page, SECRETARY);
    await page.goto(reportsUrl(current));
    await expect(page.getByRole("cell", { name: current.className })).toBeVisible();

    const before = await snapshotCount(current);
    await page.getByRole("button", { name: "Chốt báo cáo" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    if (before === 0) {
      await expect(dialog).not.toContainText("bản chốt trùng");
    }
    await dialog.getByRole("button", { name: "Chốt báo cáo" }).click();

    await expect(page.getByText("Đã chốt báo cáo.", { exact: false })).toBeVisible();
    // Đo bằng cơ sở dữ liệu chứ không bằng câu chữ trên màn hình: M10-C đã có
    // một bài xanh trong khi lệnh vẫn đang bay.
    await expect.poll(async () => snapshotCount(current), { timeout: 10_000 })
      .toBe(before + 1);

    await page.goto(reportsUrl(current));
    await page.getByRole("button", { name: "Chốt báo cáo" }).click();
    const second = page.getByRole("dialog");
    await expect(second).toContainText("bản chốt trùng");
    await expect(second).toContainText("Nguyễn Thư Ký");
    await expect(second).toContainText("không thay thế bản cũ");
  });
});

test.describe("M11 · TB-06 — kho bản chốt khai thác được", () => {
  test("🔴 AC-B10 — mỗi dòng nói ra PHẠM VI và NGƯỜI CHỐT", async ({ page }) => {
    const current = fixture!;
    await login(page, SECRETARY);
    await page.goto("/reports/snapshots");

    await expect(page.getByRole("heading", { name: "Báo cáo đã chốt" })).toBeVisible();
    const row = page.getByRole("row").filter({ hasText: `Lớp ${current.className}` }).first();
    await expect(row).toBeVisible();
    await expect(row).toContainText("Nguyễn Thư Ký");
  });

  test("AC-B11 — lọc theo loại báo cáo trả đúng tập kết quả", async ({ page }) => {
    await login(page, SECRETARY);
    await page.goto("/reports/snapshots?reportType=results");

    // Bộ E2E này chỉ chốt báo cáo Chuyên cần, nên lọc Kết quả phải ra rỗng —
    // và rỗng ở đây phải là một trạng thái rỗng CHUẨN có lối thoát, không phải
    // một dòng chữ xám.
    await expect(page.getByText("Không có bản chốt nào khớp bộ lọc")).toBeVisible();
    await expect(page.getByRole("link", { name: "Về trang Báo cáo" }).first()).toBeVisible();
  });

  test("🔴 AC-B12 — xem lại bản chốt trên trình duyệt, có băng-rôn bất biến và checksum đầy đủ", async ({ page }) => {
    const current = fixture!;
    await login(page, SECRETARY);
    await page.goto("/reports/snapshots");

    // Lấy `href` rồi mở, thay vì `click()` + `waitForURL`: cột thao tác nằm
    // trong vùng cuộn ngang của bảng, nên trên viewport hẹp cái nút có thể nằm
    // ngoài khung nhìn và cú bấm rơi vào hư không — một bài đỏ vì lý do không
    // liên quan gì tới thứ nó đang đo (nợ #10/#15 đã ghi đúng hình dạng này).
    const viewHref = await page.getByRole("row")
      .filter({ hasText: `Lớp ${current.className}` }).first()
      .getByRole("link", { name: "Xem" }).getAttribute("href");
    expect(viewHref).toMatch(/^\/reports\/snapshots\/[0-9a-f-]{36}$/);
    await page.goto(viewHref!);

    await expect(page.getByText(/số liệu không đổi kể cả khi dữ liệu nguồn thay đổi/)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Mã kiểm tra" })).toBeVisible();
    await expect(page.getByRole("cell", { name: current.className })).toBeVisible();
  });

  test("AC-A10 — id không phải UUID trả 404 JSON ở route tải file, không phải 500", async ({ page }) => {
    await login(page, SECRETARY);
    const response = await page.goto("/reports/snapshots/khong-phai-uuid/export?format=xlsx");
    expect(response?.status()).toBe(404);
  });

  test("id không phải UUID ở trang xem lại rơi vào màn hình 'không tìm thấy' TRUNG TÍNH", async ({ page }) => {
    await login(page, SECRETARY);
    await page.goto("/reports/snapshots/khong-phai-uuid");

    // Câu chữ không được xác nhận bản chốt ấy có tồn tại hay không (AC-A07).
    await expect(page.getByRole("heading", { name: "Không tìm thấy trang" })).toBeVisible();
  });
});

test.describe("M11 · TB-03 — cổng phụ huynh hết ngõ cụt", () => {
  test("🔴 AC-B02 — không liên kết nào trên trang tổng quan của phụ huynh dẫn tới trang họ không vào được", async ({ page }) => {
    await login(page, GUARDIAN);
    await page.goto("/dashboard");

    const hrefs = await page.locator("main a[href]").evaluateAll(
      (nodes) => nodes.map((node) => node.getAttribute("href") ?? ""),
    );
    expect(hrefs.filter((href) => href.startsWith("/students") || href.startsWith("/reports")))
      .toEqual([]);
  });

  test("AC-B03 — nhãn KPI mang đúng nghĩa của phụ huynh", async ({ page }) => {
    await login(page, GUARDIAN);
    await page.goto("/dashboard");

    await expect(kpiTile(page, "Con của tôi")).toBeVisible();
    await expect(kpiTile(page, "Tỷ lệ dự lễ của con")).toBeVisible();
    await expect(kpiSection(page).getByText("Giáo lý viên", { exact: true })).toHaveCount(0);
  });
});
