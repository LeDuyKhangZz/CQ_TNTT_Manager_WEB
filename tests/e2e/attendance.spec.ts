import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect, test, type Locator, type Page } from "@playwright/test";
import type { Database } from "../../src/types/database";

/**
 * Phase 3 — luồng điểm danh bấm nút thật, không phải gọi RPC trực tiếp.
 *
 * Cần DB đã `npm run db:reset && npm run seed:dev`. GLV909 là đại diện lớp
 * Ấu 1A; 84912000001 là phụ huynh có con Nguyễn Minh An trong chính lớp đó.
 *
 * **Ba viewport chạy song song trên cùng một database**, và bộ này GHI dữ liệu.
 * Nên mỗi lần chạy, mỗi viewport phải nhận một ngày sinh hoạt riêng — nếu dùng
 * chung một ngày thì chúng tranh nhau một session và trượt ngẫu nhiên. Ngày lấy
 * từ mốc thời gian chạy nên chạy lại nhiều lần cũng không đụng dữ liệu cũ.
 */
const DEV_PASSWORD = "123456";

/** D-75: câu này phải hiện với Giáo lý viên và KHÔNG hiện với phụ huynh. */
const NOTE_TEXT = "Đi lễ xong về sớm";

let adminClient: SupabaseClient<Database> | null = null;

/**
 * Service role chỉ dùng để đưa đồng hồ DB về đúng trạng thái cần kiểm thử.
 * Mọi hành động cần chứng minh vẫn được bấm bằng hai phiên đăng nhập thật.
 */
function getLocalAdmin() {
  if (adminClient) return adminClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("E2E concurrency cần NEXT_PUBLIC_SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY.");
  }
  if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:|$)/.test(url)) {
    throw new Error(`E2E có ghi thời gian session nên chỉ được chạy trên Supabase local: ${url}`);
  }
  adminClient = createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return adminClient;
}

const PROJECT_OFFSET: Record<string, number> = {
  "mobile-360": 0,
  "tablet-768": 1,
  "laptop-1366": 2,
};

/**
 * Một Chúa nhật trong tương lai, riêng cho mỗi viewport và mỗi lần chạy.
 *
 * Hai ràng buộc thật, không phải cho đẹp:
 * 1. **Không dưới 20 tuần.** Phân công giáo lý viên của fixture bắt đầu từ đầu
 *    năm học; buổi đặt trước mốc đó thì không có GLV nào để điểm danh — đúng
 *    theo `app.seed_attendance_roster`, và test sẽ tưởng nhầm là hỏng.
 * 2. **Mỗi viewport một dải 120 tuần riêng, cộng một điểm ngẫu nhiên.** Ba
 *    viewport chạy song song trên cùng DB và bộ này ghi dữ liệu; trùng ngày là
 *    trùng buổi. Ngẫu nhiên để chạy lại nhiều lần không đụng dữ liệu lần trước.
 */
function uniqueSunday(projectName: string, extraWeeks = 0): string {
  const weeksAhead =
    20 + (PROJECT_OFFSET[projectName] ?? 0) * 120 + Math.floor(Math.random() * 100) + extraWeeks;
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + ((7 - date.getDay()) % 7 || 7) + weeksAhead * 7);
  return date.toISOString().slice(0, 10);
}

/**
 * M05-B/TB-06 — mỗi viewport một cặp (phụ huynh, buổi) riêng.
 *
 * Thẻ "Đơn xin nghỉ tuần này" chỉ nhìn ±7 ngày, tức chỉ có **một** thứ Năm và
 * **một** Chúa nhật phía trước để dùng. Ba lượt song song mà chung một cặp thì
 * đụng chỉ mục `absence_requests_one_open_per_meeting_idx`. Cả hai phụ huynh
 * dưới đây đều có con trong Ấu 1A — lớp của GLV909 (`seed-dev.mjs`).
 */
const REVIEW_SLOTS: Record<string, { parent: string; meeting: "sunday" | "thursday" }> = {
  "mobile-360": { parent: "84912000001", meeting: "sunday" },
  "tablet-768": { parent: "84912000002", meeting: "sunday" },
  "laptop-1366": { parent: "84912000001", meeting: "thursday" },
};

/** Lần sinh hoạt kế tiếp của một loại buổi — luôn nằm trong cửa sổ ±7 ngày. */
function nextMeetingDate(meeting: "sunday" | "thursday"): string {
  const target = meeting === "sunday" ? 0 : 4;
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + (((target - date.getDay() + 7) % 7) || 7));
  return date.toISOString().slice(0, 10);
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

/**
 * 🔴 Chấp nhận cả chuỗi truy vấn phía sau — M05-A/TB-08.
 *
 * Người mở buổi mà **không** giành được quyền sửa nay được đưa tới
 * `/attendance/<id>?notice=…` để trang nói ngay ai đang phụ trách. Biểu thức cũ
 * neo bằng `$` ngay sau id, nên với đúng ca ấy nó kết luận "chưa tới nơi" và
 * `clickUntil` bấm lại tới khi hết giờ — bài test đỏ trong khi ứng dụng đúng.
 */
const SESSION_URL_PATTERN = /\/attendance\/[0-9a-f-]{36}(\?|$)/;

async function openAttendanceSession(page: Page, meetingDate: string): Promise<string> {
  await page.goto("/attendance");
  await page.getByLabel('Ngày', { exact: true }).fill(meetingDate);
  await page.locator('select[name="meetingType"]').selectOption("sunday");
  await clickUntil(
    "Mở buổi",
    async () => {
      await page.getByRole("button", { name: "Mở buổi" }).click();
    },
    async () => SESSION_URL_PATTERN.test(page.url()),
  );
  return page.url();
}

function sessionIdFromUrl(sessionUrl: string): string {
  const sessionId = new URL(sessionUrl).pathname.split("/").pop();
  if (!sessionId || !/^[0-9a-f-]{36}$/.test(sessionId)) {
    throw new Error(`URL buổi điểm danh không hợp lệ: ${sessionUrl}`);
  }
  return sessionId;
}

