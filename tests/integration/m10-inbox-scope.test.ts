// @vitest-environment node
/**
 * M10-A · S-08 · S-09 · S-10 — **lỗ hổng kiểm thử gốc rễ của module thông báo.**
 *
 * `03_AUDIT_RESULTS.md` §4.1 chỉ ra vì sao hai lỗi CRITICAL sống sót qua cả
 * pgTAP lẫn E2E: mọi bài kiểm hiện có đều chạy bằng **phiên phụ huynh**
 * (`022:186-200`, `committees.spec.ts:228`) — một vai **không** có quyền đọc
 * toàn cục — nên chúng **không bao giờ chạm tới nhánh lỗi**. Nhánh ấy chỉ mở ra
 * với 6 vai trò cấp xứ đoàn.
 *
 * Bài này chạy bằng **JWT thật của Thư ký** (`CLAUDE.md` §4, không service role)
 * và đo **cả hai chiều**:
 *   ⓵ *canh hiện trạng* — hàng rào của cơ sở dữ liệu **cố ý** cho Thư ký đọc
 *     mọi dòng người-nhận. Đó là chủ ý (`07` §4 cấm sửa policy), nên nó phải
 *     được ghim lại: ngày nào khẳng định này đỏ là ngày ai đó đã sửa policy và
 *     bài ⓶ trở nên vô nghĩa.
 *   ⓶ *bằng chứng dương tính* — truy vấn **có** `profile_id` trả về đúng và chỉ
 *     đúng thông báo của Thư ký.
 *
 * Chạy sau `db:reset` + `seed:dev`:
 *   M10_DB=1 npx vitest run tests/integration/m10-inbox-scope.test.ts
 *
 * Mặc định **skip** — cùng khuôn với `m09-equipment-concurrency.test.ts`: bộ
 * unit test phải chạy được trên máy không có Docker.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Database } from "../../src/types/database";

function loadEnvLocal() {
  const file = path.resolve(process.cwd(), ".env.local");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}
loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const enabled =
  process.env.M10_DB === "1" &&
  Boolean(anonKey && serviceKey) &&
  /^https?:\/\/(127\.0\.0\.1|localhost)(:|$)/.test(url);
const describeDb = enabled ? describe : describe.skip;

const DEV_PASSWORD = "123456";
/** Thư ký — một trong 6 vai trò có `app.can_global_read()`. */
const SECRETARY = "GLV903";
/** Giáo lý viên lớp Ấu 1A — **không** có quyền đọc toàn cục. */
const CLASS_TEACHER = "GLV910";
const PRIVATE_TITLE = "M10A · thư riêng cho GLV910";

