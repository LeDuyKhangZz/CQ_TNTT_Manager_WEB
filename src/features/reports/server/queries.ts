import "server-only";

import { requireRouteAccess } from "@/lib/auth/guards";
import type { AuthContext } from "@/lib/auth/types";
import { createClient } from "@/lib/supabase/server";
import {
  defaultReportScope,
  REPORT_TYPE_LABELS,
  reportScopeLabel,
  resolveReportRange,
  type ReportEmptyReason,
  type ReportFilter,
  type ReportScope,
  type ReportType,
} from "../filters";
import {
  snapshotPageRange,
  SNAPSHOT_PAGE_SIZE,
  type SnapshotCriteria,
} from "../snapshot-directory";

export interface ReportRow {
  classId: string;
  className: string;
  sectorId: string | null;
  values: Array<string | number | null>;
}

export interface ReportScopeOption {
  id: string;
  name: string;
  sectorId?: string | null;
}

export interface ReportResult {
  filter: ReportFilter;
  academicYear: { id: string; code: string; startDate: string; endDate: string } | null;
  title: string;
  from: string;
  to: string;
  headers: string[];
  rows: ReportRow[];
  /** Vì sao bảng trống. Chỉ có nghĩa khi `rows` rỗng. */
  reason: ReportEmptyReason;
  /** Ngành/lớp **trong phạm vi người xem** — dropdown không được mời chọn thứ họ không xem được. */
  sectors: ReportScopeOption[];
  classes: ReportScopeOption[];
  availableScopeTypes: ReportScope[];
}

export interface ReportSnapshotRow {
  id: string;
  title: string;
  reportType: string;
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  checksum: string;
}

/**
 * Bản chốt trùng gần nhất của **đúng** bộ lọc đang xem (D-172).
 *
 * `null` nghĩa là chưa có bản nào — không phải "không tra được". Hai chuyện ấy
 * khác nhau và người bấm "Chốt" cần phân biệt được, nên hàm cơ sở dữ liệu chỉ
 * trả rỗng khi người gọi **vốn đã** không đọc được bản chốt phạm vi đó, mà
 * người không đọc được phạm vi đó thì cũng không chốt được ở đó.
 */
export interface DuplicateSnapshot {
  id: string;
  generatedAt: string;
  /** `null` khi hồ sơ người chốt đã bị xoá — cảnh báo vẫn phải hiện. */
  generatedByName: string | null;
  /** Tổng số bản trùng, không phải 1: "đã có 3 bản" là một câu khác hẳn. */
  count: number;
}

export interface ReportsPageData extends ReportResult {
  snapshots: ReportSnapshotRow[];
  /** D-172: có bản chốt trùng chưa, để hộp xác nhận nói ra ngày và tên người chốt. */
  duplicate: DuplicateSnapshot | null;
  /** Tên phạm vi đang xem, viết ra bằng chữ cho hộp xác nhận và dòng tóm tắt. */
  scopeLabel: string;
  /** Chốt được ĐÚNG phạm vi đang chọn. */
  canSnapshot: boolean;
  /**
   * Chốt được ở **bất kỳ** phạm vi nào của mình. Hai câu hỏi khác nhau và cần
   * hai cách hiển thị khác nhau: vai trò không bao giờ chốt được (Cha sở · Cha
   * phó · Thủ quỹ) thì **không thấy nút** (`06_MODULE_UI_REDESIGN_PLAN` §M11),
   * còn người chốt được nhưng đang đứng ở phạm vi rộng hơn phần mình phụ trách
   * thì thấy nút **vô hiệu kèm lời giải thích** (TB-05 bước 3) — ẩn nút với họ
   * là giấu mất chính chức năng họ vào trang để dùng.
   */
  canSnapshotAnyScope: boolean;
}

const ATTENDANCE_HEADERS = [
  "Lớp",
  "Sĩ số có điểm danh",
  "Số buổi đã chốt",
  "Tỷ lệ dự lễ",
  "Tỷ lệ học giáo lý",
  "Lượt vắng lễ",
  "Lượt vắng giáo lý",
];
const RESULTS_HEADERS = ["Lớp", "Sĩ số có điểm", "Trung bình lớp", "Dưới 5", "Từ 8 trở lên"];