async function expireLease(sessionId: string) {
  const { error } = await getLocalAdmin()
    .from("attendance_sessions")
    .update({ last_activity_at: new Date(Date.now() - 60 * 60_000).toISOString() })
    .eq("id", sessionId);
  if (error) throw new Error(`Không đẩy lease về quá khứ: ${error.message}`);
}

async function lockFinalizedSession(sessionId: string) {
  const { error } = await getLocalAdmin()
    .from("attendance_sessions")
    .update({ locked_at: new Date(Date.now() - 60_000).toISOString() })
    .eq("id", sessionId);
  if (error) throw new Error(`Không đưa buổi về trạng thái đã khóa: ${error.message}`);
}

/**
 * Bấm cho tới khi thấy kết quả. Cùng lý do với vòng lặp trong `login`: nút của
 * trang này chạy qua Server Action hoặc `useTransition`, bấm trước khi React
 * hydrate xong thì cú bấm rơi vào hư không và trang đứng yên. Kiểm tra điều
 * kiện TRƯỚC mỗi lần bấm nên bấm lại không tạo bản ghi trùng.
 */
async function clickUntil(
  what: string,
  click: () => Promise<void>,
  done: () => Promise<boolean>,
) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (await done()) return;
    await click();
    // ⚠️ 24 nhịp = 12 giây mỗi lượt, tổng ~48 giây — nới từ 6 giây ở M05-C.
    //
    // Đây là **che triệu chứng, không phải chữa** (nợ #10), và con số có căn cứ
    // đo được chứ không phải đoán: ở lượt chạy đầy đủ của đợt này, bài TB-06
    // chạy **16,5 giây** trên `laptop-1366` mà vẫn xanh, trong khi `tablet-768`
    // đỏ vì hết 6 giây × 4 lượt. Cùng bản mã, chạy cô lập thì 3/3 xanh trong
    // 6–8 giây. Biến số chi phối là **tải máy**, đúng kết luận M02-C/M04-A đã
    // ghi. M03-C đã nới ba khẳng định của `enrollment-lifecycle` lên 45 giây vì
    // cùng lý do; mốc ở đây đặt cùng cỡ.
    for (let waited = 0; waited < 24; waited += 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (await done()) return;
    }
  }
  throw new Error(`${what}: bấm nhiều lần vẫn không có hiệu lực.`);
}

/**
 * Bấm một nút **chỉ khi nó đang mở** — M05-C, sửa một cú treo cứng của bộ test.
 *
 * 🔴 Mọi nút chạy qua Server Action ở module này đều `disabled={pending}` trong
 * lúc chờ trả lời. Lượt thử lại của `clickUntil` mà bấm thẳng vào nút đang khoá
 * thì Playwright **đợi nó mở ra** cho tới khi hết giờ cả bài — 120 giây chết
 * cứng, thay cho một vòng thăm dò. Đo được ở lượt chạy đầy đủ của đợt này: hai
 * viewport hết giờ ở đúng chỗ ấy trong bài TB-06, còn chạy cô lập cùng bản mã
 * thì 3/3 xanh trong 6–8 giây (nợ #10 — vòng trả lời của Server Action thỉnh
 * thoảng không về trên máy này).
 *
 * Đây **không** phải chữa nợ #10: thao tác vẫn có thể treo. Nó chỉ làm cho
 * thông điệp thất bại nói đúng sự thật ("bấm nhiều lần vẫn không có hiệu lực")
 * thay vì một dòng hết giờ trỏ vào cú bấm thứ hai.
 */
async function clickIfEnabled(button: Locator): Promise<void> {
  if ((await button.count()) === 0) return;
  if (await button.isDisabled()) return;
  await button.click();
}

/* ==========================================================================
   M05-C — danh sách điểm danh đổi hình: hàng gấp lại (D-143), trạng thái là
   HÀNG NÚT chứ không còn ô chọn (D-142), và chốt đi qua hộp xác nhận (TB-03).

   `07_IMPLEMENTATION_IMPACT` §2.6 gọi việc đổi 5 bộ định vị `select[aria-label]`
   là "chi phí ẩn lớn nhất của U-10" và đề nghị tách hai đợt. Gộp một đợt được
   vì bộ định vị mới neo vào **thuộc tính do component đặt** và vào **vai trò
   ARIA**, không neo vào tên thẻ HTML — lần đổi giao diện sau không gãy nữa.
   ========================================================================== */

/** Nhãn NGẮN trên nút (D-142) — dùng để bấm. */
const STATUS_BUTTON_LABEL: Record<string, string> = {
  present: "Có mặt",
  late: "Đi trễ",
  left_early: "Về sớm",
  excused_absence: "Có phép",
  unexcused_absence: "Không phép",
};

/** Câu đầy đủ — dùng để KHẲNG ĐỊNH, vì nó là `aria-label` của ô radio. */
const STATUS_ARIA_LABEL: Record<string, string> = {
  present: "Có mặt",
  late: "Đi trễ",
  left_early: "Về sớm",
  excused_absence: "Vắng có phép",
  unexcused_absence: "Vắng không phép",
};

function studentRows(page: Page): Locator {
  return page.locator("[data-roster-row]");
}

/** Mở hàng của một em ra (D-143) và trả về tên em đó. */
async function expandStudentRow(row: Locator): Promise<string> {
  await expect(row).toBeVisible();
  const label = (await row.getAttribute("data-student-label")) ?? "";
  const toggle = row.locator("[data-roster-toggle]");
  if ((await toggle.getAttribute("aria-expanded")) !== "true") {
    await clickUntil(
      `Mở hàng của ${label}`,
      async () => {
        await toggle.click();
      },
      async () => (await toggle.getAttribute("aria-expanded")) === "true",
    );
  }
  return label;
}

async function expandFirstStudentRow(page: Page): Promise<string> {
  return expandStudentRow(studentRows(page).first());
}

/** Hàng nút của một cột — `<fieldset>` + `<legend>` cho ra role "group". */
function statusGroup(page: Page, label: string, column: "Thánh lễ" | "Giáo lý"): Locator {
  return page.getByRole("group", { name: `${column} của ${label}`, exact: true });
}

