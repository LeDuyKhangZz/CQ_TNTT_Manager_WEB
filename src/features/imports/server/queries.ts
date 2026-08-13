import "server-only";

import { createClient } from "@/lib/supabase/server";
import { classAliasKey } from "../normalize";
import type { ClassLookup } from "../build-row";
import {
  BATCH_PAGE_SIZE,
  BATCH_ROW_PAGE_SIZE,
  clampPage,
  type BatchListCriteria,
  type BatchRowCriteria,
} from "../batch-directory";
import { commitErrorText } from "../commit-errors";
import type { ExistingStudent } from "../dedup";
import type { BatchReportRow } from "../export";
import { DUPLICATE_PENDING_FIELD } from "../row-decision";
import { requireImportAccess } from "./permissions";

export interface CurrentYear {
  id: string;
  code: string;
  name: string;
}

/** The academic year an import targets. Imports always land in the current year. */
export async function getCurrentAcademicYear(): Promise<CurrentYear | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("academic_years")
    .select("id, code, name")
    .eq("status", "current")
    .maybeSingle();
  return data ?? null;
}

/**
 * Build the class-alias lookup for a year. Keys come from
 * {@link classAliasKey} so "ẤU 3A", "Au 3 A" and "Ấu 3A" all resolve.
 */
export async function getClassLookup(academicYearId: string): Promise<ClassLookup> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("classes")
    .select("id, display_name")
    .eq("academic_year_id", academicYearId)
    .eq("status", "active");

  const lookup = new Map<string, string>();
  for (const row of data ?? []) {
    lookup.set(classAliasKey(row.display_name), row.id);
  }
  return lookup;
}

/** Hồ sơ đã có, kèm trạng thái — trạng thái quyết định "Ghép" có chạy được không. */
export interface ImportExistingStudent extends ExistingStudent {
  /** `students.status`: `active` · `temporarily_inactive` · `withdrawn` · `archived`. */
  status: string;
}

/**
 * Students already on file, used for duplicate warnings. Scoped to what the
 * importing user may read; the global-write roles that can import see all.
 *
 * 🔴 **M12-A bỏ bộ lọc `status = 'active'` (TO-BE 2 bước 3 / AC-20).** Bộ lọc cũ
 * làm đúng một việc: giấu mất **em đã nghỉ nay quay lại** khỏi phép dò trùng, nên
 * đường nhập Excel tạo cho em ấy một hồ sơ thứ hai với một mã `CQxxxx` mới —
 * đúng loại trùng tệ nhất, vì lịch sử bí tích và sức khoẻ nằm lại ở hồ sơ cũ.
 *
 * Trạng thái đi kèm thay vì bị lọc bỏ, vì nó đổi **cách xử lý** chứ không đổi
 * **việc có cảnh báo hay không**: ghép vào một hồ sơ đã rút sẽ bị trigger
 * `enrollments_need_active_student` (M03-C) từ chối, nên người duyệt phải biết
 * để đi khôi phục hồ sơ trước — xem `row-decision.ts`.
 */
export async function getExistingStudents(): Promise<ImportExistingStudent[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("students")
    .select("id, student_code, full_name, date_of_birth, status, guardians(phone)");

  return (data ?? []).map((row) => {
    const guardian = row.guardians as { phone: string } | { phone: string }[] | null;
    const phone = Array.isArray(guardian) ? (guardian[0]?.phone ?? null) : (guardian?.phone ?? null);
    return {
      id: row.id,
      studentCode: row.student_code,
      fullName: row.full_name,
      dateOfBirth: row.date_of_birth,
      status: row.status,
      guardianPhone: phone,
    };
  });
}

export interface ClassOption {
  id: string;
  displayName: string;
}

/** Active classes of the current year, for the upload-time class selector. */
export async function listClassOptions(academicYearId: string): Promise<ClassOption[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("classes")
    .select("id, display_name")
    .eq("academic_year_id", academicYearId)
    .eq("status", "active")
    .order("display_name");
  return (data ?? []).map((row) => ({ id: row.id, displayName: row.display_name }));
}

