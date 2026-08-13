// @vitest-environment node
/**
 * Gate Phase 2 — nhập trọn bộ sổ lớp thật của xứ đoàn vào DB local.
 *
 * Chạy đúng pipeline mà /imports dùng (parse → buildRow → staging →
 * commit_import_rows) nhưng bằng JWT thật của một tài khoản global-write, nên
 * mọi RLS/trigger/RPC đều bị đụng thật. Server Action không gọi được từ Node,
 * đó là phần duy nhất bị thay thế; luồng bấm nút do E2E phủ.
 *
 * Không nằm trong `npm test`: cần Supabase local đang chạy, đã `npm run
 * db:reset && npm run seed:dev`, và thư mục `../Excel mẫu` chứa dữ liệu cá nhân
 * thật (không bao giờ copy vào repo).
 *
 *   GATE_PHASE2=1 npx vitest run tests/integration/gate-phase2-import.test.ts
 */
import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";
import { buildRow, type ClassLookup } from "@/features/imports/build-row";
import { findDuplicate, findInFileDuplicates, type ExistingStudent } from "@/features/imports/dedup";
import { classAliasKey } from "@/features/imports/normalize";
import { parseWorkbook } from "@/features/imports/parse";
import { decideDuplicateRow, hasPendingDuplicate } from "@/features/imports/row-decision";

/** Vitest không nạp .env.local, mà script seed/gate đều cần khóa local. */
function loadEnvLocal() {
  const file = path.resolve(process.cwd(), ".env.local");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}
loadEnvLocal();

const SAMPLE_ROOT = path.resolve(process.cwd(), "..", "Excel mẫu");
const enabled =
  process.env.GATE_PHASE2 === "1" &&
  existsSync(SAMPLE_ROOT) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const describeGate = enabled ? describe : describe.skip;

/** Mỗi sổ là một lớp. Lớp đích chỉ dùng khi dòng không tự khai lớp. */
const ROSTERS: { file: string; targetClass: string }[] = [
  { file: "Ngành Chiên - Ấu/Lớp Chiên Con 1/Chiên con 1.xlsx", targetClass: "Chiên Con 1" },
  { file: "Ngành Chiên - Ấu/Lớp Chiên Con 2/Chiên con 2.xlsx", targetClass: "Chiên Con 2" },
  { file: "Ngành Chiên - Ấu/Lớp Ấu 1A/Ấu 1A.xlsx", targetClass: "Ấu 1A" },
  { file: "Ngành Chiên - Ấu/Lớp Ấu 1B/Ấu 1B.xlsx", targetClass: "Ấu 1B" },
  { file: "Ngành Chiên - Ấu/Lớp Ấu 2A/Ấu 2A.xlsx", targetClass: "Ấu 2A" },
  { file: "Ngành Chiên - Ấu/Lớp Ấu 2B/Ấu 2B.xlsx", targetClass: "Ấu 2B" },
  { file: "Ngành Chiên - Ấu/Lớp Ấu 3A/Ấu 3A.xlsx", targetClass: "Ấu 3A" },
  { file: "Ngành Chiên - Ấu/Lớp Ấu 3B/Ấu 3B.xlsx", targetClass: "Ấu 3B" },
  { file: "Ngành Thiếu/Lớp Thiếu 1A/Thieu_1A.xlsx", targetClass: "Thiếu 1A" },
  { file: "Ngành Thiếu/Lớp Thiếu 1B/Thieu_1B.xlsx", targetClass: "Thiếu 1B" },
  { file: "Ngành Thiếu/Lớp Thiếu 2A/Thieu_2A.xlsx", targetClass: "Thiếu 2A" },
  { file: "Ngành Thiếu/Lớp Thiếu 2B/Thieu_2B.xlsx", targetClass: "Thiếu 2B" },
  { file: "Ngành Thiếu/Lớp Thiếu 3/Thieu_3.xlsx", targetClass: "Thiếu 3" },
  { file: "Ngành Nghĩa/Nghĩa 1.xlsx", targetClass: "Nghĩa 1" },
  { file: "Ngành Nghĩa/Nghĩa 2.xlsx", targetClass: "Nghĩa 2" },
  { file: "Ngành Nghĩa/Nghĩa 3.xlsx", targetClass: "Nghĩa 3" },
  { file: "Ngành Hiệp/Hiệp 1.xlsx", targetClass: "Hiệp 1" },
  { file: "Ngành Hiệp/Hiệp 2.xlsx", targetClass: "Hiệp 2" },
];