function ratioToPercent(value: number | null): string {
  return value === null ? "—" : `${Math.round(value * 1000) / 10}%`;
}

/**
 * Guard của module (D-96, nợ #14). Gọi ở **mọi** cửa vào — trang, route tải file
 * và Server Action — và luôn **ngoài `try`** để `catch` không nuốt `redirect()`
 * của Next: người hết phiên đăng nhập phải được đưa về `/login`, không phải đọc
 * một câu lỗi nghiệp vụ vô nghĩa.
 */
export async function reportsRouteContext(): Promise<AuthContext> {
  return requireRouteAccess("/reports");
}

/**
 * Ngành/lớp mà người đang đăng nhập được phép **chọn** trong bộ lọc (TB-04 bước 1).
 *
 * Bản cũ đổ thẳng toàn bộ 19 lớp cho mọi vai trò, kể cả Giáo lý viên chỉ có một
 * lớp (`03_AUDIT_RESULTS` tiêu chí 5). Hậu quả không phải thẩm mỹ: chọn một lớp
 * ngoài phạm vi cho ra một bảng trống **giống hệt** bảng trống của lớp mình khi
 * chưa có dữ liệu, nên không có cách nào phân biệt.
 */
async function loadScopeOptions(context: AuthContext, academicYearId: string | null): Promise<{
  sectors: ReportScopeOption[];
  classes: ReportScopeOption[];
  availableScopeTypes: ReportScope[];
}> {
  const supabase = await createClient();
  const [{ data: sectorData }, { data: classData }] = await Promise.all([
    supabase.from("sectors").select("id, name").order("sort_order"),
    academicYearId
      ? supabase
        .from("classes")
        .select("id, display_name, grade_levels(sector_id)")
        .eq("academic_year_id", academicYearId)
        .eq("status", "active")
        .order("display_name")
      : Promise.resolve({ data: [] as never[] }),
  ]);

  const allSectors: ReportScopeOption[] = (sectorData ?? []).map((item) => ({ id: item.id, name: item.name }));
  const allClasses: ReportScopeOption[] = (classData ?? []).map((item) => ({
    id: item.id,
    name: item.display_name,
    sectorId: item.grade_levels?.sector_id ?? null,
  }));

  if (context.scopeKind === "sector" && context.sectorId) {
    const sectorId = context.sectorId;
    return {
      sectors: allSectors.filter((sector) => sector.id === sectorId),
      classes: allClasses.filter((item) => item.sectorId === sectorId),
      availableScopeTypes: ["global", "sector", "class"],
    };
  }
  if (context.scopeKind === "class" && context.classId) {
    const classId = context.classId;
    return {
      // Không mời chọn "Theo ngành": Giáo lý viên lớp không chốt được ở mức
      // ngành, nên một ô chọn chỉ dẫn tới nút vô hiệu là một ngõ cụt.
      sectors: [],
      classes: allClasses.filter((item) => item.id === classId),
      availableScopeTypes: ["global", "class"],
    };
  }
  return { sectors: allSectors, classes: allClasses, availableScopeTypes: ["global", "sector", "class"] };
}

/**
 * Nguồn duy nhất của bản xem trước, file Excel/PDF và payload snapshot.
 * Không tách thành ba đường tính khác nhau — đó là cách nhanh nhất để file tải
 * về lệch với thứ người dùng vừa nhìn thấy (D-52).
 *
 * Nhận `context` làm tham số thay vì tự gọi guard: bản cũ khiến
 * `getReportsPageData` chạy `requireRouteAccess("/reports")` **hai lần** cho một
 * lượt dựng trang (N-1 / F06 của `07_IMPLEMENTATION_IMPACT`).
 */