export interface BatchSummary {
  id: string;
  filename: string;
  sourceFormat: string;
  status: string;
  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  committedRows: number;
  createdAt: string;
  /** D-131 — lần nhập đã huỷ vẫn ở lại danh sách, nên phải nói rõ huỷ lúc nào. */
  cancelledAt: string | null;
  /** D-132 — đã xoá dữ liệu thô thì nút đó không được mời bấm lần nữa. */
  rawPurgedAt: string | null;
  /**
   * M12-B / TO-BE 7 — **ai tải file này lên**. Bốn vai trò nhập được đều nằm
   * trong `app.can_global_read()` nên đọc được `profiles` của nhau; tài khoản đã
   * xoá để lại `uploaded_by = null` (`on delete set null`) ⇒ `null` là chuyện
   * bình thường, không phải lỗi, và màn hình phải nói ra chứ không in dấu gạch.
   */
  uploaderName: string | null;
}

const BATCH_COLUMNS =
  "id, filename, source_format, status, total_rows, valid_rows, warning_rows, error_rows, committed_rows, created_at, cancelled_at, raw_purged_at";

/** Kèm tên người tải lên. Tách riêng vì chỉ danh sách và đầu trang chi tiết cần. */
const BATCH_COLUMNS_WITH_UPLOADER = `${BATCH_COLUMNS}, uploader:profiles!import_batches_uploaded_by_fkey(display_name)`;

interface BatchRowShape {
  id: string;
  filename: string;
  source_format: string;
  status: string;
  total_rows: number;
  valid_rows: number;
  warning_rows: number;
  error_rows: number;
  committed_rows: number;
  created_at: string;
  cancelled_at: string | null;
  raw_purged_at: string | null;
  uploader?: { display_name: string } | { display_name: string }[] | null;
}

function toBatchSummary(row: BatchRowShape): BatchSummary {
  const uploader = row.uploader;
  return {
    id: row.id,
    filename: row.filename,
    sourceFormat: row.source_format,
    status: row.status,
    totalRows: row.total_rows,
    validRows: row.valid_rows,
    warningRows: row.warning_rows,
    errorRows: row.error_rows,
    committedRows: row.committed_rows,
    createdAt: row.created_at,
    cancelledAt: row.cancelled_at,
    rawPurgedAt: row.raw_purged_at,
    uploaderName: Array.isArray(uploader)
      ? (uploader[0]?.display_name ?? null)
      : (uploader?.display_name ?? null),
  };
}

export interface BatchListPage {
  batches: BatchSummary[];
  /** Tổng số lần nhập **khớp bộ lọc**, không phải tổng toàn hệ thống. */
  totalItems: number;
  page: number;
  pageSize: number;
}

/**
 * Danh sách lần nhập — M12-B, **TO-BE 7**.
 *
 * 🔴 Bản cũ là `.limit(20)` viết cứng, không lọc, không sang trang được: lần nhập
 * thứ 21 trở đi **không có đường nào mở ra xem**, kể cả khi biết chắc nó tồn tại.
 * Mà đây là màn hình duy nhất tra được "ai từng tải file gì lên" sau khi D-131
 * biến "xoá" thành "đánh dấu" — càng dùng lâu thì càng nhiều lần nhập nằm ngoài
 * tầm với.
 *
 * Mặc định lọc theo **năm học hiện hành** (D-135). Đếm trước rồi mới lấy trang,
 * đúng khuôn `getStudentsPageData` của M03-B: có tổng số mới kéo được số trang
 * vượt quá về trang cuối thay vì trả một trang trống không giải thích.
 */
