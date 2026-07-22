import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { createGuardianFromForm } from "@/features/guardians/server/actions";
import { createStudentFromForm } from "@/features/students/server/actions";
import { getStudentsPageData } from "@/features/students/server/queries";

const selectClassName = "h-11 w-full rounded-md border border-border bg-card px-3 text-sm";

const statusLabels: Record<string, string> = {
  active: "Đang sinh hoạt",
  temporarily_inactive: "Tạm nghỉ",
  withdrawn: "Đã rút",
  archived: "Lưu trữ",
};

export default async function StudentsPage() {
  const { students, guardians, canWrite } = await getStudentsPageData();

  return (
    <PageContainer>
      <PageHeader title="Thiếu nhi" description="Hồ sơ thiếu nhi và người giám hộ." />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Danh sách thiếu nhi</CardTitle>
            <CardDescription>Mỗi em có một người giám hộ; một người giám hộ có thể có nhiều con.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {students.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có hồ sơ thiếu nhi trong phạm vi của bạn.</p>
            ) : (
              students.map((item) => (
                <Link
                  key={item.id}
                  href={`/students/${item.id}`}
                  className="block rounded-md border border-border p-4 transition-colors hover:border-primary/50 hover:bg-accent/40"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">
                        {item.saintName} {item.fullName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Giám hộ: {item.guardianName} · {item.guardianPhone}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {item.hardshipFlag ? <Badge variant="warning">Hoàn cảnh</Badge> : null}
                      <Badge variant={item.status === "active" ? "success" : "secondary"}>
                        {statusLabels[item.status] ?? item.status}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {canWrite ? (
          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle>Thêm người giám hộ</CardTitle>
                <CardDescription>Tạo phụ huynh trước khi thêm con.</CardDescription>
              </CardHeader>
              <CardContent>
                <form action={createGuardianFromForm} className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="guardian-name">Họ tên phụ huynh</Label>
                    <Input id="guardian-name" name="fullName" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guardian-phone">Điện thoại</Label>
                    <Input id="guardian-phone" name="phone" inputMode="tel" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guardian-address">Địa chỉ</Label>
                    <Input id="guardian-address" name="address" />
                  </div>
                  <Button type="submit" className="w-full">
                    Tạo phụ huynh
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Thêm thiếu nhi</CardTitle>
                <CardDescription>Mã thiếu nhi được cấp tự động.</CardDescription>
              </CardHeader>
              <CardContent>
                {guardians.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Vui lòng tạo người giám hộ trước.</p>
                ) : (
                  <form action={createStudentFromForm} className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="student-guardian">Người giám hộ</Label>
                      <select id="student-guardian" name="guardianId" required className={selectClassName}>
                        <option value="">Chọn phụ huynh</option>
                        {guardians.map((guardian) => (
                          <option key={guardian.id} value={guardian.id}>
                            {guardian.fullName} · {guardian.phone}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="student-saint">Tên thánh</Label>
                        <Input id="student-saint" name="saintName" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="student-gender">Giới tính</Label>
                        <select id="student-gender" name="gender" className={selectClassName}>
                          <option value="male">Nam</option>
                          <option value="female">Nữ</option>
                          <option value="other">Khác</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="student-name">Họ tên</Label>
                      <Input id="student-name" name="fullName" required />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="student-dob">Ngày sinh</Label>
                        <Input id="student-dob" name="dateOfBirth" type="date" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="student-feast">Ngày bổn mạng</Label>
                        <Input id="student-feast" name="patronFeastDate" type="date" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="student-phone">Điện thoại (nếu có)</Label>
                      <Input id="student-phone" name="phone" inputMode="tel" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="student-address">Địa chỉ</Label>
                      <Input id="student-address" name="address" />
                    </div>
                    <label className="flex items-center gap-2 text-sm" htmlFor="student-hardship">
                      <input id="student-hardship" name="hardshipFlag" type="checkbox" className="h-4 w-4" />
                      Hoàn cảnh khó khăn
                    </label>
                    <Button type="submit" className="w-full">
                      Tạo hồ sơ thiếu nhi
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </PageContainer>
  );
}