export async function buildReport(filter: ReportFilter, context: AuthContext): Promise<ReportResult> {
  const supabase = await createClient();
  const { data: year } = await supabase
    .from("academic_years")
    .select("id, code, start_date, end_date")
    .eq("status", "current")
    .maybeSingle();

  const headers = filter.reportType === "attendance" ? ATTENDANCE_HEADERS : RESULTS_HEADERS;

  if (!year) {
    const emptyScope = await loadScopeOptions(context, null);
    return {
      filter,
      academicYear: null,
      title: REPORT_TYPE_LABELS[filter.reportType],
      from: filter.anchorDate,
      to: filter.anchorDate,
      headers,
      rows: [],
      reason: "empty",
      ...emptyScope,
    };
  }

  const academicYear = {
    id: year.id,
    code: year.code,
    startDate: year.start_date,
    endDate: year.end_date,
  };
  const { from, to } = resolveReportRange(filter, academicYear);
  const scope = await loadScopeOptions(context, academicYear.id);

  // Xác thực phạm vi TRƯỚC khi truy vấn (`03_AUDIT_RESULTS` §4.4: bước này chưa
  // từng tồn tại). Không có nó thì "ngoài phạm vi" và "chưa có dữ liệu" ra cùng
  // một bảng trống.
  const outOfScope =
    (filter.scopeType === "sector" && !scope.sectors.some((item) => item.id === filter.scopeId))
    || (filter.scopeType === "class" && !scope.classes.some((item) => item.id === filter.scopeId));
  if (outOfScope) {
    return {
      filter, academicYear, title: REPORT_TYPE_LABELS[filter.reportType],
      from, to, headers, rows: [], reason: "out_of_scope", ...scope,
    };
  }

  // Tập lớp mà bộ lọc đang trỏ vào. Dùng cho câu hỏi "vì sao trống" bên dưới:
  // hỏi cả xứ đoàn rồi trả lời cho một ngành là một câu trả lời sai có thể xảy
  // ra thật — ngành A trống trong khi ngành B còn buổi chưa chốt.
  const scopedClassIds = filter.scopeType === "class" && filter.scopeId
    ? [filter.scopeId]
    : filter.scopeType === "sector"
      ? scope.classes.filter((item) => item.sectorId === filter.scopeId).map((item) => item.id)
      : null;

  // 🔴 D-170 — Thủ quỹ đi qua CỬA SỔ HẸP, không đi qua hai RPC thường.
  //
  // `app.can_global_read()` liệt kê cứng sáu vai trò và **không có Thủ quỹ**
  // (`20260715000100:164`), nên hai RPC `security invoker` bên dưới trả về đúng
  // 0 dòng cho họ — đã đo trên cơ sở dữ liệu thật, không suy đoán. Trong khi đó
  // tầng ứng dụng lại xếp họ vào `GLOBAL_ROLES` và mời họ vào `/reports`. Đó là
  // toàn bộ nội dung của `03_AUDIT_RESULTS` §4.2: *"bị cấm toàn bộ ở cơ sở dữ
  // liệu nhưng được mời vào ở giao diện"*.
  //
  // Hai hàm `_for_treasurer` trả về **đúng kiểu** của hai hàm gốc và gọi thẳng
  // vào chúng, nên không có đường tính thứ hai để lệch (D-52).
  const viaTreasurerWindow = context.role === "treasurer";

  let rows: ReportRow[] = [];
  if (filter.reportType === "attendance") {
    const { data } = viaTreasurerWindow
      ? await supabase.rpc("report_attendance_rows_for_treasurer", {
        p_academic_year_id: academicYear.id,
        p_from: from,
        p_to: to,
      })
      : await supabase.rpc("report_attendance_rows", {
        p_academic_year_id: academicYear.id,
        p_from: from,
        p_to: to,
      });
    rows = (data ?? []).map((row) => ({
      classId: row.class_id,
      className: row.class_name,
      sectorId: row.sector_id,
      values: [
        row.student_count,
        row.session_count,
        ratioToPercent(row.mass_present_rate),
        ratioToPercent(row.catechism_present_rate),
        row.mass_absent_count,
        row.catechism_absent_count,
      ],
    }));
  } else {
    const { data } = viaTreasurerWindow
      ? await supabase.rpc("report_results_rows_for_treasurer", {
        p_academic_year_id: academicYear.id,
      })
      : await supabase.rpc("report_results_rows", {
        p_academic_year_id: academicYear.id,
      });
    rows = (data ?? []).map((row) => ({
      classId: row.class_id,
      className: row.class_name,
      sectorId: row.sector_id,
      values: [row.student_count, row.class_average, row.below_five_count, row.excellent_count],
    }));
  }

  // RLS đã giới hạn về phạm vi được phép; bộ lọc này chỉ thu hẹp thêm theo lựa
  // chọn của người dùng.
  const filtered = rows.filter((row) => {
    if (filter.scopeType === "class") return row.classId === filter.scopeId;
    if (filter.scopeType === "sector") return row.sectorId === filter.scopeId;
    return true;
  });

  return {
    filter,
    academicYear,
    title: REPORT_TYPE_LABELS[filter.reportType],
    from,
    to,
    headers,
    rows: filtered,
    reason: filtered.length > 0
      ? "empty"
      : await resolveEmptyReason(filter, academicYear.id, from, to, scopedClassIds),
    ...scope,
  };
}

