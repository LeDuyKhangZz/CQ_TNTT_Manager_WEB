// @vitest-environment node
/**
 * Gate Phase 2 — "no cross-scope leakage" trên dữ liệu thật ở quy mô thật.
 *
 * pgTAP 010 đã kiểm cùng luật trên fixture 3 em dựng tay. Bài này kiểm lại trên
 * DB đã có ~900 thiếu nhi / 19 lớp sau khi import sổ lớp thật và bơm perf, bằng
 * JWT thật của từng vai trò trong seed dev. Kỳ vọng không viết cứng: số liệu
 * chuẩn được tính từ phiên global rồi so với những gì phiên bị giới hạn đọc ra.
 *
 * Chạy sau: db:reset → seed:dev → gate-phase2-import → perf:smoke
 *   GATE_PHASE2=1 npx vitest run tests/integration/gate-phase2-scope.test.ts
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";

function loadEnvLocal() {
  const file = path.resolve(process.cwd(), ".env.local");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}
loadEnvLocal();

const enabled =
  process.env.GATE_PHASE2 === "1" &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const describeGate = enabled ? describe : describe.skip;

const DEV_PASSWORD = "123456";

/* eslint-disable @typescript-eslint/no-explicit-any -- ad-hoc gate client, các
   khẳng định bên dưới mới là thứ kiểm tra hình dạng dữ liệu. */
type Client = SupabaseClient<any, any, any>;