export async function listBatches(
  criteria: BatchListCriteria,
  currentYearId: string | null,
): Promise<BatchListPage> {
  await requireImportAccess();
  const supabase = await createClient();

  // `current` mà chưa có năm học hiện hành thì không lọc theo năm — trang đã có
  // sẵn trạng thái rỗng nói đúng chuyện đó, không cần lọc ra một tập rỗng thứ hai.
  const yearId =
    criteria.yearId === "all"
      ? null
      : criteria.yearId === "current"
        ? currentYearId
        : criteria.yearId;

  let countQuery = supabase.from("import_batches").select("id", { count: "exact", head: true });
  if (yearId) countQuery = countQuery.eq("academic_year_id", yearId);
  if (criteria.status !== "all") countQuery = countQuery.eq("status", criteria.status);

  const { count } = await countQuery;
  const totalItems = count ?? 0;
  const page = clampPage(criteria.page, totalItems, BATCH_PAGE_SIZE);
  const from = (page - 1) * BATCH_PAGE_SIZE;

  let pageQuery = supabase.from("import_batches").select(BATCH_COLUMNS_WITH_UPLOADER);
  if (yearId) pageQuery = pageQuery.eq("academic_year_id", yearId);
  if (criteria.status !== "all") pageQuery = pageQuery.eq("status", criteria.status);

  const { data } = await pageQuery
    .order("created_at", { ascending: false })
    .range(from, from + BATCH_PAGE_SIZE - 1);

  return {
    batches: ((data ?? []) as unknown as BatchRowShape[]).map(toBatchSummary),
    totalItems,
    page,
    pageSize: BATCH_PAGE_SIZE,
  };
}

export interface BatchReport {
  filename: string;
  rows: BatchReportRow[];
}

/** Bao nhiêu dòng lấy về mỗi lượt khi dựng file báo cáo. */
const REPORT_FETCH_SIZE = 500;

/**
 * ⚠️ Vòng lặp có trần: 40 lượt × 500 = 20.000 dòng, gấp 20 lần trần D-138.
 * Không phải để phục vụ file 20.000 dòng — mà để một lỗi lập trình sau này
 * không biến vòng lặp này thành vòng lặp vô tận trên máy chủ.
 */
const REPORT_MAX_FETCHES = 40;

interface ReportRowShape {
  row_number: number;
  status: string;
  action: string;
  normalized_json: unknown;
  errors_json: unknown;
  warnings_json: unknown;
  matched_student_id: string | null;
  created_student_id: string | null;
}

/**
 * 🔴 **Dòng ghi hỏng mang `sqlerrm` NGUYÊN VĂN trong `errors_json`**, vì hàm
 * `commit_import_rows` ghi cả `commit_error` lẫn một mục `{field:'commit'}` vào
 * mảng lỗi của dòng. Màn hình đã dịch nó qua `commitErrorText` từ M12-A; nếu
 * file xuất ra không dịch thì **SEC-16 mở lại ở một cửa thứ hai** — và cửa này
 * còn tệ hơn màn hình vì tệp đi ra ngoài hệ thống, tới tay Giáo lý viên lớp.
 */
function issueText(issue: { field?: unknown; message?: unknown }): string {
  const message = typeof issue.message === "string" ? issue.message : "";
  if (issue.field === "commit") return commitErrorText(message) ?? message;
  return message;
}

function toIssueTexts(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((issue) => issueText((issue ?? {}) as { field?: unknown; message?: unknown }))
    .filter((text) => text !== "");
}

/**
 * Dữ liệu cho file lỗi/kết quả — M12-C, **TO-BE 5 / AC-22 / BR-M12-38**.
 *
 * Lấy **toàn bộ** dòng của lần nhập, không phân trang theo màn hình: một file
 * báo cáo thiếu dòng còn tệ hơn không có file, vì người nhận không có cách nào
 * biết là nó thiếu. Vì thế lấy theo lô cho tới khi hết, thay vì một `range`
 * duy nhất — trần `max-rows` của PostgREST cắt im lặng ở đúng loại truy vấn này.
 */
