import { z } from "zod";

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
});

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

export function parseReportFilter(
  params: Record<string, string | string[] | undefined>,
): ReportFilter {
  const read = (key: string): string | undefined => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const parsed = reportFilterSchema.safeParse({
    reportType: read("reportType") ?? "attendance",
    periodType: read("periodType") ?? "month",
    anchorDate: read("anchorDate") ?? new Date().toISOString().slice(0, 10),
    scopeType: read("scopeType") ?? "global",
    scopeId: read("scopeId") || null,
  });
  if (parsed.success) return parsed.data;
  return {
    reportType: "attendance",
    periodType: "month",
    anchorDate: new Date().toISOString().slice(0, 10),
    scopeType: "global",
    scopeId: null,
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