async function setStudentStatus(
  page: Page,
  label: string,
  column: "Thánh lễ" | "Giáo lý",
  status: keyof typeof STATUS_BUTTON_LABEL,
) {
  const row = page.locator(`[data-roster-row][data-student-label="${label}"]`);
  // D-142: "Đi trễ" và "Về sớm" nằm sau nút "…".
  if (status === "late" || status === "left_early") {
    const more = row.getByRole("button", { name: "… Thêm Đi trễ, Về sớm" });
    if ((await more.count()) > 0) await more.click();
  }
  const group = statusGroup(page, label, column);
  await clickUntil(
    `Đặt ${column} của ${label} = ${STATUS_ARIA_LABEL[status]}`,
    async () => {
      // Bấm vào `<label>` đúng như người dùng chạm; ô radio là `sr-only`.
      await group.getByText(STATUS_BUTTON_LABEL[status], { exact: true }).click();
    },
    async () => group.getByRole("radio", { name: STATUS_ARIA_LABEL[status] }).isChecked(),
  );
}

async function expectStudentStatus(
  page: Page,
  label: string,
  column: "Thánh lễ" | "Giáo lý",
  status: keyof typeof STATUS_ARIA_LABEL,
) {
  await expect(
    statusGroup(page, label, column).getByRole("radio", { name: STATUS_ARIA_LABEL[status] }),
  ).toBeChecked();
}

/**
 * TB-03 — chốt nay là **hai** cú bấm: mở hộp xác nhận rồi xác nhận.
 *
 * Cố ý tăng một bước: chốt đặt mốc khóa 3 ngày và sau đó chỉ Quản trị viên hệ
 * thống mở lại được. Vòng thử lại giữ nguyên lý do cũ (hydrate chưa xong), chỉ
 * thêm việc phân biệt "hộp thoại đã mở chưa" để không bấm nhầm vào hư không.
 */
async function finalizeSession(page: Page, isRefinalize = false) {
  const trigger = isRefinalize ? "Chốt lại" : "Hoàn tất điểm danh";
  const confirm = isRefinalize ? "Chốt lại buổi" : "Chốt buổi điểm danh";
  const done = async () =>
    (await page.getByText("Đã chốt buổi điểm danh.").count()) > 0
    || (await page.getByRole("button", { name: trigger, exact: true }).count()) === 0;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (await done()) return;
    if ((await page.getByRole("dialog").count()) === 0) {
      await clickIfEnabled(page.getByRole("button", { name: trigger, exact: true }));
      await page
        .getByRole("dialog")
        .waitFor({ state: "visible", timeout: 10_000 })
        .catch(() => undefined);
    }
    if ((await page.getByRole("dialog").count()) > 0) {
      await clickIfEnabled(page.getByRole("button", { name: confirm, exact: true }));
    }
    for (let waited = 0; waited < 16; waited += 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (await done()) return;
    }
  }
  throw new Error("Chốt buổi điểm danh: bấm nhiều lần vẫn không có hiệu lực.");
}

