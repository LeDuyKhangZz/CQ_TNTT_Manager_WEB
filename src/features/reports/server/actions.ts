"use server";

import { revalidatePath } from "next/cache";
import { AppError, type AppErrorCode } from "@/lib/errors";
import { requireAuthContext } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { reportFilterSchema, REPORT_TYPE_LABELS, type ReportFilter } from "../filters";
import { buildReportExportData } from "../report-data";
import { buildReport } from "./queries";

export type ReportActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; code: AppErrorCode; message: string };

function failure(error: unknown): ReportActionResult<never> {
  if (error instanceof AppError) return { ok: false, code: error.code, message: error.message };
  return { ok: false, code: "CONFLICT", message: "Không thể chốt báo cáo. Vui lòng thử lại." };
}

/**
 * WF-15 bước 4: chốt báo cáo. Payload được dựng lại từ CHÍNH filter đang chọn
 * qua `buildReport`, không nhận số liệu từ client — người dùng không thể chốt
 * một bảng số khác với thứ họ nhìn thấy, và cũng không thể chốt dữ liệu ngoài
 * phạm vi vì `buildReport` chạy dưới RLS của họ.
 */
export async function createReportSnapshot(
  input: ReportFilter,
): Promise<ReportActionResult<{ id: string }>> {
  try {
    const filter = reportFilterSchema.parse(input);
    const context = await requireAuthContext("/reports");
    const report = await buildReport(filter);
    if (!report.academicYear) {
      throw new AppError("VALIDATION_ERROR", "Chưa có năm học hiện hành để chốt báo cáo.");
    }
    if (report.rows.length === 0) {
      throw new AppError("VALIDATION_ERROR", "Không có dữ liệu trong phạm vi và khoảng thời gian này.");
    }

    const payload = buildReportExportData(report);
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("report_snapshots")
      .insert({
        report_type: filter.reportType,
        title: `${REPORT_TYPE_LABELS[filter.reportType]} ${report.from} – ${report.to}`,
        academic_year_id: report.academicYear.id,
        scope_type: filter.scopeType,
        scope_id: filter.scopeId,
        period_type: filter.periodType,
        period_start: report.from,
        period_end: report.to,
        filter_json: {
          reportType: filter.reportType,
          periodType: filter.periodType,
          anchorDate: filter.anchorDate,
          scopeType: filter.scopeType,
          scopeId: filter.scopeId,
          from: report.from,
          to: report.to,
        },
        payload_json: { headers: payload.headers, rows: payload.rows },
        // Trigger `report_snapshots_seal` tính lại checksum/generated_by; giá trị
        // gửi lên chỉ để thỏa NOT NULL.
        checksum: "pending",
        generated_by: context.profileId,
      })
      .select("id")
      .single();
    if (error || !data) {
      if (error?.code === "42501") throw new AppError("FORBIDDEN", "Bạn không được chốt báo cáo cho phạm vi này.");
      throw new AppError("CONFLICT");
    }
    revalidatePath("/reports");
    return { ok: true, data: { id: data.id } };
  } catch (error) {
    return failure(error);
  }
}
