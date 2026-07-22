import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ATTENDANCE_STATUS_LABELS,
  MEETING_TYPE_LABELS,
  isAbsent,
} from "@/features/attendance/constants";
import { formatDateVi } from "@/lib/dates";
import type { PortalAttendanceRow, PortalAttendanceSummary } from "../server/queries";

/** Dùng chung cho trang phụ huynh và trang thiếu nhi — cùng dữ liệu, cùng cách đọc. */
export function AttendanceHistory({
  summary,
  rows,
}: {
  summary: PortalAttendanceSummary | null;
  rows: readonly PortalAttendanceRow[];
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

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Chuyên cần</CardTitle>
          <CardDescription>Tính trên các buổi đã được giáo lý viên chốt.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {summary === null ? (
            <p className="text-sm text-muted-foreground">Chưa có buổi điểm danh nào được chốt.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div>
                  <span className="text-muted-foreground">Số buổi</span>
                  <p className="text-lg font-semibold">{summary.sessionsCounted}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Có mặt lễ</span>
                  <p className="text-lg font-semibold">{summary.massPresentCount}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Điểm Thánh lễ</span>
                  <p className="text-lg font-semibold">{summary.massAttendanceScore ?? "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Điểm Giáo lý</span>
                  <p className="text-lg font-semibold">{summary.catechismAttendanceScore ?? "—"}</p>
                </div>
              </div>
              {warnings.length > 0 ? (
                <ul className="space-y-1 rounded-md border border-warning/20 bg-warning-surface p-3 text-sm text-warning">
                  {warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lịch sử từng buổi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có dữ liệu điểm danh đã chốt.</p>
          ) : (
            rows.map((row) => (
              <div key={row.recordId} className="rounded-md border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium">
                    {MEETING_TYPE_LABELS[row.meetingType]} · {formatDateVi(row.attendanceDate)}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={isAbsent(row.massStatus) ? "danger" : "success"}>
                      Lễ: {ATTENDANCE_STATUS_LABELS[row.massStatus]}
                    </Badge>
                    <Badge variant={isAbsent(row.catechismStatus) ? "danger" : "success"}>
                      Giáo lý: {ATTENDANCE_STATUS_LABELS[row.catechismStatus]}
                    </Badge>
                  </div>
                </div>
                {row.note ? <p className="mt-2 text-xs text-muted-foreground">{row.note}</p> : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
