import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { DateField } from "@/components/ui/date-field";
import { FormMessage } from "@/components/ui/form-message";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { FormPendingBridge } from "@/components/loading/form-pending-bridge";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { AbsenceReviewPanel } from "@/features/absence-requests/components/absence-review-panel";
import {
  MEETING_TYPE_LABELS,
  SESSION_STATE_LABELS,
  meetingTypeForDate,
  mostRecentMeetingDate,
} from "@/features/attendance/constants";
import { openAttendanceSessionFromForm } from "@/features/attendance/server/actions";
import { getAttendanceHubData } from "@/features/attendance/server/queries";
import { formatDateVi, todayVi } from "@/lib/dates";
import { ATTENDANCE_VIEW_ONLY_ROLES } from "@/lib/permissions/route-map";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { context, year, editableClasses, sessions, pendingAbsences } = await getAttendanceHubData();
  // D-139: Cha sở và Cha phó vào được trang này nhưng không điểm danh. Câu
  // "Bạn chưa được phân công lớp nào" đúng với Giáo lý viên, nhưng với hai vị
  // thì nó mô tả sai lý do — họ không thiếu phân công, họ chỉ có quyền xem.
  const viewOnly = context.role !== null && ATTENDANCE_VIEW_ONLY_ROLES.includes(context.role);

  if (!year) {
    return (
      <PageContainer>
        <PageHeader title="Điểm danh" description="Điểm danh Thánh lễ và Giáo lý theo từng buổi." />
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-ink-muted">
              Chưa có năm học nào đang diễn ra. Vào <Link href="/admin" className="underline">Quản trị hệ thống</Link> để đặt năm học hiện hành.
            </p>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  // TB-01: `todayVi()` chứ không phải `new Date()` — máy chủ chạy giờ UTC nên
  // 06:00 sáng Chúa nhật giờ Việt Nam vẫn là thứ Bảy với Node, và form đổ sẵn
  // buổi thứ Năm TUẦN TRƯỚC đúng lúc người ta tới nhà thờ điểm danh sớm.
  const defaultDate = mostRecentMeetingDate(todayVi());
  const defaultMeeting = meetingTypeForDate(defaultDate) ?? "sunday";

  return (
    <PageContainer>
      <PageHeader
        title="Điểm danh"
        description={`Năm học ${year.code}`}
        help={`Buổi đã chốt khóa sau ${year.attendance_lock_days} ngày. Quyền chỉnh sửa được giữ ${year.attendance_edit_lease_minutes} phút và gia hạn khi bạn đang làm việc.`}
      />

      <FormMessage>{error}</FormMessage>

      <div className="grid items-start gap-4 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Mở buổi điểm danh</CardTitle>
            <CardDescription>Chỉ có thứ Năm và Chúa nhật.</CardDescription>
          </CardHeader>
          <CardContent>
            {editableClasses.length === 0 ? (
              <p className="text-sm text-ink-muted">
                {viewOnly
                  ? "Bạn xem điểm danh ở chế độ chỉ đọc. Việc mở buổi và ghi điểm danh thuộc về Giáo lý viên của lớp."
                  : "Bạn chưa được phân công lớp nào nên không mở được buổi điểm danh. Trưởng ngành chỉ điểm danh trực tiếp ở lớp mình đứng."}
              </p>
            ) : (
              <form action={openAttendanceSessionFromForm} className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                {/* Biểu mẫu không cần JS: `useActionState` không có ở đây nên
                    chỉ cầu nối này biết được lượt gửi đang chạy (`17` §3.4). */}
                <FormPendingBridge />
                {/* M05-C: hai ô chọn trần CUỐI của module sang `Select` (D-80),
                    đúng khuôn M12-A và M02-B đã làm cho module của họ. `Select`
                    bọc một `<select>` native nên biểu mẫu vẫn gửi được khi
                    JavaScript chưa tải — ràng buộc `09` §11 cho mạng phòng học. */}
                <div className="space-y-2">
                  <Label htmlFor="attendance-class">Lớp</Label>
                  <Select id="attendance-class" name="classId" required>
                    {editableClasses.map((option) => (
                      <option key={option.id} value={option.id}>{option.displayName}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="attendance-date">Ngày</Label>
                  <DateField id="attendance-date" name="date" defaultValue={defaultDate} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="attendance-meeting">Buổi</Label>
                  <Select id="attendance-meeting" name="meetingType" required defaultValue={defaultMeeting}>
                    <option value="thursday">{MEETING_TYPE_LABELS.thursday}</option>
                    <option value="sunday">{MEETING_TYPE_LABELS.sunday}</option>
                  </Select>
                </div>
                <Button type="submit" className="w-full sm:col-span-3 xl:col-span-1">Mở buổi</Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Buổi gần đây</CardTitle>

          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <p className="text-sm text-ink-muted">Chưa có buổi điểm danh nào.</p>
            ) : (
              <DataTable
                caption="Các buổi điểm danh gần đây trong phạm vi bạn được xem"
                hideCaption
                density="compact"
                rows={sessions}
                rowHref={(session) => `/attendance/${session.id}`}
                getRowKey={(session) => session.id}
                minWidth="560px"
                mobileRow={{ titleKey: "class", trailingKey: "status", metaKeys: ["date", "editor", "absent"] }}
                columns={[
                  { key: "class", header: "Lớp", cell: (session) => <span className="font-semibold text-ink">{session.className}</span> },
                  { key: "date", header: "Ngày · buổi", cell: (session) => <div className="whitespace-nowrap"><span className="tabular-nums">{formatDateVi(session.attendanceDate)}</span><span className="block text-xs text-ink-muted">{MEETING_TYPE_LABELS[session.meetingType]}</span></div> },
                  { key: "status", header: "Trạng thái", cell: (session) => <Badge variant={session.state === "completed" ? "success" : "secondary"}>{SESSION_STATE_LABELS[session.state]}</Badge> },
                  { key: "absent", header: "Em vắng", numeric: true, cell: (session) => <span className={session.absentCount > 0 ? "font-medium text-warning" : "text-ink-muted"}>{session.absentCount}</span> },
                  { key: "editor", header: "Đang phụ trách", cell: (session) => <span className="text-ink-muted">{session.editorName ?? "—"}</span> },
                ]}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* TB-06 / AC-F13-1 — đơn phải thấy được **mà không cần mở buổi**. Đặt
          dưới hai thẻ trên vì việc đầu tiên của người vào trang này vẫn là mở
          buổi, nhưng nằm trên cùng một màn hình nên không ai phải đi tìm. */}
      <AbsenceReviewPanel requests={pendingAbsences} canReview={!viewOnly} />
    </PageContainer>
  );
}
