import { z } from "zod";
import type { AppScopeKind } from "@/lib/permissions/roles";

export const REPORT_TYPES = ["attendance", "results"] as const;
export type ReportType = (typeof REPORT_TYPES)[number];
export const REPORT_TYPE_LABELS: Readonly<Record<ReportType, string>> = {
  attendance: "Chuyên cần",
  results: "Kết quả học tập",
};

export const REPORT_PERIODS = ["week", "month", "year"] as const;
export type ReportPeriod = (typeof REPORT_PERIODS)[number];
export const REPORT_PERIOD_LABELS: Readonly<Record<ReportPeriod, string>> = {
  week: "Tuần",
  month: "Tháng",
  year: "Năm học",
};

export const REPORT_SCOPES = ["global", "sector", "class"] as const;
export type ReportScope = (typeof REPORT_SCOPES)[number];
export const REPORT_SCOPE_LABELS: Readonly<Record<ReportScope, string>> = {
  global: "Toàn xứ đoàn",
  sector: "Theo ngành",
  class: "Theo lớp",
};

export interface ReportFilter {
  reportType: ReportType;
  periodType: ReportPeriod;
  anchorDate: string;
  scopeType: ReportScope;
  scopeId: string | null;
}

/**
 * Vì sao bảng lại trống — ba nguyên nhân khác nhau mà bản cũ gộp vào **một** câu
 * *"Không có dữ liệu…"* (`03_AUDIT_RESULTS` tiêu chí 2 chấm 3/5, và §4.4 truy
 * đúng gốc rễ: `buildReport` chỉ trả `rows`, không trả lý do). Người chọn nhầm
 * một lớp ngoài phạm vi đọc đúng câu mà người có lớp trống cũng đọc, nên họ thử
 * lại mãi một việc không bao giờ chạy được.
 */
export type ReportEmptyReason = "empty" | "out_of_scope" | "no_finalized_session";

/**
 * Đúng ba trường của `AuthContext` mà bộ lọc cần. Khai hẹp để hàm thuần này
 * kiểm thử được mà không phải dựng một `AuthContext` giả đủ 12 trường.
 */
export interface ReportScopeSubject {
  scopeKind: AppScopeKind | null;
  sectorId: string | null;
  classId: string | null;
}

/**
 * D-171 — báo cáo "Kết quả học tập" LUÔN là cả năm học.
 *
 * 🔴 Đây là một **nhãn nói sai nội dung**, không phải một tính năng còn thiếu:
 * `report_results_rows` chỉ nhận `p_academic_year_id` và **bỏ qua hoàn toàn
 * khoảng ngày** (`20260723000500:322`), nên chọn "Tháng 09" cho ra số liệu của
 * **cả năm** trong khi bản chốt vẫn dán nhãn `period_start/end = 01/09–30/09`.
 * Ai mở lại bản ấy sau ba năm sẽ đọc một con số cả năm dưới cái tên một tháng,
 * và không có cách nào biết.
 *
 * Chủ dự án chốt phương án (b): ép kỳ thay vì cho lọc thật. Ép ở **một hàm
 * thuần duy nhất** rồi gọi từ cả ba cửa vào (trang · route tải file · Server
 * Action) — nếu mỗi cửa tự ép lấy thì đủ để một cửa quên, và cửa quên ấy chính
 * là cửa ghi bản chốt.
 */
export function normalizeReportFilter(filter: ReportFilter): ReportFilter {
  if (filter.reportType !== "results" || filter.periodType === "year") return filter;
  return { ...filter, periodType: "year" };
}

export const reportFilterSchema = z.object({
  reportType: z.enum(REPORT_TYPES).default("attendance"),
  periodType: z.enum(REPORT_PERIODS).default("month"),
  anchorDate: z.string().date(),
  scopeType: z.enum(REPORT_SCOPES).default("global"),
  scopeId: z.string().uuid().nullable().default(null),
}).superRefine((value, context) => {
  if (value.scopeType !== "global" && !value.scopeId) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["scopeId"], message: "Vui lòng chọn phạm vi cụ thể." });
  }
  if (value.scopeType === "global" && value.scopeId) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["scopeId"], message: "Phạm vi toàn xứ đoàn không cần chọn thêm." });
  }
}).transform(normalizeReportFilter);

function toDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function toIso(value: Date): string {
  return value.toISOString().slice(0, 10);
}

/**
 * Khoảng ngày của báo cáo, suy từ mốc đang chọn. Cả bản xem trước, file Excel/PDF
 * và snapshot đều gọi hàm này nên không thể lệch nhau (D-52).
 * `year` bám theo năm học chứ không phải năm dương lịch.
 */