test.describe("Điểm danh Phase 3", () => {
  // Bộ này ghi dữ liệu qua nhiều bước và có vòng bấm-lại chờ hydrate, nên cần
  // nhiều hơn mốc 30 giây mặc định của các bài chỉ đọc. M05-C nâng 120 → 180
  // giây cho vừa cửa sổ chờ mới của `clickUntil` (xem ghi chú ở đó): bài TB-06
  // đi ba lượt đăng nhập và hai thao tác ghi, nên riêng nó đã sát trần cũ.
  test.describe.configure({ timeout: 180_000 });

  test("GLV lớp mở buổi, sửa ngoại lệ rồi chốt; phụ huynh đọc được bản đã chốt", async ({
    page,
  }, testInfo) => {
    const meetingDate = uniqueSunday(testInfo.project.name);
    await login(page, "GLV909");

    // ── Mở buổi ────────────────────────────────────────────────────────────
    await page.goto("/attendance");
    await expect(page.getByRole("heading", { name: "Mở buổi điểm danh" })).toBeVisible();
    await expectNoHorizontalOverflow(page, "/attendance");

    await page.getByLabel('Ngày', { exact: true }).fill(meetingDate);
    await page.locator('select[name="meetingType"]').selectOption("sunday");
    await clickUntil(
      "Mở buổi",
      async () => {
        await page.getByRole("button", { name: "Mở buổi" }).click();
      },
      async () => SESSION_URL_PATTERN.test(page.url()),
    );
    const sessionUrl = page.url();

    // Roster được nạp sẵn từ ghi danh.
    expect(await studentRows(page).count()).toBeGreaterThan(0);
    await expectNoHorizontalOverflow(page, "trang buổi điểm danh");

    // ── Hai trạng thái độc lập (D-30): đi lễ nhưng vắng giáo lý ────────────
    // Đặt tường minh cả hai thay vì tin vào giá trị sẵn có: bài này ghi dữ
    // liệu nên chạy lại có thể gặp buổi đã được sửa từ lần trước. Bản thân
    // luật "mặc định present" đã được pgTAP 012 chứng minh ở tầng DB.
    const student = await expandFirstStudentRow(page);
    await setStudentStatus(page, student, "Thánh lễ", "present");
    await setStudentStatus(page, student, "Giáo lý", "unexcused_absence");

    // Ô ghi chú chỉ hiện khi có ngoại lệ, đúng tinh thần "chỉ sửa ngoại lệ".
    // M05-B/D-75: nhãn ô nay nói thẳng đây là ghi chú nội bộ.
    const noteInput = page.locator('input[aria-label^="Ghi chú nội bộ của"]').first();
    await expect(noteInput).toBeVisible();
    await noteInput.fill(NOTE_TEXT);

    // ── Điểm danh GLV trong cùng buổi (D-35) ───────────────────────────────
    const staffGroup = page.getByRole("group", { name: /^Điểm danh / }).first();
    await staffGroup.getByText("Vắng có phép", { exact: true }).click();

    // ── Lưu nháp rồi chốt ──────────────────────────────────────────────────
    await clickUntil(
      "Lưu nháp",
      async () => {
        await clickIfEnabled(page.getByRole("button", { name: "Lưu nháp" }));
      },
      async () => (await page.getByText("Đã lưu nháp.").count()) > 0,
    );

    // TB-03: chốt xong thì RPC nhả quyền chỉnh sửa, nên nút biến mất — đó là
    // tín hiệu từ server. Chỉ trông vào thông báo phía client là không chắc:
    // `router.refresh()` render lại và trang chuyển sang chế độ chỉ xem.
    await finalizeSession(page);

    // Tải lại: giá trị đã lưu vẫn còn và buổi đã ở trạng thái chốt.
    await page.goto(sessionUrl);
    await expect(page.getByText("Đã chốt").first()).toBeVisible();
    await expandStudentRow(page.locator(`[data-roster-row][data-student-label="${student}"]`));
    await expectStudentStatus(page, student, "Giáo lý", "unexcused_absence");
    await expectStudentStatus(page, student, "Thánh lễ", "present");
    // 🔴 D-75, nửa thứ nhất: Giáo lý viên **vẫn** đọc được ghi chú — nhưng từ
    // M05-B nó không còn đi qua bảng mà qua `attendance_session_notes`. Nếu cửa
    // sổ hẹp hỏng thì ô này rỗng, và không có bài nào khác nhận ra.
    await expect(page.locator('input[aria-label^="Ghi chú nội bộ của"]').first()).toHaveValue(
      NOTE_TEXT,
    );

    // ── Phụ huynh thấy đúng bản đã chốt của con mình ───────────────────────
    await login(page, "84912000001");
    await page.goto("/parent/absence-requests");
    await expect(page.getByRole("heading", { name: "Gửi đơn mới" })).toBeVisible();
    await expectNoHorizontalOverflow(page, "/parent/absence-requests");

    // Con đầu danh sách là Nguyễn Minh An — chính em trong lớp vừa chốt.
    const childId = await page.locator('select[name="studentId"] option').first().getAttribute("value");
    expect(childId).toBeTruthy();
    await page.goto(`/parent/children/${childId}`);
    await expect(page.getByRole("heading", { name: "Chuyên cần" })).toBeVisible();
    await expect(page.getByText("Điểm Thánh lễ")).toBeVisible();
    await expect(page.getByText("Điểm Giáo lý")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Lịch sử từng buổi" })).toBeVisible();
    // 🔴 D-75, nửa thứ hai — và đây là bài canh đúng hiện trạng bị ghi đè:
    // trước M05-B trang này in thẳng cột `note`, nên câu ghi chú vừa gõ ở trên
    // hiện nguyên văn cho phụ huynh. Nay không, và cột ấy cũng không còn đọc
    // được ở tầng cơ sở dữ liệu (pgTAP `042`).
    await expect(page.getByText(NOTE_TEXT)).toHaveCount(0);
    await expectNoHorizontalOverflow(page, "/parent/children/[studentId]");
  });

  test("hai người dùng tranh chấp, tiếp quản và editor cũ không ghi đè", async ({
    browser,
    page: pageA,
  }, testInfo) => {
    const meetingDate = uniqueSunday(testInfo.project.name, 800);
    await login(pageA, "GLV909");
    const sessionUrl = await openAttendanceSession(pageA, meetingDate);
    const sessionId = sessionIdFromUrl(sessionUrl);

    // Context B có cookie/session độc lập hoàn toàn với A.
    const contextB = await browser.newContext({ baseURL: new URL(pageA.url()).origin });
    const pageB = await contextB.newPage();
    try {
      await login(pageB, "GLV910");

      // B thử mở đúng buổi đang do A giữ. RPC claim trả về cùng session nhưng
      // không chuyển editor; UI B phải chỉ đọc và nêu rõ đang có người giữ.
      const sameSessionUrl = await openAttendanceSession(pageB, meetingDate);
      expect(sessionIdFromUrl(sameSessionUrl)).toBe(sessionId);
      await expect(pageB.getByText(/đang phụ trách buổi này\. Bạn chỉ xem\./)).toBeVisible();
      await expect(pageB.getByRole("button", { name: "Lưu nháp" })).toHaveCount(0);
      await expect(pageB.getByRole("button", { name: "Tiếp quản" })).toHaveCount(0);

      // Giờ hết lease do DB quyết định. Sau khi B tiếp quản, B ghi một giá trị
      // thật để kiểm tra A không chỉ nhận lỗi mà còn thực sự không ghi đè.
      await expireLease(sessionId);
      await pageB.reload();
      await expect(pageB.getByRole("button", { name: "Tiếp quản" })).toBeVisible();
      await clickUntil(
        "Tiếp quản buổi",
        async () => {
          await pageB.getByRole("button", { name: "Tiếp quản" }).click();
        },
        async () => (await pageB.getByRole("button", { name: "Lưu nháp" }).count()) > 0,
      );

      const student = await expandFirstStudentRow(pageB);
      await setStudentStatus(pageB, student, "Giáo lý", "excused_absence");
      await clickUntil(
        "B lưu sau tiếp quản",
        async () => {
          await clickIfEnabled(pageB.getByRole("button", { name: "Lưu nháp" }));
        },
        async () => (await pageB.getByText("Đã lưu nháp.").count()) > 0,
      );

      // A vẫn đang giữ DOM cũ với control enabled. Cú lưu này phải đi tới
      // server, bị RPC từ chối bằng thông báo tiếng Việt và không đổi dữ liệu B.
      await expandStudentRow(pageA.locator(`[data-roster-row][data-student-label="${student}"]`));
      await setStudentStatus(pageA, student, "Giáo lý", "unexcused_absence");
      await pageA.getByRole("button", { name: "Lưu nháp" }).click();
      await expect(
        pageA.getByText("Buổi điểm danh đang có người khác phụ trách."),
      ).toBeVisible();

      await pageB.reload();
      await expandStudentRow(pageB.locator(`[data-roster-row][data-student-label="${student}"]`));
      await expectStudentStatus(pageB, student, "Giáo lý", "excused_absence");
    } finally {
      await contextB.close();
    }
  });

  test("editor đang mở trang vẫn bị chặn khi buổi vừa hết hạn khóa", async ({ page }, testInfo) => {
    const meetingDate = uniqueSunday(testInfo.project.name, 1_000);
    await login(page, "GLV909");
    const sessionUrl = await openAttendanceSession(page, meetingDate);
    const sessionId = sessionIdFromUrl(sessionUrl);

    await finalizeSession(page);

    // Nhận lại quyền sửa trong cửa sổ 3 ngày, rồi để trang này stale trong lúc
    // mốc khóa trôi qua. Đây là đường UI mà pgTAP không thể chứng minh.
    await page.reload();
    await clickUntil(
      "Nhận lại quyền sửa buổi đã chốt",
      async () => {
        await page.getByRole("button", { name: "Tiếp quản" }).click();
      },
      async () => (await page.getByRole("button", { name: "Lưu nháp" }).count()) > 0,
    );

    await lockFinalizedSession(sessionId);
    const student = await expandFirstStudentRow(page);
    // "Đi trễ" nằm sau nút "…" (D-142) — helper tự mở giúp.
    await setStudentStatus(page, student, "Thánh lễ", "late");
    await page.getByRole("button", { name: "Lưu nháp" }).click();
    await expect(page.getByText("Buổi điểm danh đã bị khóa.")).toBeVisible();

    await page.reload();
    await expect(page.getByText("Buổi này đã khóa. Chỉ Quản trị viên hệ thống mở khóa và sửa được."))
      .toBeVisible();
    await expandStudentRow(page.locator(`[data-roster-row][data-student-label="${student}"]`));
    // D-142: cả nhóm nút khoá bằng `<fieldset disabled>`, không rải `disabled`
    // xuống từng ô — thêm một lựa chọn mới về sau không thể quên khoá.
    await expect(
      statusGroup(page, student, "Thánh lễ").getByRole("radio", { name: "Có mặt" }),
    ).toBeDisabled();
    await expect(page.getByRole("button", { name: "Lưu nháp" })).toHaveCount(0);
  });

  test("phụ huynh gửi rồi hủy được đơn xin nghỉ", async ({ page }, testInfo) => {
    const absenceDate = uniqueSunday(testInfo.project.name, 400);
    const reason = `Gia đình về quê ${absenceDate}`;

    await login(page, "84912000001");
    await page.goto("/parent/absence-requests");

    const card = () => page.locator(`[data-absence-date="${absenceDate}"]`).first();

    await clickUntil(
      "Gửi đơn",
      async () => {
        await page.getByLabel("Ngày nghỉ").fill(absenceDate);
        await page.locator('input[name="reason"]').fill(reason);
        await page.getByRole("button", { name: "Gửi đơn" }).click();
      },
      async () => (await card().getByText("Đang chờ").count()) > 0,
    );

    await clickUntil(
      "Hủy đơn",
      async () => {
        await card().getByRole("button", { name: "Hủy đơn" }).click();
      },
      async () => (await card().getByText("Đã hủy").count()) > 0,
    );
  });

  test("phụ huynh không vào được trang điểm danh của giáo lý viên", async ({ page }) => {
    await login(page, "84912000001");
    await page.goto("/attendance");
    await expect(page).toHaveURL(/\/access-denied$/);
  });

  /* ========================================================================
     M05-A — bốn bài mới
     ======================================================================== */

  /**
   * E-09 / TB-02 — cùng một buổi phải mang cùng một nhãn ở hai màn hình.
   *
   * Trước đợt này, hub in thẳng cột `status` (không bao giờ mang giá trị
   * `locked`) còn trang chi tiết tự suy ra, nên một buổi đã quá mốc khóa hiện
   * **"Đã chốt"** ở danh sách và **"Đã khóa"** khi mở ra. Người dùng không có
   * cách nào biết mình còn sửa được hay không nếu chưa bấm vào.
   */
  test("TB-02: buổi đã khóa hiện CÙNG một nhãn ở danh sách và ở trang chi tiết", async ({
    page,
  }, testInfo) => {
    const meetingDate = uniqueSunday(testInfo.project.name, 1_400);
    await login(page, "GLV909");
    const sessionUrl = await openAttendanceSession(page, meetingDate);
    const sessionId = sessionIdFromUrl(sessionUrl);

    await finalizeSession(page);
    await lockFinalizedSession(sessionId);

    // Trang chi tiết.
    await page.goto(sessionUrl);
    await expect(page.getByText("Đã khóa").first()).toBeVisible();

    // Danh sách — chính chỗ từng nói dối.
    await page.goto("/attendance");
    const card = page.locator(`a[href="/attendance/${sessionId}"]`);
    await expect(card).toHaveCount(1);
    await expect(card.getByText("Đã khóa")).toBeVisible();
    await expect(card.getByText("Đã chốt")).toHaveCount(0);
  });

  /**
   * AC-F01-4 / TB-08 — mở một buổi người khác đang giữ thì phải được NÓI ngay.
   * Bản cũ `redirect` y hệt lúc nhận được quyền sửa và vứt cờ `claimed` mà RPC
   * đã trả về.
   */
  test("TB-08: mở buổi đang có người giữ thì thấy băng-rôn chỉ đọc ngay khi vào", async ({
    browser,
    page: pageA,
  }, testInfo) => {
    const meetingDate = uniqueSunday(testInfo.project.name, 1_600);
    await login(pageA, "GLV909");
    await openAttendanceSession(pageA, meetingDate);

    const contextB = await browser.newContext({ baseURL: new URL(pageA.url()).origin });
    const pageB = await contextB.newPage();
    try {
      await login(pageB, "GLV910");
      await openAttendanceSession(pageB, meetingDate);
      await expect(pageB.getByText(/đang phụ trách buổi này\. Bạn đang xem ở chế độ chỉ đọc\./))
        .toBeVisible();
      await expect(pageB.getByRole("button", { name: "Hoàn tất điểm danh" })).toHaveCount(0);
      await expect(pageB.getByRole("button", { name: "Lưu nháp" })).toHaveCount(0);
    } finally {
      await contextB.close();
    }
  });

  /**
   * D-139 — Cha sở XEM được, nhưng không có một đường ghi nào.
   * pgTAP `041` chứng minh phần cơ sở dữ liệu; bài này chứng minh phần màn hình.
   */
  test("D-139: Cha sở xem được điểm danh nhưng không mở/ghi được buổi nào", async ({ page }) => {
    await login(page, "ChaSo");
    await page.goto("/attendance");
    await expect(page).not.toHaveURL(/\/access-denied$/);
    // `level: 1` chứ không phải tên trần: "Mở buổi điểm danh" cũng là một heading.
    await expect(page.getByRole("heading", { level: 1, name: "Điểm danh" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Mở buổi" })).toHaveCount(0);
    await expect(page.getByText(/xem điểm danh ở chế độ chỉ đọc/)).toBeVisible();
    await expectNoHorizontalOverflow(page, "/attendance với Cha sở");

    // Thủ quỹ (GLV904) vẫn bị chặn — `docs/05` cho họ "👁 báo cáo", không phải
    // màn hình này, và cơ sở dữ liệu cũng không cho họ đọc (pgTAP 041).
    await login(page, "GLV904");
    await page.goto("/attendance");
    await expect(page).toHaveURL(/\/access-denied$/);
  });

  /**
   * Nợ #20 — mỗi module tự đo trang chi tiết của mình. `responsive.spec.ts`
   * chỉ quét 13 địa chỉ CẤP MỘT, nên link "← Danh sách buổi" cao 18px sống sót
   * từ Phase 3 tới giờ mà không bài nào thấy.
   */
  test("nợ #20: mọi điều khiển trên trang buổi đạt ngưỡng chạm 44px", async ({ page }, testInfo) => {
    const meetingDate = uniqueSunday(testInfo.project.name, 1_800);
    await login(page, "GLV909");
    const sessionUrl = await openAttendanceSession(page, meetingDate);
    await page.goto(sessionUrl);
    await expectNoHorizontalOverflow(page, "trang buổi điểm danh");

    const backLink = page.getByRole("link", { name: "← Danh sách buổi" });
    await expect(backLink).toBeVisible();
    const box = await backLink.boundingBox();
    expect(box, "link quay lại phải đo được").not.toBeNull();
    expect(box!.height, "link ← Danh sách buổi phải cao ≥44px").toBeGreaterThanOrEqual(44);

    // M05-C: điều khiển của roster nay là NÚT BẤM (D-142) và hàng danh sách
    // nay là một nút gấp/mở (D-143) — cả ba đều phải đạt ngưỡng chạm. Đo
    // `boundingBox()`, tức chiều cao THẬT ĐÃ DỰNG, chứ không kiểm tên lớp CSS:
    // một chuỗi `min-h-11` viết đúng vẫn có thể bị lớp khác đè, và bài kiểm
    // tên lớp sẽ xanh giả.
    const toggle = studentRows(page).first().locator("[data-roster-toggle]");
    const toggleBox = await toggle.boundingBox();
    expect(toggleBox, "nút gấp/mở hàng phải đo được").not.toBeNull();
    expect(toggleBox!.height, "nút gấp/mở hàng phải cao ≥44px").toBeGreaterThanOrEqual(44);

    const student = await expandFirstStudentRow(page);
    for (const [what, control] of [
      ["nút trạng thái Thánh lễ", statusGroup(page, student, "Thánh lễ").locator("label").first()],
      ["nút trạng thái Giáo lý", statusGroup(page, student, "Giáo lý").locator("label").first()],
      [
        "nút điểm danh giáo lý viên",
        page.getByRole("group", { name: /^Điểm danh / }).first().locator("label").first(),
      ],
      ["nút lọc danh sách", page.getByRole("group", { name: "Lọc danh sách thiếu nhi" }).locator("label").first()],
    ] as const) {
      const controlBox = await control.boundingBox();
      expect(controlBox, `${what} phải đo được`).not.toBeNull();
      expect(controlBox!.height, `${what} phải cao ≥44px`).toBeGreaterThanOrEqual(44);
      expect(controlBox!.width, `${what} phải rộng ≥44px`).toBeGreaterThanOrEqual(44);
    }
  });

  /* ========================================================================
     M05-B — hai bài mới
     ======================================================================== */

  /**
   * TB-11 / **D-141** — hàng rào đặt theo TRẠNG THÁI BUỔI, không theo ngày.
   *
   * Chủ dự án chốt 2026-08-03, khác đề xuất U-09 của `08_ACCEPTANCE_CRITERIA`
   * (chặn mọi ngày quá khứ). Bài này canh **cả hai chiều** trong một lượt, vì
   * chỉ canh chiều "bị chặn" thì một hàng rào chặn nhầm luôn cả buổi đang mở
   * vẫn xanh — mà đó đúng là hỏng hóc đắt nhất: phụ huynh báo muộn vài giờ
   * không gửi được đơn, trong khi Giáo lý viên còn chưa chốt.
   *
   * Bài này cũng canh nút gợi ý của TB-06 bước 2 trong trang thật.
   */
  test("TB-11/D-141: buổi ĐANG MỞ vẫn nhận đơn, buổi ĐÃ CHỐT thì không", async ({
    page,
  }, testInfo) => {
    const openDate = uniqueSunday(testInfo.project.name, 2_200);
    const finalizedDate = uniqueSunday(testInfo.project.name, 2_400);
    const reason = `Cháu sốt từ sáng ${openDate}`;

    try {
      // ── Buổi 1: mở nhưng KHÔNG chốt ──────────────────────────────────────
      await login(page, "GLV909");
      const openSessionUrl = await openAttendanceSession(page, openDate);

      // ── Buổi 2: mở VÀ chốt ───────────────────────────────────────────────
      await openAttendanceSession(page, finalizedDate);
      await finalizeSession(page);

      // ── Phụ huynh: buổi đang mở ⇒ gửi được ───────────────────────────────
      await login(page, "84912000001");
      await page.goto("/parent/absence-requests");
      const openCard = () => page.locator(`[data-absence-date="${openDate}"]`).first();
      await clickUntil(
        "Gửi đơn cho buổi đang mở",
        async () => {
          await page.getByLabel("Ngày nghỉ").fill(openDate);
          await page.locator('input[name="reason"]').fill(reason);
          await page.getByRole("button", { name: "Gửi đơn" }).click();
        },
        async () => (await openCard().getByText("Đang chờ").count()) > 0,
      );

      // ── Phụ huynh: buổi đã chốt ⇒ bị từ chối, và câu chữ nói ĐÚNG lý do ──
      await page.getByLabel("Ngày nghỉ").fill(finalizedDate);
      await page.locator('input[name="reason"]').fill(`Cháu đi đám cưới ${finalizedDate}`);
      await page.getByRole("button", { name: "Gửi đơn" }).click();
      await expect(page.getByText(/Buổi này đã được chốt điểm danh nên không nhận đơn nữa/))
        .toBeVisible();
      await expect(page.locator(`[data-absence-date="${finalizedDate}"]`)).toHaveCount(0);

      // ── TB-06 bước 2: đơn hiện thành gợi ý trong trang buổi ──────────────
      await login(page, "GLV909");
      await page.goto(openSessionUrl);
      // M05-C: badge "Có đơn" đọc được ngay ở hàng gấp lại; lý do đầy đủ nằm
      // trong hàng khi mở ra (D-143).
      const child = "Giuse Nguyễn Minh An";
      const row = page.locator(`[data-roster-row][data-student-label="${child}"]`);
      await expect(row.getByLabel(`Có đơn xin nghỉ: ${reason}`)).toBeVisible();
      await expandStudentRow(row);
      await expect(page.getByText(`Có đơn xin nghỉ: ${reason}`)).toBeVisible();
      const suggest = page.getByRole("button", { name: "Áp dụng gợi ý: Vắng có phép" });
      await expect(suggest).toHaveCount(1);
      await suggest.click();
      // AC-F13-3: gợi ý đặt cả hai cột, và chỉ trong bản nháp — chưa gửi đi đâu.
      await expectStudentStatus(page, child, "Thánh lễ", "excused_absence");
      await expectStudentStatus(page, child, "Giáo lý", "excused_absence");
    } finally {
      // Nợ #10: mọi bài E2E có ghi dữ liệu đều dọn sau mình (khuôn M03-C).
      await getLocalAdmin().from("absence_requests").delete().eq("reason", reason);
    }
  });

  /**
   * TB-06 / AC-F13-1 · AC-F13-2 — vòng đời đầy đủ của một đơn xin nghỉ.
   *
   * 🔴 Trước M05-B `acknowledgeAbsenceRequest` là **hàm mồ côi**: viết từ Phase
   * 3, không màn hình nào gọi, nên trạng thái "Đã ghi nhận" chưa từng tồn tại
   * trong đời thật và mọi đơn nằm ở "Đang chờ" vĩnh viễn. Bài này đi hết vòng
   * bằng hai tài khoản thật: phụ huynh gửi → Giáo lý viên thấy **mà không mở
   * buổi nào** → bấm Ghi nhận → phụ huynh thấy nhãn đổi.
   *
   * Ngày phải nằm trong cửa sổ ±7 ngày của thẻ, nên không dùng được
   * `uniqueSunday` (20+ tuần). Mỗi viewport lấy một cặp (phụ huynh, buổi) riêng
   * để ba lượt song song không đụng chỉ mục "một đơn còn hiệu lực mỗi buổi".
   */
  test("TB-06: phụ huynh gửi đơn, GLV ghi nhận ngay trên /attendance", async ({
    page,
  }, testInfo) => {
    const slot = REVIEW_SLOTS[testInfo.project.name] ?? REVIEW_SLOTS["mobile-360"];
    const meetingDate = nextMeetingDate(slot.meeting);
    const reason = `Cháu đi khám răng ${testInfo.project.name} ${meetingDate}`;

    try {
      await login(page, slot.parent);
      await page.goto("/parent/absence-requests");
      await clickUntil(
        "Gửi đơn xin nghỉ",
        async () => {
          await page.getByLabel("Ngày nghỉ").fill(meetingDate);
          await page.locator('input[name="reason"]').fill(reason);
          await page.getByRole("button", { name: "Gửi đơn" }).click();
        },
        async () =>
          (await page
            .locator(`[data-absence-date="${meetingDate}"]`)
            .first()
            .getByText("Đang chờ")
            .count()) > 0,
      );

      // AC-F13-1: Giáo lý viên thấy đơn ngay trên hub, KHÔNG cần mở buổi nào.
      await login(page, "GLV909");
      await page.goto("/attendance");
      const card = page.locator("[data-absence-request]").filter({ hasText: reason });
      await expect(card).toHaveCount(1);
      await expectNoHorizontalOverflow(page, "/attendance có đơn xin nghỉ");

      await clickUntil(
        "Ghi nhận đơn",
        async () => {
          await clickIfEnabled(card.getByRole("button", { name: "Ghi nhận" }));
        },
        async () => (await page.getByText(/Đã ghi nhận đơn của/).count()) > 0,
      );
      // 🔴 M05-C: câu xác nhận phải SỐNG SÓT qua đúng lượt làm mới mà nó vừa
      // kích hoạt. Ghi nhận xong là đơn hết `pending` và thẻ có thể rỗng ngay;
      // bản M05-B đặt dòng thông báo bên trong thẻ danh sách nên nó biến mất
      // cùng lúc với đơn, và người bấm không có gì xác nhận là đã xong.
      await expect(page.getByText(/Đã ghi nhận đơn của/)).toBeVisible();
      // Đơn đã ghi nhận rời khỏi danh sách "đang chờ" — thẻ chỉ lấy `pending`.
      await page.goto("/attendance");
      await expect(page.locator("[data-absence-request]").filter({ hasText: reason }))
        .toHaveCount(0);

      // AC-F13-2, nửa phía phụ huynh: nhãn đổi thật, không chỉ đổi trong DB.
      await login(page, slot.parent);
      await page.goto("/parent/absence-requests");
      await expect(
        page.locator(`[data-absence-date="${meetingDate}"]`).filter({ hasText: reason })
          .getByText("Đã ghi nhận"),
      ).toBeVisible();
    } finally {
      await getLocalAdmin().from("absence_requests").delete().eq("reason", reason);
    }
  });

  /* ========================================================================
     M05-C — hai bài mới
     ======================================================================== */

  /**
   * E-07 / TB-03 / AC-F06-1 — hộp xác nhận trước khi chốt.
   *
   * 🔴 Bài này canh **chiều phủ định** và đó mới là chỗ quan trọng: bấm Huỷ thì
   * **không request nào** đi tới máy chủ. Chỉ canh chiều thuận (xác nhận rồi thì
   * chốt được) sẽ xanh y hệt với một hộp thoại chỉ làm cảnh — mà bản thân việc
   * chốt vẫn chạy ngay từ cú bấm đầu, tức TB-03 không đổi được gì.
   */
  test("TB-03: bấm Hoàn tất mở hộp xác nhận; bấm Quay lại thì buổi KHÔNG bị chốt", async ({
    page,
  }, testInfo) => {
    // 🔴 Số tuần cố ý NHỎ. `/attendance` chỉ liệt kê 24 buổi gần nhất theo ngày
    // giảm dần (`queries.ts` `.limit(24)`, và U-02 mở rộng nó là việc của đợt
    // khác), mà mọi bài của bộ này đều đặt buổi ở tương lai xa. Một bài mới
    // dùng số tuần lớn hơn các bài cũ sẽ **đẩy buổi của bài TB-02 ra khỏi danh
    // sách** và làm nó đỏ vì lý do chẳng liên quan gì tới nó — đã gặp thật.
    const meetingDate = uniqueSunday(testInfo.project.name, 200);
    await login(page, "GLV909");
    const sessionUrl = await openAttendanceSession(page, meetingDate);
    const sessionId = sessionIdFromUrl(sessionUrl);

    await clickUntil(
      "Mở hộp xác nhận chốt",
      async () => {
        await page.getByRole("button", { name: "Hoàn tất điểm danh", exact: true }).click();
      },
      async () => (await page.getByRole("dialog").count()) > 0,
    );

    const dialog = page.getByRole("dialog");
    // Bảng phân bố tính từ bản nháp: buổi vừa mở nên mọi em đều "Có mặt".
    await expect(dialog.getByRole("row", { name: /Có mặt/ })).toBeVisible();
    await expect(dialog.getByText(/Giáo lý viên có mặt: \d+\/\d+/)).toBeVisible();
    await expectNoHorizontalOverflow(page, "hộp xác nhận chốt");

    await dialog.getByRole("button", { name: "Quay lại sửa", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);

    // Bằng chứng ở tầng dữ liệu, không chỉ ở tầng màn hình: buổi vẫn chưa chốt.
    const { data } = await getLocalAdmin()
      .from("attendance_sessions")
      .select("finalized_at")
      .eq("id", sessionId)
      .single();
    expect(data?.finalized_at, "bấm Huỷ mà buổi vẫn bị chốt").toBeNull();
    await expect(page.getByRole("button", { name: "Hoàn tất điểm danh", exact: true }))
      .toBeVisible();

    // Chiều thuận: xác nhận thì chốt được thật.
    await finalizeSession(page);
    const { data: after } = await getLocalAdmin()
      .from("attendance_sessions")
      .select("finalized_at")
      .eq("id", sessionId)
      .single();
    expect(after?.finalized_at).not.toBeNull();
  });

  /**
   * U-11 · U-21 · D-142 · D-143 — danh sách gấp lại, lọc và tìm ngay tại chỗ.
   *
   * Ở 360px một lớp 50 em dài ~9.000px. Bài này chứng minh ba điều bằng DOM
   * thật: hàng gấp lại không dựng điều khiển nào, bộ lọc bỏ bớt hàng, và ô tìm
   * bỏ dấu chạy được — tất cả **không** có lượt gọi máy chủ nào.
   */
  test("U-11/U-21: danh sách gấp lại, lọc và tìm không dấu ngay trên trang", async ({
    page,
  }, testInfo) => {
    // Cùng lý do với bài trên: giữ số tuần dưới mốc 1.400 của bài TB-02.
    const meetingDate = uniqueSunday(testInfo.project.name, 600);
    await login(page, "GLV909");
    await openAttendanceSession(page, meetingDate);

    const rows = studentRows(page);
    const total = await rows.count();
    expect(total).toBeGreaterThan(1);

    // U-21: chưa mở hàng nào thì không có hàng nút nào được dựng.
    await expect(page.getByRole("group", { name: /^Thánh lễ của / })).toHaveCount(0);
    await expectNoHorizontalOverflow(page, "trang buổi có bộ lọc");

    // U-11: nhãn nút lọc mang con số của cả buổi.
    const filterGroup = page.getByRole("group", { name: "Lọc danh sách thiếu nhi" });
    await expect(filterGroup.getByText(`Tất cả (${total})`, { exact: true })).toBeVisible();
    await expect(filterGroup.getByText("Đang vắng (0)", { exact: true })).toBeVisible();

    // Đánh vắng một em ⇒ con số đổi NGAY, chưa cần bấm Lưu.
    const student = await expandFirstStudentRow(page);
    await setStudentStatus(page, student, "Giáo lý", "unexcused_absence");
    await expect(filterGroup.getByText("Đang vắng (1)", { exact: true })).toBeVisible();

    await filterGroup.getByText("Đang vắng (1)", { exact: true }).click();
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toHaveAttribute("data-student-label", student);

    // Ô tìm bỏ dấu: gõ tên đã bỏ dấu của chính em ấy vẫn ra.
    await filterGroup.getByText(`Tất cả (${total})`, { exact: true }).click();
    const folded = student
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D");
    await page.getByLabel("Tìm thiếu nhi theo tên").fill(folded);
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toHaveAttribute("data-student-label", student);

    // Lọc rỗng thì nói ra lý do, không để một khoảng trắng.
    await page.getByLabel("Tìm thiếu nhi theo tên").fill("Zzzzz");
    await expect(rows).toHaveCount(0);
    await expect(page.getByText(/Không có em nào khớp “Zzzzz”/)).toBeVisible();
  });
});
