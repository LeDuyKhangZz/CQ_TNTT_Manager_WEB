import "server-only";

import { requireRouteAccess } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import {
  REPORT_TYPE_LABELS,
  resolveReportRange,
  type ReportFilter,
} from "../filters";

export interface ReportRow {
  classId: string;
  className: string;
  sectorId: string | null;
  values: Array<string | number | null>;
}

export interface ReportResult {
  filter: ReportFilter;
  academicYear: { id: string; code: string; startDate: string; endDate: string } | null;
  title: string;
  from: string;
  to: string;
  headers: string[];
  rows: ReportRow[];
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

export interface ReportsPageData extends ReportResult {
  sectors: Array<{ id: string; name: string }>;
  classes: Array<{ id: string; name: string; sectorId: string | null }>;
  snapshots: ReportSnapshotRow[];
  canSnapshot: boolean;
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
 * Nguồn duy nhất của bản xem trước, file Excel/PDF và payload snapshot.
 * Không tách thành ba đường tính khác nhau — đó là cách nhanh nhất để file tải
 * về lệch với thứ người dùng vừa nhìn thấy (D-52).
 */
export async function buildReport(filter: ReportFilter): Promise<ReportResult> {
  await requireRouteAccess("/reports");
  const supabase = await createClient();
  const { data: year } = await supabase
    .from("academic_years")
    .select("id, code, start_date, end_date")
    .eq("status", "current")
    .maybeSingle();

  if (!year) {
    return {
      filter,
      academicYear: null,
      title: REPORT_TYPE_LABELS[filter.reportType],
      from: filter.anchorDate,
      to: filter.anchorDate,
      headers: filter.reportType === "attendance" ? ATTENDANCE_HEADERS : RESULTS_HEADERS,
      rows: [],
    };
  }

  const academicYear = {
    id: year.id,
    code: year.code,
    startDate: year.start_date,
    endDate: year.end_date,
  };
  const { from, to } = resolveReportRange(filter, academicYear);

  let rows: ReportRow[] = [];
  if (filter.reportType === "attendance") {
    const { data } = await supabase.rpc("report_attendance_rows", {
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
    const { data } = await supabase.rpc("report_results_rows", {
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
    headers: filter.reportType === "attendance" ? ATTENDANCE_HEADERS : RESULTS_HEADERS,
    rows: filtered,
  };
}

export async function getReportsPageData(filter: ReportFilter): Promise<ReportsPageData> {
  const context = await requireRouteAccess("/reports");
  const report = await buildReport(filter);
  const supabase = await createClient();

  const [{ data: sectorData }, { data: classData }, { data: snapshotData }] = await Promise.all([
    supabase.from("sectors").select("id, name").order("sort_order"),
    supabase
      .from("classes")
      .select("id, display_name, grade_levels(sector_id)")
      .eq("status", "active")
      .order("display_name"),
    supabase
      .from("report_snapshots")
      .select("id, title, report_type, period_start, period_end, generated_at, checksum")
      .order("generated_at", { ascending: false })
      .limit(20),
  ]);

  return {
    ...report,
    sectors: (sectorData ?? []).map((item) => ({ id: item.id, name: item.name })),
    classes: (classData ?? []).map((item) => ({
      id: item.id,
      name: item.display_name,
      sectorId: item.grade_levels?.sector_id ?? null,
    })),
    snapshots: (snapshotData ?? []).map((item): ReportSnapshotRow => ({
      id: item.id,
      title: item.title,
      reportType: item.report_type,
      periodStart: item.period_start,
      periodEnd: item.period_end,
      generatedAt: item.generated_at,
      checksum: item.checksum,
    })),
    // Thủ quỹ xem/xuất được nhưng không chốt báo cáo (D-19).
    canSnapshot: context.role !== null && context.role !== "treasurer",
  };
}

export async function getReportSnapshot(snapshotId: string): Promise<{
  title: string;
  headers: string[];
  rows: Array<Array<string | number | null>>;
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  checksum: string;
} | null> {
  await requireRouteAccess("/reports");
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
