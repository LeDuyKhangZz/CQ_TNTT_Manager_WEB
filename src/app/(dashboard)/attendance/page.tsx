import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import {
  MEETING_TYPE_LABELS,
  SESSION_STATUS_LABELS,
  meetingTypeForDate,
} from "@/features/attendance/constants";
import { openAttendanceSessionFromForm } from "@/features/attendance/server/actions";
import { getAttendanceHubData } from "@/features/attendance/server/queries";
import { formatDateVi } from "@/lib/dates";

const selectClassName = "h-11 w-full rounded-md border border-border bg-card px-3 text-sm";

/** Thứ Năm hoặc Chúa nhật gần nhất tính tới hôm nay (D-29). */
function mostRecentMeetingDate(): string {
  const today = new Date();
  for (let back = 0; back < 7; back += 1) {
    const candidate = new Date(today);
    candidate.setDate(today.getDate() - back);
    const day = candidate.getDay();
    if (day === 4 || day === 0) return candidate.toISOString().slice(0, 10);
  }
  return today.toISOString().slice(0, 10);
}

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { year, editableClasses, sessions } = await getAttendanceHubData();

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

  const defaultDate = mostRecentMeetingDate();
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
                Bạn chưa được phân công lớp nào nên không mở được buổi điểm danh. Trưởng ngành chỉ
                điểm danh trực tiếp ở lớp mình đứng.
              </p>
            ) : (
              <form action={openAttendanceSessionFromForm} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="attendance-class">Lớp</Label>
                  <select id="attendance-class" name="classId" required className={selectClassName}>
                    {editableClasses.map((option) => (
                      <option key={option.id} value={option.id}>{option.displayName}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="attendance-date">Ngày</Label>
                  <Input id="attendance-date" name="date" type="date" defaultValue={defaultDate} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="attendance-meeting">Buổi</Label>
                  <select id="attendance-meeting" name="meetingType" required className={selectClassName} defaultValue={defaultMeeting}>
                    <option value="thursday">{MEETING_TYPE_LABELS.thursday}</option>
                    <option value="sunday">{MEETING_TYPE_LABELS.sunday}</option>
                  </select>
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
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3 hover:bg-surface-muted"
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
                      <Badge variant="warning">{session.absentCount} vắng</Badge>
                    ) : null}
                    <Badge variant={session.status === "completed" ? "success" : "secondary"}>
                      {SESSION_STATUS_LABELS[session.status]}
                    </Badge>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
