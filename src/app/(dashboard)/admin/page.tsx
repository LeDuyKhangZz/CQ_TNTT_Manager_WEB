import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { requireRouteAccess } from "@/lib/auth/guards";
import {
  createAcademicYearFromForm,
  generateDefaultClassesFromForm,
  setCurrentAcademicYearFromForm,
  updateAttendanceSettingsFromForm,
} from "@/features/academic-years/server/actions";
import {
  getCurrentAttendanceSettings,
  listAcademicYears,
} from "@/features/academic-years/server/queries";
import { getAccountAdminOptions } from "@/features/auth/server/queries";
import { AccountAdminPanel } from "@/features/auth/components/account-admin-panel";

export default async function AdminPage() {
  await requireRouteAccess("/admin");
  const [academicYears, accountOptions, attendanceSettings] = await Promise.all([
    listAcademicYears(),
    getAccountAdminOptions(),
    getCurrentAttendanceSettings(),
  ]);

  return (
    <PageContainer>
      <PageHeader title="Quản trị hệ thống" description="Cấu hình năm học và khởi tạo cơ cấu 19 lớp chuẩn." />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Năm học</CardTitle>
            <CardDescription>Mỗi thời điểm chỉ có một năm học hiện hành.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {academicYears.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có năm học. Tạo năm học đầu tiên bằng biểu mẫu bên cạnh.</p>
            ) : academicYears.map((year) => (
              <div key={year.id} className="rounded-md border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{year.name}</p>
                    <p className="text-sm text-muted-foreground">{year.code} · {year.start_date} → {year.end_date} · {year.classCount}/19 lớp</p>
                  </div>
                  <Badge variant={year.status === "current" ? "success" : "secondary"}>{year.status}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <form action={generateDefaultClassesFromForm}>
                    <input type="hidden" name="academicYearId" value={year.id} />
                    <Button type="submit" variant="outline" size="sm">Sinh lớp mặc định</Button>
                  </form>
                  {year.status === "draft" ? (
                    <form action={setCurrentAcademicYearFromForm}>
                      <input type="hidden" name="academicYearId" value={year.id} />
                      <Button type="submit" size="sm">Đặt hiện hành</Button>
                    </form>
                  ) : null}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tạo năm học</CardTitle>
            <CardDescription>Năm mới được tạo ở trạng thái nháp; hãy sinh lớp trước khi đặt hiện hành.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createAcademicYearFromForm} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="academic-code">Mã năm học</Label>
                <Input id="academic-code" name="code" placeholder="2026-2027" required pattern="[0-9]{4}-[0-9]{4}" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="academic-name">Tên hiển thị</Label>
                <Input id="academic-name" name="name" placeholder="Năm học 2026–2027" required />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="academic-start">Ngày bắt đầu</Label>
                  <Input id="academic-start" name="startDate" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="academic-end">Ngày kết thúc</Label>
                  <Input id="academic-end" name="endDate" type="date" required />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="lock-days">Khóa điểm danh (ngày)</Label>
                  <Input id="lock-days" name="attendanceLockDays" type="number" min="0" max="30" defaultValue="3" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lease-minutes">Lease chỉnh sửa (phút)</Label>
                  <Input id="lease-minutes" name="attendanceEditLeaseMinutes" type="number" min="1" max="60" defaultValue="15" required />
                </div>
              </div>
              <label className="flex min-h-11 items-center gap-3 text-sm">
                <input name="top5Enabled" type="checkbox" className="h-5 w-5 rounded border-border" />
                Bật tính năng Top 5 cho năm học
              </label>
              <Button type="submit" className="w-full">Tạo năm học nháp</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cấu hình điểm danh</CardTitle>
            <CardDescription>
              Áp dụng cho năm học hiện hành. Ngưỡng cảnh báo dùng cho bảng chuyên cần và trang
              phụ huynh; đổi ở đây có hiệu lực ngay, không cần sửa mã nguồn.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {attendanceSettings === null ? (
              <p className="text-sm text-muted-foreground">
                Chưa có năm học hiện hành. Đặt một năm học thành hiện hành trước.
              </p>
            ) : (
              <form action={updateAttendanceSettingsFromForm} className="space-y-4">
                <input type="hidden" name="academicYearId" value={attendanceSettings.id} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="settings-lock-days">Khóa điểm danh sau (ngày)</Label>
                    <Input id="settings-lock-days" name="attendanceLockDays" type="number" min="0" max="30" defaultValue={attendanceSettings.attendance_lock_days} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="settings-lease">Phiên chỉnh sửa (phút)</Label>
                    <Input id="settings-lease" name="attendanceEditLeaseMinutes" type="number" min="1" max="60" defaultValue={attendanceSettings.attendance_edit_lease_minutes} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="settings-absences">Cảnh báo khi vắng liên tiếp (buổi)</Label>
                    <Input id="settings-absences" name="warningConsecutiveAbsences" type="number" min="1" max="20" defaultValue={attendanceSettings.attendance_warning_consecutive_absences} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="settings-sundays">Cảnh báo khi vắng lễ liên tiếp (Chúa nhật)</Label>
                    <Input id="settings-sundays" name="warningConsecutiveSundays" type="number" min="1" max="20" defaultValue={attendanceSettings.attendance_warning_consecutive_sundays} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="settings-rate">Cảnh báo khi tỷ lệ chuyên cần dưới (%)</Label>
                  <Input id="settings-rate" name="warningRatePercent" type="number" min="1" max="100" defaultValue={Math.round(Number(attendanceSettings.attendance_warning_rate_threshold) * 100)} required />
                </div>
                <Button type="submit" className="w-full">Lưu cấu hình</Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
      <AccountAdminPanel options={accountOptions} />
    </PageContainer>
  );
}