/**
 * Phân biệt *"khoảng này chưa ai chốt buổi nào"* với *"khoảng này không có gì"*.
 * Chỉ chạy khi bảng đã trống nên không thêm truy vấn nào vào đường đi thường.
 *
 * `scopedClassIds = null` nghĩa là phạm vi toàn xứ đoàn (không lọc thêm); mảng
 * rỗng nghĩa là phạm vi đang chọn **không có lớp nào**, và khi ấy câu trả lời
 * chỉ có thể là "không có gì" — không được đi hỏi cơ sở dữ liệu rồi trả về câu
 * của một phạm vi khác.
 */
async function resolveEmptyReason(
  filter: ReportFilter,
  academicYearId: string,
  from: string,
  to: string,
  scopedClassIds: string[] | null,
): Promise<ReportEmptyReason> {
  if (filter.reportType !== "attendance") return "empty";
  if (scopedClassIds !== null && scopedClassIds.length === 0) return "empty";
  const supabase = await createClient();
  let query = supabase
    .from("attendance_sessions")
    .select("id", { count: "exact", head: true })
    .eq("academic_year_id", academicYearId)
    .is("finalized_at", null)
    .gte("attendance_date", from)
    .lte("attendance_date", to);
  if (scopedClassIds !== null) query = query.in("class_id", scopedClassIds);
  const { count } = await query;
  return (count ?? 0) > 0 ? "no_finalized_session" : "empty";
}

export async function getReportsPageData(
  filter: ReportFilter,
  context: AuthContext,
): Promise<ReportsPageData> {
  const report = await buildReport(filter, context);
  const supabase = await createClient();
  const ownScope = defaultReportScope(context);

  const [
    { data: snapshotData },
    { data: canSnapshot },
    { data: canSnapshotAnyScope },
    { data: duplicateRows },
  ] = await Promise.all([
    supabase
      .from("report_snapshots")
      .select("id, title, report_type, period_start, period_end, generated_at, checksum")
      .order("generated_at", { ascending: false })
      .limit(20),
    // 🔴 Nút "Chốt báo cáo" HỎI luật thay vì chép lại nó (D-66). Bản cũ chỉ loại
    // trừ Thủ quỹ (`queries.ts:182`), nên Trưởng ngành và Giáo lý viên lớp luôn
    // thấy một cái nút mà `app.can_create_report` chắc chắn từ chối — và vì
    // phạm vi mặc định là `global`, đó là trạng thái họ gặp ngay khi mở trang.
    // `?? undefined` chứ không `?? null`: phạm vi `global` không có id, và tham
    // số có mặc định ở cơ sở dữ liệu nên bỏ trống là đúng nghĩa "không truyền".
    supabase.rpc("can_finalize_report", {
      p_scope_type: filter.scopeType,
      p_scope_id: filter.scopeId ?? undefined,
    }),
    supabase.rpc("can_finalize_report", {
      p_scope_type: ownScope.scopeType,
      p_scope_id: ownScope.scopeId ?? undefined,
    }),
    // 🔴 D-172 — tra bản chốt trùng TRƯỚC khi hộp xác nhận mở ra, không phải sau
    // khi bấm. Bản chốt không sửa và không xoá được, nên câu "đã có rồi" chỉ có
    // giá trị khi nó tới **trước** thao tác không lùi được.
    //
    // Tên người chốt đi qua một cửa sổ hẹp chứ không nhúng `profiles`: RLS của
    // bảng ấy chỉ mở cho chính mình hoặc sáu vai trò cấp xứ đoàn, mà hai nhóm
    // chốt báo cáo nhiều nhất — Trưởng ngành và Giáo lý viên đại diện — không
    // nằm trong sáu. Nhúng thẳng là một ô `null` trong im lặng (bài học D-163).
    supabase.rpc("find_report_snapshot_duplicate", {
      p_report_type: filter.reportType,
      p_scope_type: filter.scopeType,
      p_period_start: report.from,
      p_period_end: report.to,
      p_scope_id: filter.scopeId ?? undefined,
    }),
  ]);

  const duplicateRow = (duplicateRows ?? [])[0];

  return {
    ...report,
    snapshots: (snapshotData ?? []).map((item): ReportSnapshotRow => ({
      id: item.id,
      title: item.title,
      reportType: item.report_type,
      periodStart: item.period_start,
      periodEnd: item.period_end,
      generatedAt: item.generated_at,
      checksum: item.checksum,
    })),
    canSnapshot: canSnapshot === true,
    canSnapshotAnyScope: canSnapshotAnyScope === true,
    duplicate: duplicateRow
      ? {
        id: duplicateRow.snapshot_id,
        generatedAt: duplicateRow.generated_at,
        generatedByName: duplicateRow.generated_by_name,
        count: duplicateRow.duplicate_count,
      }
      : null,
    scopeLabel: reportScopeLabel(filter, { sectors: report.sectors, classes: report.classes })
      ?? "phạm vi ngoài quyền xem của bạn",
  };
}