describeDb("M10-A · hộp thư và badge chỉ thuộc về người đăng nhập", () => {
  const domain = process.env.INTERNAL_AUTH_DOMAIN || "choquan.internal";
  const admin = createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let secretaryId = "";
  let teacherId = "";
  let privateNotificationId = "";
  let secretarySession: SupabaseClient<Database>;

  async function sessionFor(staffCode: string): Promise<SupabaseClient<Database>> {
    const client = createClient<Database>(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await client.auth.signInWithPassword({
      email: `${staffCode.toLowerCase()}@staff.${domain}`,
      password: DEV_PASSWORD,
    });
    if (error) throw new Error(`Đăng nhập ${staffCode}: ${error.message}`);
    return client;
  }

  async function profileIdOf(username: string): Promise<string> {
    const { data, error } = await admin
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    if (error || !data) throw new Error(`Không tìm thấy tài khoản ${username}: ${error?.message}`);
    return data.id;
  }

  async function removeFixture() {
    const { data } = await admin
      .from("notifications")
      .select("id")
      .eq("title", PRIVATE_TITLE);
    for (const row of data ?? []) {
      await admin.from("notification_recipients").delete().eq("notification_id", row.id);
      await admin.from("notifications").delete().eq("id", row.id);
    }
  }

  beforeAll(async () => {
    await removeFixture();
    secretaryId = await profileIdOf(SECRETARY);
    teacherId = await profileIdOf(CLASS_TEACHER);
    secretarySession = await sessionFor(SECRETARY);

    // Thư ký có `can_global_write` nên gửi được thư riêng. Người nhận là Giáo
    // lý viên lớp — **không** phải Thư ký. Đây là bản ghi mà hộp thư của Thư ký
    // tuyệt đối không được chứa.
    const { data, error } = await secretarySession.rpc("publish_notification", {
      p_title: PRIVATE_TITLE,
      p_content: "Nội dung riêng tư, chỉ một người được đọc.",
      p_target_type: "user",
      p_target_id: teacherId,
    });
    if (error || !data) throw new Error(`Không gửi được thư riêng: ${error?.message}`);
    privateNotificationId = data;
  }, 60_000);

  afterAll(async () => {
    await removeFixture();
    await secretarySession?.auth.signOut();
  });

  it("thư riêng tới đúng một người, và người đó không phải Thư ký", async () => {
    const { data } = await admin
      .from("notification_recipients")
      .select("profile_id")
      .eq("notification_id", privateNotificationId);
    expect(data?.map((row) => row.profile_id)).toEqual([teacherId]);
    expect(teacherId).not.toBe(secretaryId);
  });

  it("⓵ canh hiện trạng — hàng rào CSDL cố ý cho Thư ký đọc dòng của người khác", async () => {
    // Khẳng định này **phải xanh**. Nó ghim lại lý do bài ⓶ tồn tại: policy
    // `notification_recipients_select_self` có nhánh `or app.can_global_read()`
    // phục vụ mục đích quản trị (`07` §4 cấm gỡ), nên hàng rào KHÔNG lọc giúp
    // màn hình "của tôi". Nếu ngày nào nó đỏ, nghĩa là ai đó đã sửa policy —
    // và bài ⓶ khi ấy sẽ xanh vì lý do sai.
    const { data } = await secretarySession
      .from("notification_recipients")
      .select("profile_id")
      .eq("notification_id", privateNotificationId);
    expect(data).toHaveLength(1);
    expect(data?.[0].profile_id).toBe(teacherId);
  });

  it("S-08 · S-10 — hộp thư của Thư ký không chứa thư riêng của người khác", async () => {
    const { data } = await secretarySession
      .from("notification_recipients")
      .select("read_at, notifications(id, title)")
      .eq("profile_id", secretaryId)
      .order("delivered_at", { ascending: false })
      .limit(50);
    const titles = (data ?? []).map((row) => row.notifications?.title);
    expect(titles).not.toContain(PRIVATE_TITLE);
  });

  it("S-08 — mọi dòng trong hộp thư đều thuộc về chính Thư ký", async () => {
    const { data } = await secretarySession
      .from("notification_recipients")
      .select("profile_id")
      .eq("profile_id", secretaryId)
      .limit(50);
    for (const row of data ?? []) expect(row.profile_id).toBe(secretaryId);
  });

  it("S-09 — badge đếm đúng số chưa đọc của chính mình, không của cả xứ đoàn", async () => {
    const mine = await secretarySession
      .from("notification_recipients")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", secretaryId)
      .is("read_at", null);

    // Đúng truy vấn của bản cũ — thiếu `profile_id`. Giữ lại để đo **khoảng
    // cách** giữa hai con số; đây là thứ đã làm chuông hiện "99+".
    const everyone = await secretarySession
      .from("notification_recipients")
      .select("id", { count: "exact", head: true })
      .is("read_at", null);

    const { count: truth } = await admin
      .from("notification_recipients")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", secretaryId)
      .is("read_at", null);

    expect(mine.count).toBe(truth);
    expect(everyone.count ?? 0).toBeGreaterThanOrEqual(mine.count ?? 0);
  });

  it("AC-01-07 — vai trò không có quyền rộng không đổi hành vi", async () => {
    // Với Giáo lý viên lớp, hàng rào CSDL vốn đã lọc đúng: có hay không có
    // `.eq(profile_id)` cũng ra cùng một kết quả. Đây là bằng chứng cho câu
    // "8/14 vai trò không thấy gì thay đổi" ở `07` §2.
    const teacherSession = await sessionFor(CLASS_TEACHER);
    try {
      const filtered = await teacherSession
        .from("notification_recipients")
        .select("id", { count: "exact", head: true })
        .eq("profile_id", teacherId);
      const unfiltered = await teacherSession
        .from("notification_recipients")
        .select("id", { count: "exact", head: true });
      expect(filtered.count).toBe(unfiltered.count);
      expect(filtered.count ?? 0).toBeGreaterThan(0);
    } finally {
      await teacherSession.auth.signOut();
    }
  });
});