export async function getBatchReport(batchId: string): Promise<BatchReport | null> {
  await requireImportAccess();
  const supabase = await createClient();

  const { data: batch } = await supabase
    .from("import_batches")
    .select("id, filename")
    .eq("id", batchId)
    .maybeSingle();
  if (!batch) return null;

  const raw: ReportRowShape[] = [];
  for (let fetch = 0; fetch < REPORT_MAX_FETCHES; fetch += 1) {
    const from = fetch * REPORT_FETCH_SIZE;
    const { data } = await supabase
      .from("import_rows")
      .select(
        "row_number, status, action, normalized_json, errors_json, warnings_json, matched_student_id, created_student_id",
      )
      .eq("batch_id", batchId)
      .order("row_number")
      .range(from, from + REPORT_FETCH_SIZE - 1);
    const chunk = (data ?? []) as unknown as ReportRowShape[];
    raw.push(...chunk);
    if (chunk.length < REPORT_FETCH_SIZE) break;
  }

  // 🔴 Mã thiếu nhi của dòng ĐÃ GHÉP không nằm ở `created_student_id`: hàm RPC
  // cố ý để null ở đó cho dòng `merge` (nó không *tạo* ra em nào). Chỉ đọc cột
  // ấy thì `docs/09` §7 mất đúng nửa số dòng — mà dòng ghép mới là dòng người
  // duyệt cần tra ngược nhất.
  const studentIdOf = (row: ReportRowShape): string | null =>
    row.created_student_id ?? (row.action === "merge" ? row.matched_student_id : null);

  const wantedIds = Array.from(
    new Set(
      raw
        .filter((row) => row.status === "committed")
        .map(studentIdOf)
        .filter((id): id is string => id !== null),
    ),
  );

  const codeById = new Map<string, string>();
  if (wantedIds.length > 0) {
    const { data: students } = await supabase
      .from("students")
      .select("id, student_code")
      .in("id", wantedIds);
    for (const student of students ?? []) codeById.set(student.id, student.student_code);
  }

  return {
    filename: batch.filename,
    rows: raw.map((row) => {
      const normalized = (row.normalized_json ?? {}) as Record<string, unknown>;
      const studentId = studentIdOf(row);
      return {
        rowNumber: row.row_number,
        fullName: String(normalized.full_name ?? ""),
        className: (normalized.class_label as string | null) ?? null,
        status: row.status,
        errors: toIssueTexts(row.errors_json),
        warnings: toIssueTexts(row.warnings_json),
        studentCode:
          row.status === "committed" && studentId ? (codeById.get(studentId) ?? null) : null,
      };
    }),
  };
}

export interface ImportYearOption {
  id: string;
  code: string;
  name: string;
}

/** Các năm học có thể lọc. Ít dòng (một năm một hàng) nên lấy hết, không phân trang. */
export async function listImportYears(): Promise<ImportYearOption[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("academic_years")
    .select("id, code, name")
    .order("code", { ascending: false });
  return (data ?? []).map((row) => ({ id: row.id, code: row.code, name: row.name }));
}

/** Hồ sơ đối chiếu của một dòng nghi trùng — AC-18 đòi **mở ra xem được**. */
export interface MatchedStudent {
  id: string;
  studentCode: string;
  fullName: string;
  dateOfBirth: string;
  status: string;
  guardianPhone: string | null;
}

export interface BatchRow {
  id: string;
  rowNumber: number;
  status: string;
  action: string;
  fullName: string;
  className: string | null;
  errors: { field: string; message: string }[];
  warnings: { field: string; message: string }[];
  matchedStudentId: string | null;
  /** Đủ dữ liệu để người duyệt **đối chiếu tại chỗ**, không phải mở tab khác đoán. */
  matchedStudent: MatchedStudent | null;
  commitError: string | null;
  /** Null when the sheet had no gender column; the reviewer must choose one. */
  gender: string | null;
}

/**
 * Những con số **không** suy ra được từ trang dòng đang xem — M12-B.
 *
 * 🔴 Đây là cái bẫy của việc thêm phân trang, và nó im lặng: trước đợt này trang
 * chi tiết đếm `batch.rows.filter(…)` trên **toàn bộ** dòng để ra "Ghi N dòng" và
 * danh sách dòng nghi trùng chưa xác nhận. Cắt trang xong mà giữ nguyên phép đếm
 * ấy thì nút "Ghi" của một lần nhập 900 dòng sẽ ghi *"Ghi 50 dòng"* — một con số
 * sai mà không có gì báo là sai. Nên ba con số dưới đây đếm **trong cơ sở dữ
 * liệu**, độc lập với trang đang xem.
 */