export function resolveReportRange(
  filter: ReportFilter,
  academicYear: { startDate: string; endDate: string },
): { from: string; to: string } {
  if (filter.periodType === "year") {
    return { from: academicYear.startDate, to: academicYear.endDate };
  }
  const anchor = toDate(filter.anchorDate);
  if (filter.periodType === "week") {
    const from = new Date(anchor);
    from.setUTCDate(from.getUTCDate() - ((from.getUTCDay() + 6) % 7));
    const to = new Date(from);
    to.setUTCDate(to.getUTCDate() + 6);
    return { from: toIso(from), to: toIso(to) };
  }
  const from = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1));
  const to = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 0));
  return { from: toIso(from), to: toIso(to) };
}

/**
 * Phạm vi mặc định suy từ vai trò người đăng nhập (TB-05 bước 1).
 *
 * 🔴 Bản cũ mặc định `global` cho **mọi** người (`filters.ts:38` trước 2026-08-11),
 * nên trạng thái *mặc định* của Trưởng ngành và Giáo lý viên lớp luôn là trạng
 * thái sẽ lỗi: họ mở `/reports`, thấy nút "Chốt báo cáo", bấm, và nhận một câu
 * từ chối — trong khi thứ họ thật sự chốt được (ngành mình, lớp mình) thì phải
 * tự tìm ra. `03_AUDIT_RESULTS` §4.5 gọi đúng gốc rễ: *"phạm vi mặc định không
 * suy từ `scopeKind` của người đăng nhập"*.
 */
export function defaultReportScope(
  subject: ReportScopeSubject,
): Pick<ReportFilter, "scopeType" | "scopeId"> {
  if (subject.scopeKind === "sector" && subject.sectorId) {
    return { scopeType: "sector", scopeId: subject.sectorId };
  }
  if (subject.scopeKind === "class" && subject.classId) {
    return { scopeType: "class", scopeId: subject.classId };
  }
  return { scopeType: "global", scopeId: null };
}

export interface ParsedReportFilter {
  filter: ReportFilter;
  /**
   * Tham số trên URL bị bỏ đi vì không hợp lệ. Rỗng là im lặng; có phần tử là
   * trang **phải nói ra** — bản cũ đặt lại toàn bộ bộ lọc về mặc định `global`
   * mà không một chữ nào báo, tức âm thầm **nới rộng** phạm vi người dùng vừa
   * yêu cầu (`03_AUDIT_RESULTS` tiêu chí 5 chấm 2/5).
   */
  invalidKeys: string[];
}

const uuidSchema = z.string().uuid();
const dateSchema = z.string().date();

export function parseReportFilter(
  params: Record<string, string | string[] | undefined>,
  subject: ReportScopeSubject,
  today: string = new Date().toISOString().slice(0, 10),
): ParsedReportFilter {
  const read = (key: string): string | undefined => {
    const value = params[key];
    const first = Array.isArray(value) ? value[0] : value;
    return first === undefined || first === "" ? undefined : first;
  };
  const invalidKeys: string[] = [];
  const fallback = defaultReportScope(subject);

  const rawType = read("reportType");
  let reportType: ReportType = "attendance";
  if (rawType !== undefined) {
    if ((REPORT_TYPES as readonly string[]).includes(rawType)) reportType = rawType as ReportType;
    else invalidKeys.push("reportType");
  }

  const rawPeriod = read("periodType");
  let periodType: ReportPeriod = "month";
  if (rawPeriod !== undefined) {
    if ((REPORT_PERIODS as readonly string[]).includes(rawPeriod)) periodType = rawPeriod as ReportPeriod;
    else invalidKeys.push("periodType");
  }

  const rawAnchor = read("anchorDate");
  let anchorDate = today;
  if (rawAnchor !== undefined) {
    if (dateSchema.safeParse(rawAnchor).success) anchorDate = rawAnchor;
    else invalidKeys.push("anchorDate");
  }

  const rawScopeType = read("scopeType");
  // `null` = URL không nói gì dùng được về phạm vi. Phân biệt với "nói sai" là
  // điều bắt buộc: không có nó thì mọi lượt mở `/reports` **không kèm tham số**
  // của Trưởng ngành / Giáo lý viên lớp đều hiện một dải cảnh báo, và một cảnh
  // báo luôn hiện là một cảnh báo không ai đọc nữa.
  let scopeType: ReportScope | null = null;
  if (rawScopeType !== undefined) {
    if ((REPORT_SCOPES as readonly string[]).includes(rawScopeType)) scopeType = rawScopeType as ReportScope;
    else invalidKeys.push("scopeType");
  }

  const rawScopeId = read("scopeId");
  let scopeId: string | null = null;
  if (rawScopeId !== undefined) {
    if (uuidSchema.safeParse(rawScopeId).success) scopeId = rawScopeId;
    else invalidKeys.push("scopeId");
  }

  if (scopeType === null) {
    scopeType = fallback.scopeType;
    scopeId = fallback.scopeId;
  } else if (scopeType === "global") {
    // `scopeId` thừa không phải lỗi của người dùng — bỏ đi im lặng, đó là thu hẹp.
    scopeId = null;
  } else if (!scopeId) {
    // Thiếu `scopeId` thì KHÔNG rơi về `global`: đó là nới rộng phạm vi sau lưng
    // người dùng. Rơi về phạm vi hẹp nhất mà chính họ chắc chắn có (AC-B06).
    if (!invalidKeys.includes("scopeId")) invalidKeys.push("scopeId");
    scopeType = fallback.scopeType;
    scopeId = fallback.scopeId;
  }

  // D-171 ép sau cùng, và **không** ghi vào `invalidKeys`: chuyển từ "Chuyên cần ·
  // Tháng 09" sang "Kết quả học tập" là một thao tác hoàn toàn chính đáng, không
  // phải một tham số hỏng. Báo nó như lỗi là dạy người dùng bỏ qua dải cảnh báo.
  return {
    filter: normalizeReportFilter({ reportType, periodType, anchorDate, scopeType, scopeId }),
    invalidKeys,
  };
}