export interface ReportSnapshotListItem {
  id: string;
  title: string;
  reportType: ReportType;
  /** Phạm vi viết ra bằng chữ — AC-B10 đòi hai dòng cùng loại phải phân biệt được. */
  scopeLabel: string;
  academicYearCode: string | null;
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  generatedByName: string | null;
  checksum: string;
}

export interface SnapshotDirectoryData {
  items: ReportSnapshotListItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  years: Array<{ id: string; code: string }>;
}

/**
 * TB-06 — kho bản chốt có bộ lọc và phân trang.
 *
 * Danh sách vẫn đi qua **RLS** (`report_snapshots_select_scope`), không qua một
 * hàm `security definer` nào: policy đã là hàng rào đúng và đang được pgTAP
 * canh. Thứ duy nhất phải đi vòng là **tên người chốt** — xem ghi chú ở
 * `list_report_snapshot_actors`.
 */
export async function getSnapshotDirectoryData(
  criteria: SnapshotCriteria,
): Promise<SnapshotDirectoryData> {
  const supabase = await createClient();
  const { from, to } = snapshotPageRange(criteria.page);

  let query = supabase
    .from("report_snapshots")
    .select(
      "id, title, report_type, scope_type, scope_id, academic_year_id, period_start, period_end, generated_at, generated_by, checksum",
      { count: "exact" },
    )
    .order("generated_at", { ascending: false })
    .range(from, to);
  if (criteria.academicYearId) query = query.eq("academic_year_id", criteria.academicYearId);
  if (criteria.reportType) query = query.eq("report_type", criteria.reportType);
  if (criteria.scopeType) query = query.eq("scope_type", criteria.scopeType);

  const [
    { data: rows, count },
    { data: yearRows },
    { data: sectorRows },
    { data: classRows },
    { data: actorRows },
  ] = await Promise.all([
    query,
    supabase.from("academic_years").select("id, code").order("start_date", { ascending: false }),
    supabase.from("sectors").select("id, name").order("sort_order"),
    supabase.from("classes").select("id, display_name"),
    supabase.rpc("list_report_snapshot_actors"),
  ]);

  const yearCodes = new Map((yearRows ?? []).map((row) => [row.id, row.code]));
  const sectorNames = new Map((sectorRows ?? []).map((row) => [row.id, row.name]));
  const classNames = new Map((classRows ?? []).map((row) => [row.id, row.display_name]));
  const actorNames = new Map((actorRows ?? []).map((row) => [row.profile_id, row.display_name]));

  return {
    items: (rows ?? []).map((row): ReportSnapshotListItem => ({
      id: row.id,
      title: row.title,
      reportType: row.report_type as ReportType,
      scopeLabel: row.scope_type === "global"
        ? "Toàn xứ đoàn"
        : row.scope_type === "sector"
          ? `Ngành ${sectorNames.get(row.scope_id ?? "") ?? "—"}`
          : `Lớp ${classNames.get(row.scope_id ?? "") ?? "—"}`,
      academicYearCode: yearCodes.get(row.academic_year_id) ?? null,
      periodStart: row.period_start,
      periodEnd: row.period_end,
      generatedAt: row.generated_at,
      generatedByName: actorNames.get(row.generated_by) ?? null,
      checksum: row.checksum,
    })),
    page: criteria.page,
    pageSize: SNAPSHOT_PAGE_SIZE,
    totalItems: count ?? 0,
    years: (yearRows ?? []).map((row) => ({ id: row.id, code: row.code })),
  };
}