const COMMIT_CHUNK_SIZE = 100;

interface FileReport {
  file: string;
  layout: string;
  parsed: number;
  staged: { valid: number; warning: number; error: number };
  committed: number;
  created: number;
  merged: number;
  enrollmentCreated: number;
  duplicateConfirmed: number;
  failed: number;
  parseError?: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any -- generated DB types are
   not wired into this ad-hoc gate client; the queries are checked by the
   assertions below instead. */
type Client = SupabaseClient<any, any, any>;

describeGate("Gate Phase 2 — import sổ lớp thật", () => {
  let user: Client;
  let profileId: string;
  let yearId: string;
  let classLookup: ClassLookup;
  let baselineStudentCount = 0;
  let baselineEnrollmentCount = 0;
  let provedPendingGuard = false;
  const reports: FileReport[] = [];

  beforeAll(async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const domain = process.env.INTERNAL_AUTH_DOMAIN || "choquan.internal";

    user = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    // GLV901 = Xứ đoàn trưởng trong seed dev (D-18: global write).
    const signIn = await user.auth.signInWithPassword({
      email: `glv901@staff.${domain}`,
      password: "123456",
    });
    expect(signIn.error, "cần chạy `npm run db:reset && npm run seed:dev` trước").toBeNull();
    profileId = signIn.data.user!.id;

    const { data: year } = await user
      .from("academic_years")
      .select("id")
      .eq("status", "current")
      .maybeSingle();
    expect(year, "phải có năm học hiện hành").toBeTruthy();
    yearId = year!.id;

    const { data: classes } = await user
      .from("classes")
      .select("id, display_name")
      .eq("academic_year_id", yearId)
      .eq("status", "active");
    const lookup = new Map<string, string>();
    for (const row of classes ?? []) lookup.set(classAliasKey(row.display_name), row.id);
    classLookup = lookup;
    expect(lookup.size).toBe(19);

    const students = await user.from("students").select("id", { count: "exact", head: true });
    const enrollments = await user
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("academic_year_id", yearId)
      .eq("status", "active");
    expect(students.error).toBeNull();
    expect(enrollments.error).toBeNull();
    baselineStudentCount = students.count ?? 0;
    baselineEnrollmentCount = enrollments.count ?? 0;
  });

  it(
    "nhập toàn bộ sổ lớp qua staging + RPC commit",
    { timeout: 20 * 60 * 1000 },
    async () => {
      for (const roster of ROSTERS) {
        const report: FileReport = {
          file: roster.file,
          layout: "-",
          parsed: 0,
          staged: { valid: 0, warning: 0, error: 0 },
          committed: 0,
          created: 0,
          merged: 0,
          enrollmentCreated: 0,
          duplicateConfirmed: 0,
          failed: 0,
        };
        reports.push(report);

        let parsed;
        try {
          parsed = await parseWorkbook(await readFile(path.join(SAMPLE_ROOT, roster.file)));
        } catch (error) {
          report.parseError = error instanceof Error ? error.message : String(error);
          continue;
        }
        report.layout = parsed.layout;
        report.parsed = parsed.rows.length;

        const fallbackClassId = classLookup.get(classAliasKey(roster.targetClass)) ?? null;
        expect(fallbackClassId, `không tìm thấy lớp ${roster.targetClass}`).toBeTruthy();

        // Cùng nguồn dữ liệu dedup mà server action dùng: học sinh đã có hồ sơ.
        // M12-A bỏ bộ lọc `status='active'` theo AC-20 — em đã nghỉ nay quay lại
        // phải được cảnh báo trùng, không phải được tạo hồ sơ thứ hai.
        const { data: existingRows } = await user
          .from("students")
          .select("id, student_code, full_name, date_of_birth, status, guardians(phone)");
        const existing: ExistingStudent[] = (existingRows ?? []).map((row: any) => {
          const guardian = row.guardians;
          const phone = Array.isArray(guardian) ? (guardian[0]?.phone ?? null) : (guardian?.phone ?? null);
          return {
            id: row.id,
            studentCode: row.student_code,
            fullName: row.full_name,
            dateOfBirth: row.date_of_birth,
            guardianPhone: phone,
          };
        });
        const statusById = new Map<string, string>(
          (existingRows ?? []).map((row: any) => [row.id as string, row.status as string]),
        );

        const built = parsed.rows.map((row) =>
          buildRow(row, classLookup, {
            fallbackClassId,
            fallbackClassLabel: roster.targetClass,
          }),
        );
        const inFileConflicts = findInFileDuplicates(built.map((row) => row.normalized));

        const { data: batch, error: batchError } = await user
          .from("import_batches")
          .insert({
            filename: path.basename(roster.file),
            source_format: parsed.layout,
            academic_year_id: yearId,
            uploaded_by: profileId,
            total_rows: built.length,
          })
          .select("id")
          .single();
        expect(batchError).toBeNull();

        const rowsPayload = built.map((row, index) => {
          const warnings = [...row.warnings];
          const duplicate = findDuplicate(row.normalized, existing);
          // 🔴 M12-A: quyết định mặc định của dòng trùng gọi ĐÚNG hàm mà
          // `createDryRunBatch` gọi. Chép tay lần thứ hai ở đây là dựng lại đúng
          // loại lệch mà M03-B vừa diệt ở luật dò trùng — cổng Phase 2 sẽ đo một
          // hệ thống khác với hệ thống người dùng đang bấm.
          const decision = decideDuplicateRow(
            duplicate
              ? {
                  level: duplicate.level,
                  studentId: duplicate.student.id,
                  reason: duplicate.reason,
                  status: statusById.get(duplicate.student.id) ?? "active",
                }
              : null,
          );
          if (decision.warning) warnings.push(decision.warning);
          const inFile = inFileConflicts.get(index);
          if (inFile) warnings.push({ field: "duplicate", message: inFile });

          const status =
            row.errors.length > 0 ? "error" : warnings.length > 0 ? "warning" : "valid";
          report.staged[status] += 1;

          return {
            batch_id: batch!.id,
            row_number: row.rowNumber,
            raw_json: JSON.parse(JSON.stringify(parsed!.rows[index].values)),
            normalized_json: JSON.parse(JSON.stringify(row.normalized)),
            status,
            errors_json: JSON.parse(JSON.stringify(row.errors)),
            warnings_json: JSON.parse(JSON.stringify(warnings)),
            matched_student_id: duplicate?.student.id ?? null,
            action: decision.action,
          };
        });

        if (rowsPayload.length > 0) {
          const { error: rowsError } = await user.from("import_rows").insert(rowsPayload);
          expect(rowsError, `staging ${roster.file}`).toBeNull();
        }

        // Đứng thay người duyệt: sổ SYLL không có cột giới tính nên UI bắt chọn
        // tay từng dòng. Ở gate ta điền luân phiên chỉ để chạy được commit —
        // đây KHÔNG phải dữ liệu giới tính thật của các em.
        const { data: pendingRows } = await user
          .from("import_rows")
          .select("id, action, normalized_json, warnings_json")
          .eq("batch_id", batch!.id)
          .in("status", ["valid", "warning"])
          .order("row_number");

        let alternate = 0;
        for (const row of pendingRows ?? []) {
          const normalized = (row.normalized_json ?? {}) as Record<string, unknown>;
          if (normalized.gender) continue;
          const warnings = ((row.warnings_json ?? []) as { field: string }[]).filter(
            (issue) => issue.field !== "gender",
          );
          await user
            .from("import_rows")
            .update({
              normalized_json: { ...normalized, gender: alternate++ % 2 ? "female" : "male" },
              warnings_json: warnings,
            })
            .eq("id", row.id);
        }

        const duplicateRows = (pendingRows ?? []).filter((row) =>
          hasPendingDuplicate((row.warnings_json ?? []) as { field: string; message: string }[]),
        );

        // Prove once that the public RPC itself rejects an unresolved marker;
        // this is the DB boundary D-133 needs, independent of the Server Action.
        if (!provedPendingGuard && duplicateRows.length > 0) {
          const unresolved = duplicateRows[0];
          const preflight = await user.rpc("commit_import_rows", {
            p_batch_id: batch!.id,
            p_row_ids: [unresolved.id],
          });
          expect(preflight.error?.message).toContain("IMPORT_DUPLICATE_REVIEW_REQUIRED");
          provedPendingGuard = true;
        }

        // This gate stands in for the explicit per-row confirmation click. It
        // must use the authoritative RPC, never rewrite warnings_json directly.
        for (const row of duplicateRows) {
          const confirmation = await user.rpc("confirm_import_duplicate", {
            p_row_id: row.id,
            p_action: row.action,
          });
          expect(confirmation.error, `confirm duplicate ${roster.file}`).toBeNull();
          report.duplicateConfirmed += 1;
        }

        const ids = (pendingRows ?? []).map((row) => row.id);
        const actionById = new Map((pendingRows ?? []).map((row) => [row.id, row.action]));
        for (let offset = 0; offset < ids.length; offset += COMMIT_CHUNK_SIZE) {
          const chunk = ids.slice(offset, offset + COMMIT_CHUNK_SIZE);
          const { data, error } = await user.rpc("commit_import_rows", {
            p_batch_id: batch!.id,
            p_row_ids: chunk,
          });
          expect(error, `commit ${roster.file}`).toBeNull();
          for (const result of (data ?? []) as any[]) {
            if (result.out_committed) {
              report.committed += 1;
              if (actionById.get(result.out_row_id) === "merge") report.merged += 1;
              else report.created += 1;
              if (result.out_enrollment_created) report.enrollmentCreated += 1;
            }
            else if (result.out_error_message) report.failed += 1;
          }
        }
      }

      // ── Báo cáo ────────────────────────────────────────────────────────────
      const line = (report: FileReport) =>
        `${report.file.padEnd(46)} ${report.layout.padEnd(12)} parse ${String(report.parsed).padStart(3)} ` +
        `· hợp lệ ${String(report.staged.valid).padStart(3)} · cảnh báo ${String(report.staged.warning).padStart(3)} ` +
        `· lỗi ${String(report.staged.error).padStart(3)} → ghi ${String(report.committed).padStart(3)}` +
        (report.failed ? ` (hỏng ${report.failed})` : "") +
        (report.parseError ? ` ⚠ ${report.parseError}` : "");
      process.stdout.write(`\n${reports.map(line).join("\n")}\n`);

      const totals = reports.reduce(
        (acc, report) => ({
          parsed: acc.parsed + report.parsed,
          error: acc.error + report.staged.error,
          committed: acc.committed + report.committed,
          created: acc.created + report.created,
          merged: acc.merged + report.merged,
          enrollmentCreated: acc.enrollmentCreated + report.enrollmentCreated,
          duplicateConfirmed: acc.duplicateConfirmed + report.duplicateConfirmed,
          failed: acc.failed + report.failed,
        }),
        {
          parsed: 0,
          error: 0,
          committed: 0,
          created: 0,
          merged: 0,
          enrollmentCreated: 0,
          duplicateConfirmed: 0,
          failed: 0,
        },
      );
      process.stdout.write(
        `\nTỔNG: parse ${totals.parsed} · lỗi dữ liệu nguồn ${totals.error} · ghi được ${totals.committed} · hỏng khi ghi ${totals.failed}\n`,
      );

      // Không dòng nào được chết trong lúc ghi: lỗi phải bị chặn từ bước dựng
      // dòng, không phải từ constraint DB.
      expect(totals.failed).toBe(0);
      expect(totals.committed).toBeGreaterThan(200);
      expect(provedPendingGuard).toBe(true);
      expect(totals.created + totals.merged).toBe(totals.committed);

      // Dữ liệu thật sự nằm trong bảng nghiệp vụ, có ghi danh đúng năm học.
      const { count: studentCount } = await user
        .from("students")
        .select("id", { count: "exact", head: true });
      const { count: enrollmentCount } = await user
        .from("enrollments")
        .select("id", { count: "exact", head: true })
        .eq("academic_year_id", yearId)
        .eq("status", "active");
      process.stdout.write(
        `Sau import: ${studentCount} thiếu nhi, ${enrollmentCount} ghi danh đang mở.\n`,
      );
      // Merge tái sử dụng hồ sơ và D-11 có thể giữ ghi danh đang mở. Đếm theo
      // tác động thật của RPC, không đồng nhất "committed row" với "new row".
      expect(studentCount).toBe(baselineStudentCount + totals.created);
      expect(enrollmentCount).toBe(baselineEnrollmentCount + totals.enrollmentCreated);

      // Tiếng Việt có dấu phải còn nguyên sau khi qua Excel → JSON → Postgres.
      const { data: sample } = await user
        .from("students")
        .select("full_name")
        .ilike("full_name", "%ễ%")
        .limit(1);
      expect(sample?.length ?? 0).toBeGreaterThan(0);
    },
  );
});
