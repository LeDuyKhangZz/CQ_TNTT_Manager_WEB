import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, panelClassName } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";

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
            <p className="text-sm text-muted-foreground">
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
        description={`Năm học ${year.code} · khóa sau ${year.attendance_lock_days} ngày · phiên chỉnh sửa ${year.attendance_edit_lease_minutes} phút`}
      />

      <FormMessage>{error}</FormMessage>

      <div className="grid gap-5 lg:grid-cols-[minmax(18rem,0.6fr)_minmax(0,1.4fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Mở buổi điểm danh</CardTitle>
            <CardDescription>Chỉ có thứ Năm và Chúa nhật.</CardDescription>
          </CardHeader>
          <CardContent>
            {editableClasses.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {viewOnly
                  ? "Bạn xem điểm danh ở chế độ chỉ đọc. Việc mở buổi và ghi điểm danh thuộc về Giáo lý viên của lớp."
                  : "Bạn chưa được phân công lớp nào nên không mở được buổi điểm danh. Trưởng ngành chỉ điểm danh trực tiếp ở lớp mình đứng."}
              </p>
            ) : (
              <form action={openAttendanceSessionFromForm} className="space-y-3">
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
                <Button type="submit" className="w-full">Mở buổi</Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Buổi gần đây</CardTitle>
            <CardDescription>Các buổi trong phạm vi bạn được xem.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có buổi điểm danh nào.</p>
            ) : (
              sessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/attendance/${session.id}`}
                  className={cn(panelClassName(), "flex flex-wrap items-center justify-between gap-2 hover:bg-surface-muted")}
                >
                  <div>
                    <p className="text-sm font-medium">{session.className}</p>
                    <p className="text-xs text-muted-foreground">
                      {MEETING_TYPE_LABELS[session.meetingType]} · {formatDateVi(session.attendanceDate)}
                      {session.editorName ? ` · ${session.editorName} đang phụ trách` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {session.absentCount > 0 ? (
                      <Badge variant="warning" aria-label={`${session.absentCount} em vắng`}>
                        {session.absentCount} vắng
                      </Badge>
                    ) : null}
                    {/* TB-02: in trạng thái ĐÃ SUY RA, không in thẳng cột `status`
                        của cơ sở dữ liệu — cột ấy không bao giờ mang giá trị
                        `locked`, nên buổi đã khóa từng hiện "Đã chốt" ở đây. */}
                    <Badge variant={session.state === "completed" ? "success" : "secondary"}>
                      {SESSION_STATE_LABELS[session.state]}
                    </Badge>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* TB-06 / AC-F13-1 — đơn phải thấy được **mà không cần mở buổi**. Đặt
          dưới hai thẻ trên vì việc đầu tiên của người vào trang này vẫn là mở
          buổi, nhưng nằm trên cùng một màn hình nên không ai phải đi tìm. */}
      <div className="mt-5">
        <AbsenceReviewPanel requests={pendingAbsences} canReview={!viewOnly} />
      </div>
    </PageContainer>
  );
}
