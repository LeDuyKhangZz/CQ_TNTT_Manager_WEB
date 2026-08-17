import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import {
  ATTENDANCE_STATUS_LABELS,
  MEETING_TYPE_LABELS,
  isAbsent,
} from "@/features/attendance/constants";
import { formatDateVi } from "@/lib/dates";
import type { AppAudience } from "@/lib/permissions/roles";
import type { PortalDataStatus } from "../status";
import type { PortalAttendanceRow, PortalAttendanceSummary } from "../server/queries";
import { PortalEmptyState } from "./portal-empty-state";
import { tableScrollFrameClassName } from "@/components/ui/data-table";

/** Dùng chung cho trang phụ huynh và trang thiếu nhi — cùng dữ liệu, cùng cách đọc. */
export function AttendanceHistory({
  summary,
  rows,
  status,
  audience,
  yearCode,
}: {
  summary: PortalAttendanceSummary | null;
  rows: readonly PortalAttendanceRow[];
  status: Extract<PortalDataStatus, "no_enrollment" | "no_data" | "ok">;
  audience: AppAudience | null;
  yearCode: string | null;
}) {
  const warnings = summary
    ? [
        summary.warnConsecutiveAbsence
          ? `Vắng ${summary.catechismAbsenceStreak} buổi giáo lý liên tiếp.`
          : null,
        summary.warnConsecutiveSunday
          ? `Vắng lễ ${summary.sundayAbsenceStreak} Chúa nhật liên tiếp.`
          : null,
        summary.warnLowRate ? "Tỷ lệ chuyên cần đang dưới mức của năm học." : null,
      ].filter((item): item is string => item !== null)
    : [];

  if (summary === null && rows.length === 0) {
    const noCurrentYear = status === "no_data" && yearCode === null;
    return (
      <PortalEmptyState
        reason={status === "no_enrollment" ? "no_enrollment" : "no_data"}
        audience={audience}
        yearCode={yearCode}
        title={
          noCurrentYear
            ? "Chưa có năm học hiện hành"
            : status === "no_data"
              ? "Chưa có buổi điểm danh nào được chốt"
              : undefined
        }
        description={
          noCurrentYear
            ? "Xứ đoàn chưa thiết lập năm học hiện hành nên chưa thể hiển thị chuyên cần."
            : status === "no_data"
              ? `Năm học ${yearCode} chưa có buổi điểm danh đã chốt cho hồ sơ này.`
              : undefined
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Chuyên cần</CardTitle>
          <CardDescription>Tính trên các buổi đã được giáo lý viên chốt.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {summary === null ? null : (
            <>
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div>
                  <span className="text-ink-muted">Số buổi</span>
                  <p className="text-lg font-semibold">{summary.sessionsCounted}</p>
                </div>
                <div>
                  <span className="text-ink-muted">Có mặt lễ</span>
                  <p className="text-lg font-semibold">{summary.massPresentCount}</p>
                </div>
                <div>
                  <span className="text-ink-muted">Điểm Thánh lễ</span>
                  <p className="text-lg font-semibold">{summary.massAttendanceScore ?? "—"}</p>
                </div>
                <div>
                  <span className="text-ink-muted">Điểm Giáo lý</span>
                  <p className="text-lg font-semibold">{summary.catechismAttendanceScore ?? "—"}</p>
                </div>
              </div>
              {warnings.length > 0 ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="rounded-md border border-warning bg-warning-subtle p-3 text-sm text-warning"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                    <div>
                      <ul className="space-y-1">
                        {warnings.map((warning) => (
                          <li key={warning}>{warning}</li>
                        ))}
                      </ul>
                      <p className="mt-2 font-medium">Xin liên hệ Giáo lý viên phụ trách để được hỗ trợ.</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lịch sử từng buổi</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-ink-muted">Chưa có dữ liệu điểm danh đã chốt.</p>
          ) : (
            <div
              className={tableScrollFrameClassName}
              tabIndex={0}
              aria-label="Bảng lịch sử điểm danh, có thể cuộn ngang"
            >
              <table className="w-full min-w-[600px] text-sm">
                <caption className="sr-only">Lịch sử điểm danh đã được Giáo lý viên chốt</caption>
                <thead className="bg-surface-muted text-left">
                  <tr>
                    <th scope="col" className="p-3">Ngày</th>
                    <th scope="col" className="p-3">Buổi</th>
                    <th scope="col" className="p-3">Thánh lễ</th>
                    <th scope="col" className="p-3">Giáo lý</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.recordId} className="border-t border-line">
                      <th scope="row" className="p-3 text-left font-medium">
                        {formatDateVi(row.attendanceDate)}
                      </th>
                      <td className="p-3">{MEETING_TYPE_LABELS[row.meetingType]}</td>
                      <td className="p-3">
                        <Badge variant={isAbsent(row.massStatus) ? "danger" : "success"}>
                          {ATTENDANCE_STATUS_LABELS[row.massStatus]}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant={isAbsent(row.catechismStatus) ? "danger" : "success"}>
                          {ATTENDANCE_STATUS_LABELS[row.catechismStatus]}
                        </Badge>
                      </td>
                      {/* D-75: không đọc và không in ghi chú nội bộ của Giáo lý viên. */}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