describeGate("Gate Phase 2 — phạm vi đọc trên dữ liệu thật", () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const domain = process.env.INTERNAL_AUTH_DOMAIN || "choquan.internal";

  async function sessionFor(username: string): Promise<Client> {
    const client = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const local = username.toLowerCase();
    const email = /^glv/.test(local)
      ? `${local}@staff.${domain}`
      : /^cq/.test(local)
        ? `${local}@students.${domain}`
        : /^[0-9]+$/.test(local)
          ? `${local}@guardians.${domain}`
          : `${local}@accounts.${domain}`;
    const { error } = await client.auth.signInWithPassword({ email, password: DEV_PASSWORD });
    if (error) throw new Error(`Đăng nhập ${username}: ${error.message}`);
    return client;
  }

  /** Số dòng người này thực sự đọc được (count exact đi qua RLS). */
  async function countVisible(client: Client, table: string, column = "id") {
    const { count, error } = await client.from(table).select(column, { count: "exact", head: true });
    expect(error, `${table}`).toBeNull();
    return count ?? 0;
  }

  let global: Client;
  let auLeader: Client;
  let au1aTeacher: Client;
  let guardian: Client;
  let student: Client;
  let totals: { students: number; enrollments: number };
  let auStudentIds: Set<string>;
  let au1aStudentIds: Set<string>;
  /** GLV lớp Ấu 1A đồng thời là phụ huynh (D-25): con của cô ở lớp Thiếu 1A,
   *  nên phạm vi đọc hợp lệ của cô là roster lớp mình CỘNG con mình. */
  let au1aTeacherVisibleIds: Set<string>;

  beforeAll(async () => {
    global = await sessionFor("GLV901"); // Xứ đoàn trưởng — global write
    auLeader = await sessionFor("GLV905"); // Trưởng ngành Ấu
    au1aTeacher = await sessionFor("GLV910"); // GLV lớp Ấu 1A
    guardian = await sessionFor("84912000001"); // Phụ huynh Nguyễn Văn Ba
    student = await sessionFor("CQ0001"); // Thiếu nhi Nguyễn Minh An

    totals = {
      students: await countVisible(global, "students"),
      enrollments: await countVisible(global, "enrollments"),
    };
    // Bộ dữ liệu phải đủ lớn thì phép kiểm mới có nghĩa.
    expect(totals.students).toBeGreaterThanOrEqual(900);

    const { data: auRows } = await global
      .from("enrollments")
      .select("student_id, classes!inner(display_name, grade_levels!inner(sectors!inner(code)))")
      .in("status", ["active", "paused"])
      .eq("classes.grade_levels.sectors.code", "AU_NHI");
    auStudentIds = new Set((auRows ?? []).map((row: any) => row.student_id));
    au1aStudentIds = new Set(
      (auRows ?? [])
        .filter((row: any) => row.classes.display_name === "Ấu 1A")
        .map((row: any) => row.student_id),
    );
    expect(auStudentIds.size).toBeGreaterThan(au1aStudentIds.size);
    expect(au1aStudentIds.size).toBeGreaterThan(0);

    const { data: teacherChildren } = await global
      .from("students")
      .select("id, guardians!inner(profile_id), profiles:profile_id(id)")
      .eq("guardians.full_name", "Đinh GLV 1A");
    au1aTeacherVisibleIds = new Set([
      ...au1aStudentIds,
      ...(teacherChildren ?? []).map((row: any) => row.id),
    ]);
    // Fixture phải thật sự có trường hợp GLV kiêm phụ huynh, nếu không phép
    // kiểm D-25 dưới đây trở nên vô nghĩa.
    expect(au1aTeacherVisibleIds.size).toBeGreaterThan(au1aStudentIds.size);
  });

  it("trưởng ngành Ấu thấy đúng thiếu nhi ngành Ấu, không hơn một em", async () => {
    const { data } = await auLeader.from("students").select("id");
    const seen = new Set((data ?? []).map((row: any) => row.id));
    expect(seen.size).toBe(auStudentIds.size);
    for (const id of seen) expect(auStudentIds.has(id)).toBe(true);
    // Và phải thực sự nhỏ hơn toàn xứ đoàn, nếu không phép kiểm vô nghĩa.
    expect(seen.size).toBeLessThan(totals.students);
  });

  it("GLV lớp Ấu 1A chỉ thấy roster lớp mình (cộng con mình theo D-25)", async () => {
    const { data } = await au1aTeacher.from("students").select("id");
    const seen = new Set((data ?? []).map((row: any) => row.id));
    expect(seen.size).toBe(au1aTeacherVisibleIds.size);
    for (const id of seen) expect(au1aTeacherVisibleIds.has(id)).toBe(true);
    expect(seen.size).toBeLessThan(totals.students);
  });

  it("GLV lớp không đọc được hồ sơ sức khỏe của lớp khác", async () => {
    const outsider = [...auStudentIds].find((id) => !au1aStudentIds.has(id))!;
    const { data } = await au1aTeacher
      .from("student_health_profiles")
      .select("student_id")
      .eq("student_id", outsider);
    expect(data ?? []).toHaveLength(0);

    const { data: visibleHealth } = await au1aTeacher
      .from("student_health_profiles")
      .select("student_id");
    for (const row of visibleHealth ?? []) {
      expect(au1aStudentIds.has((row as any).student_id)).toBe(true);
    }
  });

  it("GLV lớp không ghi được vào lớp khác", async () => {
    const outsider = [...auStudentIds].find((id) => !au1aStudentIds.has(id))!;
    const { error } = await au1aTeacher
      .from("students")
      .update({ general_notes: "không được phép" })
      .eq("id", outsider)
      .select("id");
    // RLS chặn: hoặc báo lỗi, hoặc lặng lẽ không cập nhật dòng nào.
    const { data: after } = await global
      .from("students")
      .select("general_notes")
      .eq("id", outsider)
      .single();
    expect((after as any).general_notes).not.toBe("không được phép");
    void error;
  });

  it("phụ huynh chỉ thấy con mình và không đọc được sức khỏe", async () => {
    const { data: mine } = await guardian.from("students").select("id, guardian_id");
    expect((mine ?? []).length).toBeGreaterThan(0);
    expect((mine ?? []).length).toBeLessThan(totals.students);
    const guardianIds = new Set((mine ?? []).map((row: any) => row.guardian_id));
    expect(guardianIds.size).toBe(1);

    expect(await countVisible(guardian, "student_health_profiles", "student_id")).toBe(0);
  });

  it("thiếu nhi chỉ thấy chính mình và không đọc được sức khỏe của mình", async () => {
    const { data: self } = await student.from("students").select("id");
    expect((self ?? []).length).toBe(1);
    expect(await countVisible(student, "student_health_profiles", "student_id")).toBe(0);
  });

  it("phụ huynh không tạo được hồ sơ thiếu nhi", async () => {
    const { data: own } = await guardian.from("students").select("guardian_id").limit(1).single();
    const { error } = await guardian.from("students").insert({
      full_name: "Chèn Trái Phép",
      saint_name: "Giuse",
      gender: "male",
      date_of_birth: "2018-01-01",
      guardian_id: (own as any).guardian_id,
    });
    expect(error).not.toBeNull();
  });

  it("phạm vi ghi danh cũng bị giới hạn đúng như phạm vi thiếu nhi", async () => {
    const { data } = await au1aTeacher.from("enrollments").select("student_id, class_id");
    expect((data ?? []).length).toBeGreaterThan(0);
    for (const row of data ?? []) {
      expect(au1aTeacherVisibleIds.has((row as any).student_id)).toBe(true);
    }
    expect((data ?? []).length).toBeLessThan(totals.enrollments);
  });
});
