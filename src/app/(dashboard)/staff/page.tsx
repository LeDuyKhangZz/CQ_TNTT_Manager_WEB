import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import {
  assignStaffFromForm,
  createStaffFromForm,
  endStaffAssignmentFromForm,
} from "@/features/staff/server/actions";
import { getStaffPageData } from "@/features/staff/server/queries";

const selectClassName = "h-11 w-full rounded-md border border-border bg-card px-3 text-sm";
const writeRoles = ["super_admin", "group_leader", "deputy_group_leader", "secretary"];
const titleLabels: Record<string, string> = { anh: "Anh", chi: "Chị", di: "Dì", so: "Sơ", cha: "Cha", thay: "Thầy", other: "Khác" };
const capacityLabels: Record<string, string> = { representative: "Đại diện", member: "Giáo lý viên", trainee: "Dự trưởng" };

export default async function StaffPage() {
  const { context, staff, classes } = await getStaffPageData();
  const canWrite = context.role ? writeRoles.includes(context.role) : false;

  return (
    <PageContainer>
      <PageHeader title="Huynh trưởng/Giáo lý viên" description="Hồ sơ nhân sự và lịch sử phân công đứng lớp." />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
        <Card>
          <CardHeader><CardTitle>Danh sách nhân sự</CardTitle><CardDescription>Mỗi người chỉ có một lớp đang phục vụ tại một thời điểm.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {staff.length === 0 ? <p className="text-sm text-muted-foreground">Chưa có hồ sơ nhân sự trong phạm vi của bạn.</p> : staff.map((item) => (
              <div key={item.id} className="rounded-md border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div><p className="font-medium">{titleLabels[item.title]} {item.saintName ? `${item.saintName} ` : ""}{item.fullName}</p><p className="text-sm text-muted-foreground">{item.staffCode} · {item.phone} · Huấn luyện {item.formationLevel.toUpperCase()}</p></div>
                  <Badge variant={item.assignment ? "success" : "secondary"}>{item.assignment ? `${item.assignment.className} · ${capacityLabels[item.assignment.capacity]}` : "Chưa phân lớp"}</Badge>
                </div>
                {canWrite && item.assignment ? (
                  <form action={endStaffAssignmentFromForm} className="mt-3 flex flex-wrap items-end gap-2">
                    <input type="hidden" name="assignmentId" value={item.assignment.id} />
                    <div className="space-y-1"><Label htmlFor={`end-${item.id}`} className="text-xs">Ngày kết thúc</Label><Input id={`end-${item.id}`} name="endsOn" type="date" required className="w-44" /></div>
                    <Button type="submit" variant="outline" size="sm">Kết thúc phân công</Button>
                  </form>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>

        {canWrite ? <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle>Thêm nhân sự</CardTitle><CardDescription>Dì/Sơ là danh xưng, không phải role hệ thống.</CardDescription></CardHeader>
            <CardContent><form action={createStaffFromForm} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="staff-title">Danh xưng</Label><select id="staff-title" name="title" className={selectClassName}>{Object.entries(titleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><div className="space-y-2"><Label htmlFor="formation">Trình độ huấn luyện</Label><select id="formation" name="formationLevel" className={selectClassName}><option value="none">Chưa có</option><option value="i">I</option><option value="ii">II</option><option value="iii">III</option><option value="special">Đặc biệt</option></select></div></div>
              <div className="space-y-2"><Label htmlFor="staff-saint">Tên thánh</Label><Input id="staff-saint" name="saintName" /></div>
              <div className="space-y-2"><Label htmlFor="staff-name">Họ tên</Label><Input id="staff-name" name="fullName" required /></div>
              <div className="space-y-2"><Label htmlFor="staff-phone">Điện thoại</Label><Input id="staff-phone" name="phone" inputMode="tel" required /></div>
              <div className="space-y-2"><Label htmlFor="staff-birth">Ngày sinh</Label><Input id="staff-birth" name="dateOfBirth" type="date" /></div>
              <div className="space-y-2"><Label htmlFor="staff-email">Email</Label><Input id="staff-email" name="email" type="email" /></div>
              <div className="space-y-2"><Label htmlFor="staff-address">Địa chỉ</Label><Input id="staff-address" name="address" /></div>
              <Button type="submit" className="w-full">Tạo hồ sơ</Button>
            </form></CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Phân công vào lớp</CardTitle><CardDescription>Kết thúc phân công hiện tại trước khi chuyển lớp.</CardDescription></CardHeader>
            <CardContent><form action={assignStaffFromForm} className="space-y-3">
              <div className="space-y-2"><Label htmlFor="assign-staff">Nhân sự</Label><select id="assign-staff" name="staffProfileId" required className={selectClassName}><option value="">Chọn nhân sự</option>{staff.map((item) => <option key={item.id} value={item.id} disabled={Boolean(item.assignment)}>{item.staffCode} · {item.fullName}{item.assignment ? ` (${item.assignment.className})` : ""}</option>)}</select></div>
              <div className="space-y-2"><Label htmlFor="assign-class">Lớp</Label><select id="assign-class" name="classId" required className={selectClassName}><option value="">Chọn lớp</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
              <div className="space-y-2"><Label htmlFor="assign-capacity">Vai trò trong lớp</Label><select id="assign-capacity" name="capacity" className={selectClassName}><option value="representative">Giáo lý viên đại diện</option><option value="member">Giáo lý viên lớp</option><option value="trainee">Dự trưởng phụ tá</option></select></div>
              <div className="space-y-2"><Label htmlFor="assign-start">Ngày bắt đầu</Label><Input id="assign-start" name="startsOn" type="date" required /></div>
              <Button type="submit" className="w-full">Lưu phân công</Button>
            </form></CardContent>
          </Card>
        </div> : null}
      </div>
    </PageContainer>
  );
}