/**
 * TB-06 bước 3 — trang **xem lại** một bản chốt trên trình duyệt.
 *
 * Tách riêng khỏi `getReportSnapshot` chứ không nhồi thêm cột vào đó: hai route
 * tải file gọi hàm kia mỗi lượt tải, và chúng **không cần** tên phạm vi lẫn tên
 * người chốt. Bốn truy vấn phụ ở đây chỉ trả giá đúng lúc có người mở trang xem.
 *
 * Ngoài phạm vi đọc ⇒ `null` ⇒ trang gọi `notFound()`. 404 chứ không 403: 403
 * nói ra rằng bản chốt ấy **tồn tại** (AC-A07 · `03_AUDIT_RESULTS` §3).
 */
export async function getReportSnapshotForView(
  snapshotId: string,
): Promise<ReportSnapshotDetail | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("report_snapshots")
    .select("scope_type, scope_id, academic_year_id, generated_by")
    .eq("id", snapshotId)
    .maybeSingle();
  const base = await getReportSnapshot(snapshotId);
  if (!base || !data) return null;

  const [{ data: yearRow }, { data: scopeName }, { data: actorRows }] = await Promise.all([
    supabase.from("academic_years").select("code").eq("id", data.academic_year_id).maybeSingle(),
    data.scope_type === "sector"
      ? supabase.from("sectors").select("name").eq("id", data.scope_id ?? "").maybeSingle()
      : data.scope_type === "class"
        ? supabase.from("classes").select("display_name").eq("id", data.scope_id ?? "").maybeSingle()
        : Promise.resolve({ data: null }),
    supabase.rpc("list_report_snapshot_actors"),
  ]);

  const scopeText = scopeName === null
    ? null
    : "name" in scopeName
      ? scopeName.name
      : scopeName.display_name;

  return {
    ...base,
    academicYearCode: yearRow?.code ?? null,
    scopeLabel: data.scope_type === "global"
      ? "Toàn xứ đoàn"
      : data.scope_type === "sector"
        ? `Ngành ${scopeText ?? "—"}`
        : `Lớp ${scopeText ?? "—"}`,
    generatedByName: (actorRows ?? []).find((row) => row.profile_id === data.generated_by)?.display_name
      ?? null,
  };
}

export interface ReportSnapshotDetail {
  title: string;
  headers: string[];
  rows: Array<Array<string | number | null>>;
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  checksum: string;
  /** TB-06 bước 3 — chỉ trang xem lại cần, hai route tải file thì không. */
  scopeLabel?: string;
  generatedByName?: string | null;
  academicYearCode?: string | null;
}

export async function getReportSnapshot(snapshotId: string): Promise<ReportSnapshotDetail | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("report_snapshots")
    .select("title, payload_json, period_start, period_end, generated_at, checksum")
    .eq("id", snapshotId)
    .maybeSingle();
  if (!data) return null;

  const payload = data.payload_json as { headers?: unknown; rows?: unknown } | null;
  return {
    title: data.title,
    headers: Array.isArray(payload?.headers) ? payload.headers.map((item) => String(item)) : [],
    rows: Array.isArray(payload?.rows)
      ? (payload.rows as unknown[]).map((row) =>
        Array.isArray(row) ? row.map((cell) => (cell === null ? null : cell as string | number)) : [])
      : [],
    periodStart: data.period_start,
    periodEnd: data.period_end,
    generatedAt: data.generated_at,
    checksum: data.checksum,
  };
}