export interface BatchTotals {
  /** Dòng còn chờ ghi (`valid` + `warning`) trong cả lần nhập. */
  pendingRows: number;
  /** Dòng nghi trùng chắc chắn chưa được xác nhận (D-133) — kèm tối đa 5 số dòng. */
  undecidedCount: number;
  undecidedSample: number[];
  /** Dòng "Tạo mới" còn thiếu giới tính (83% dòng của sổ SYLL) — kèm 5 số dòng. */
  missingGenderCount: number;
  missingGenderSample: number[];
}

export interface BatchDetail extends BatchSummary, BatchTotals {
  /** Dòng của **trang đang xem**, đã lọc theo trạng thái. */
  rows: BatchRow[];
  /** Tổng số dòng khớp bộ lọc — dùng cho phân trang, khác `totalRows` của lần nhập. */
  filteredRows: number;
  page: number;
  pageSize: number;
}

/**
 * Chi tiết một lần nhập, **một trang dòng** — M12-B, TO-BE 7 / AC-25.
 *
 * Hai phép đếm dùng `contains` trên `warnings_json` (`@>` của jsonb): cảnh báo
 * mang trường `duplicate_pending` là dấu "chưa quyết định" của D-133, còn cảnh
 * báo mang trường `gender` là dấu "chưa chọn giới tính" — cả hai đều được gỡ
 * đúng lúc người dùng quyết (xem `row-decision.ts` và `saveRowEdits`), nên đếm
 * theo chúng cho ra đúng con số mà `commitBatch` sẽ chặn. Đếm bằng cách kéo cả
 * 900 dòng về Node rồi lọc là thứ chính đợt này sinh ra để bỏ.
 *
 * 🔴 **Tham số của `contains` phải là CHUỖI JSON, không phải mảng JavaScript.**
 * Đưa vào một mảng thì supabase-js hiểu đó là mảng kiểu Postgres và sinh ra
 * `cs.{[object Object]}`, PostgREST trả lỗi *"invalid input syntax for type
 * json"* — mà lỗi ấy **không ném ra**: nó nằm trong `error` của kết quả, còn
 * `count` là `null` và `count ?? 0` biến nó thành **số 0 trông rất hợp lý**. Bản
 * đầu của đợt này viết đúng như vậy và màn hình lặng lẽ báo "không còn dòng nào
 * thiếu giới tính" cho một lần nhập thiếu cả ba dòng. Bài E2E bắt được ngay lượt
 * chạy đầu; không có nó thì lỗi này đi thẳng vào sản phẩm.
 */
const containsField = (field: string) => JSON.stringify([{ field }]);

