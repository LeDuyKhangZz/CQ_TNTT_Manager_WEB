import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";
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

async function expectNoHorizontalOverflow(page: Page, where: string) {
  await page.waitForLoadState("domcontentloaded");
  await page.locator("body").waitFor({ state: "attached" });
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  expect(overflows, `${where} không được tràn ngang`).toBe(false);
}

async function openAttendanceSession(page: Page, meetingDate: string): Promise<string> {
  await page.goto("/attendance");
  await page.locator('input[name="date"]').fill(meetingDate);
  await page.locator('select[name="meetingType"]').selectOption("sunday");
  await clickUntil(
    "Mở buổi",
    async () => {
      await page.getByRole("button", { name: "Mở buổi" }).click();
    },
    async () => /\/attendance\/[0-9a-f-]{36}$/.test(page.url()),
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
    for (let waited = 0; waited < 12; waited += 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (await done()) return;
    }
  }
  throw new Error(`${what}: bấm nhiều lần vẫn không có hiệu lực.`);
}

test.describe("Điểm danh Phase 3", () => {
  // Bộ này ghi dữ liệu qua nhiều bước và có vòng bấm-lại chờ hydrate, nên cần
  // nhiều hơn mốc 30 giây mặc định của các bài chỉ đọc.
  test.describe.configure({ timeout: 120_000 });

  test("GLV lớp mở buổi, sửa ngoại lệ rồi chốt; phụ huynh đọc được bản đã chốt", async ({
    page,
  }, testInfo) => {
    const meetingDate = uniqueSunday(testInfo.project.name);
    await login(page, "GLV909");

    // ── Mở buổi ────────────────────────────────────────────────────────────
    await page.goto("/attendance");
    await expect(page.getByRole("heading", { name: "Mở buổi điểm danh" })).toBeVisible();
    await expectNoHorizontalOverflow(page, "/attendance");

    await page.locator('input[name="date"]').fill(meetingDate);
    await page.locator('select[name="meetingType"]').selectOption("sunday");
    await clickUntil(
      "Mở buổi",
      async () => {
        await page.getByRole("button", { name: "Mở buổi" }).click();
      },
      async () => /\/attendance\/[0-9a-f-]{36}$/.test(page.url()),
    );
    const sessionUrl = page.url();

    // Roster được nạp sẵn từ ghi danh.
    const massSelects = page.locator('select[aria-label^="Thánh lễ của"]');
    const catechismSelects = page.locator('select[aria-label^="Giáo lý của"]');
    expect(await massSelects.count()).toBeGreaterThan(0);
    await expectNoHorizontalOverflow(page, "trang buổi điểm danh");

    // ── Hai trạng thái độc lập (D-30): đi lễ nhưng vắng giáo lý ────────────
    // Đặt tường minh cả hai thay vì tin vào giá trị sẵn có: bài này ghi dữ
    // liệu nên chạy lại có thể gặp buổi đã được sửa từ lần trước. Bản thân
    // luật "mặc định present" đã được pgTAP 012 chứng minh ở tầng DB.
    await massSelects.first().selectOption("present");
    await catechismSelects.first().selectOption("unexcused_absence");

    // Ô ghi chú chỉ hiện khi có ngoại lệ, đúng tinh thần "chỉ sửa ngoại lệ".
    const noteInput = page.locator('input[aria-label^="Ghi chú của"]').first();
    await expect(noteInput).toBeVisible();
    await noteInput.fill("Đi lễ xong về sớm");

    // ── Điểm danh GLV trong cùng buổi (D-35) ───────────────────────────────
    const staffSelect = page.locator('select[aria-label^="Điểm danh "]').first();
    await staffSelect.selectOption("excused_absence");

    // ── Lưu nháp rồi chốt ──────────────────────────────────────────────────
    await clickUntil(
      "Lưu nháp",
      async () => {
        await page.getByRole("button", { name: "Lưu nháp" }).click();
      },
      async () => (await page.getByText("Đã lưu nháp.").count()) > 0,
    );

    await clickUntil(
      "Hoàn tất điểm danh",
      async () => {
        await page.getByRole("button", { name: "Hoàn tất điểm danh" }).click();
      },
      // Chốt xong thì RPC nhả quyền chỉnh sửa, nên nút biến mất — đó là tín
      // hiệu từ server. Chỉ trông vào thông báo phía client là không chắc:
      // `router.refresh()` render lại và trang chuyển sang chế độ chỉ xem.
      async () =>
        (await page.getByText("Đã chốt buổi điểm danh.").count()) > 0
        || (await page.getByRole("button", { name: "Hoàn tất điểm danh" }).count()) === 0,
    );

    // Tải lại: giá trị đã lưu vẫn còn và buổi đã ở trạng thái chốt.
    await page.goto(sessionUrl);
    await expect(page.getByText("Đã chốt").first()).toBeVisible();
    await expect(page.locator('select[aria-label^="Giáo lý của"]').first()).toHaveValue(
      "unexcused_absence",
    );
    await expect(page.locator('select[aria-label^="Thánh lễ của"]').first()).toHaveValue("present");

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

      const bCatechism = pageB.locator('select[aria-label^="Giáo lý của"]').first();
      await bCatechism.selectOption("excused_absence");
      await clickUntil(
        "B lưu sau tiếp quản",
        async () => {
          await pageB.getByRole("button", { name: "Lưu nháp" }).click();
        },
        async () => (await pageB.getByText("Đã lưu nháp.").count()) > 0,
      );

      // A vẫn đang giữ DOM cũ với control enabled. Cú lưu này phải đi tới
      // server, bị RPC từ chối bằng thông báo tiếng Việt và không đổi dữ liệu B.
      await pageA.locator('select[aria-label^="Giáo lý của"]').first().selectOption(
        "unexcused_absence",
      );
      await pageA.getByRole("button", { name: "Lưu nháp" }).click();
      await expect(
        pageA.getByText("Buổi điểm danh đang có người khác phụ trách."),
      ).toBeVisible();

      await pageB.reload();
      await expect(pageB.locator('select[aria-label^="Giáo lý của"]').first()).toHaveValue(
        "excused_absence",
      );
    } finally {
      await contextB.close();
    }
  });

  test("editor đang mở trang vẫn bị chặn khi buổi vừa hết hạn khóa", async ({ page }, testInfo) => {
    const meetingDate = uniqueSunday(testInfo.project.name, 1_000);
    await login(page, "GLV909");
    const sessionUrl = await openAttendanceSession(page, meetingDate);
    const sessionId = sessionIdFromUrl(sessionUrl);

    await clickUntil(
      "Hoàn tất để tạo mốc khóa",
      async () => {
        await page.getByRole("button", { name: "Hoàn tất điểm danh" }).click();
      },
      async () => (await page.getByRole("button", { name: "Hoàn tất điểm danh" }).count()) === 0,
    );

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
    await page.locator('select[aria-label^="Thánh lễ của"]').first().selectOption("late");
    await page.getByRole("button", { name: "Lưu nháp" }).click();
    await expect(page.getByText("Buổi điểm danh đã bị khóa.")).toBeVisible();

    await page.reload();
    await expect(page.getByText("Buổi này đã khóa. Chỉ Quản trị viên hệ thống mở khóa và sửa được."))
      .toBeVisible();
    await expect(page.locator('select[aria-label^="Thánh lễ của"]').first()).toBeDisabled();
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
        await page.locator('input[name="absenceDate"]').fill(absenceDate);
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
});