export function reportFilterToSearchParams(filter: ReportFilter): URLSearchParams {
  const params = new URLSearchParams({
    reportType: filter.reportType,
    periodType: filter.periodType,
    anchorDate: filter.anchorDate,
    scopeType: filter.scopeType,
  });
  if (filter.scopeId) params.set("scopeId", filter.scopeId);
  return params;
}

const INVALID_KEY_LABELS: Readonly<Record<string, string>> = {
  reportType: "Loại báo cáo",
  periodType: "Kỳ báo cáo",
  anchorDate: "Ngày trong kỳ",
  scopeType: "Phạm vi",
  scopeId: "Phạm vi cụ thể",
};

/** Câu cảnh báo cho dải `role="status"` khi URL mang tham số không dùng được. */
export function invalidFilterMessage(invalidKeys: string[]): string | null {
  if (invalidKeys.length === 0) return null;
  const names = invalidKeys.map((key) => INVALID_KEY_LABELS[key] ?? key).join(" · ");
  return `Tham số không hợp lệ nên đã đặt lại về phạm vi của bạn: ${names}.`;
}

/**
 * Phạm vi đang xem, viết ra bằng chữ. Hộp xác nhận trước khi chốt (AC-B09) phải
 * nêu hậu quả **bằng tên riêng** — `11` §5 — nên "Lớp Ấu 1A" chứ không phải một
 * mã UUID, và "Toàn xứ đoàn" chứ không phải chuỗi rỗng.
 *
 * Trả về `null` khi phạm vi trỏ vào một id không có trong danh sách người dùng
 * được chọn: khi ấy bảng bên dưới đã nói *"Bạn không được xem phạm vi này"*, và
 * bịa ra một cái tên ở đây là để hai chỗ nói ngược nhau.
 */
export function reportScopeLabel(
  filter: Pick<ReportFilter, "scopeType" | "scopeId">,
  options: { sectors: Array<{ id: string; name: string }>; classes: Array<{ id: string; name: string }> },
): string | null {
  if (filter.scopeType === "global") return REPORT_SCOPE_LABELS.global;
  const list = filter.scopeType === "sector" ? options.sectors : options.classes;
  const match = list.find((item) => item.id === filter.scopeId);
  if (!match) return null;
  return filter.scopeType === "sector" ? `Ngành ${match.name}` : `Lớp ${match.name}`;
}

export function reportEmptyMessage(reason: ReportEmptyReason): string {
  if (reason === "out_of_scope") {
    return "Bạn không được xem phạm vi này. Hãy chọn lớp hoặc ngành bạn phụ trách.";
  }
  if (reason === "no_finalized_session") {
    return "Trong khoảng này chưa có buổi điểm danh nào được chốt.";
  }
  return "Không có dữ liệu trong khoảng thời gian này.";
}
