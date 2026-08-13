"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AppError, type AppErrorCode } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import {
  reportFilterSchema,
  reportScopeLabel,
  REPORT_TYPE_LABELS,
  type ReportFilter,
} from "../filters";
import { buildReportExportData } from "../report-data";
import { buildReport, reportsRouteContext } from "./queries";

export type ReportActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; code: AppErrorCode; message: string };

function failure(error: unknown): ReportActionResult<never> {
  if (error instanceof AppError) return { ok: false, code: error.code, message: error.message };
  // Câu chữ ở `reportFilterSchema` viết từ Phase 6 nhưng `failure()` cũ nuốt sạch
  // `ZodError` — cùng hình dạng lỗi M07-A và M08-A đã chữa cho hai module khác.
  if (error instanceof z.ZodError) {
    const first = error.issues[0];
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      message: first?.message ?? "Bộ lọc báo cáo không hợp lệ.",
    };
  }
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
  // 🔴 Nợ #14 / D-96 — guard nằm NGOÀI `try`. Trong `try` thì `catch` nuốt mất
  // `redirect()` của Next và người hết phiên đăng nhập đọc câu "Không thể chốt
  // báo cáo. Vui lòng thử lại." — một lời mời thử lại đúng thứ vừa hỏng.
  // Và `requireRouteAccess` chứ không `requireAuthContext`: luật `ROUTE_RULES`
  // phải được thi hành ở cả tầng Server Action, không chỉ tầng trang.
  const context = await reportsRouteContext();
  try {
    const filter = reportFilterSchema.parse(input);
    const report = await buildReport(filter, context);
    if (!report.academicYear) {
      throw new AppError("VALIDATION_ERROR", "Chưa có năm học hiện hành để chốt báo cáo.");
    }
    if (report.reason === "out_of_scope") {
      throw new AppError("FORBIDDEN", "Bạn không được chốt báo cáo cho phạm vi này.");
    }
    if (report.rows.length === 0) {
      throw new AppError("VALIDATION_ERROR", "Không có dữ liệu trong phạm vi và khoảng thời gian này.");
    }

    const payload = buildReportExportData(report);
    // 🔴 TB-06 bước 4 — tiêu đề phải chứa PHẠM VI.
    //
    // Bản cũ đặt tên `"Chuyên cần 2026-09-01 – 2026-09-30"`, nên hai bản chốt
    // cùng tháng của **hai lớp khác nhau** hiện ra giống hệt nhau trong kho lưu
    // 5 năm; muốn biết bản nào của lớp nào phải tải cả hai về mở ra
    // (`03_AUDIT_RESULTS` §4.6). Tên đặt lúc chốt là thứ **không sửa được**, nên
    // đây là chỗ duy nhất còn kịp.
    const scopeLabel = reportScopeLabel(filter, {
      sectors: report.sectors,
      classes: report.classes,
    });
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("report_snapshots")
      .insert({
        report_type: filter.reportType,
        title: `${REPORT_TYPE_LABELS[filter.reportType]} · ${scopeLabel ?? "Phạm vi không xác định"} · ${report.from} – ${report.to}`,
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
      if (error?.code === "42501") {
        throw new AppError(
          "FORBIDDEN",
          "Bạn không được chốt báo cáo cho phạm vi này, hoặc năm học đã đóng sổ.",
        );
      }
      throw new AppError("CONFLICT");
    }
    revalidatePath("/reports");
    return { ok: true, data: { id: data.id } };
  } catch (error) {
    return failure(error);
  }
}