export async function getBatchDetail(
  batchId: string,
  criteria: BatchRowCriteria,
): Promise<BatchDetail | null> {
  await requireImportAccess();
  const supabase = await createClient();
  const { data: batch } = await supabase
    .from("import_batches")
    .select(BATCH_COLUMNS_WITH_UPLOADER)
    .eq("id", batchId)
    .maybeSingle();
  if (!batch) return null;

  const PENDING_STATUSES = ["valid", "warning"] as const;

  // Hai dải cảnh báo chỉ có nghĩa với lần nhập **còn ghi được**: lần nhập đã huỷ
  // thì `commit_import_rows` từ chối ngay dòng đầu (D-131), nên nói "còn 3 dòng
  // chưa chọn giới tính" ở đó vừa là nhiễu vừa là mời làm một việc vô ích. Bỏ
  // hẳn hai truy vấn ấy cũng làm nhẹ đúng lượt dựng lại trang **ngay sau khi
  // bấm Huỷ** — lượt nặng nhất của trang này.
  const countsApply = batch.status !== "cancelled";
  const emptyCount = { count: 0, data: [] as { row_number: number }[] };

  const [pending, undecided, missingGender, filtered] = await Promise.all([
    supabase
      .from("import_rows")
      .select("id", { count: "exact", head: true })
      .eq("batch_id", batchId)
      .in("status", PENDING_STATUSES),
    countsApply
      ? supabase
          .from("import_rows")
          .select("row_number", { count: "exact" })
          .eq("batch_id", batchId)
          .in("status", PENDING_STATUSES)
          .contains("warnings_json", containsField(DUPLICATE_PENDING_FIELD))
          .order("row_number")
          .limit(5)
      : emptyCount,
    countsApply
      ? supabase
          .from("import_rows")
          .select("row_number", { count: "exact" })
          .eq("batch_id", batchId)
          .in("status", PENDING_STATUSES)
          .eq("action", "create")
          .contains("warnings_json", containsField("gender"))
          .order("row_number")
          .limit(5)
      : emptyCount,
    (() => {
      const query = supabase
        .from("import_rows")
        .select("id", { count: "exact", head: true })
        .eq("batch_id", batchId);
      return criteria.status === "all" ? query : query.eq("status", criteria.status);
    })(),
  ]);

  const filteredRows = filtered.count ?? 0;
  const page = clampPage(criteria.page, filteredRows, BATCH_ROW_PAGE_SIZE);
  const from = (page - 1) * BATCH_ROW_PAGE_SIZE;

  let rowsQuery = supabase
    .from("import_rows")
    .select(
      "id, row_number, status, action, normalized_json, errors_json, warnings_json, matched_student_id, commit_error",
    )
    .eq("batch_id", batchId);
  if (criteria.status !== "all") rowsQuery = rowsQuery.eq("status", criteria.status);

  const { data: rows } = await rowsQuery
    .order("row_number")
    .range(from, from + BATCH_ROW_PAGE_SIZE - 1);

  // Một truy vấn cho toàn bộ hồ sơ đối chiếu của lần nhập, không phải một truy
  // vấn mỗi dòng: một sổ lớp 300 dòng thì cách kia là 300 lượt đi về.
  const matchedIds = Array.from(
    new Set((rows ?? []).map((row) => row.matched_student_id).filter((id): id is string => !!id)),
  );
  const matched = new Map<string, MatchedStudent>();
  if (matchedIds.length > 0) {
    const { data: students } = await supabase
      .from("students")
      .select("id, student_code, full_name, date_of_birth, status, guardians(phone)")
      .in("id", matchedIds);
    for (const student of students ?? []) {
      const guardian = student.guardians as { phone: string } | { phone: string }[] | null;
      matched.set(student.id, {
        id: student.id,
        studentCode: student.student_code,
        fullName: student.full_name,
        dateOfBirth: student.date_of_birth,
        status: student.status,
        guardianPhone: Array.isArray(guardian)
          ? (guardian[0]?.phone ?? null)
          : (guardian?.phone ?? null),
      });
    }
  }

  return {
    ...toBatchSummary(batch as unknown as BatchRowShape),
    pendingRows: pending.count ?? 0,
    undecidedCount: undecided.count ?? 0,
    undecidedSample: (undecided.data ?? []).map((row) => row.row_number),
    missingGenderCount: missingGender.count ?? 0,
    missingGenderSample: (missingGender.data ?? []).map((row) => row.row_number),
    filteredRows,
    page,
    pageSize: BATCH_ROW_PAGE_SIZE,
    rows: (rows ?? []).map((row) => {
      const normalized = (row.normalized_json ?? {}) as Record<string, unknown>;
      return {
        id: row.id,
        rowNumber: row.row_number,
        status: row.status,
        action: row.action,
        fullName: String(normalized.full_name ?? ""),
        className: (normalized.class_label as string | null) ?? null,
        errors: (row.errors_json ?? []) as { field: string; message: string }[],
        warnings: (row.warnings_json ?? []) as { field: string; message: string }[],
        matchedStudentId: row.matched_student_id,
        matchedStudent: row.matched_student_id
          ? (matched.get(row.matched_student_id) ?? null)
          : null,
        commitError: row.commit_error,
        gender: (normalized.gender as string | null) ?? null,
      };
    }),
  };
}
