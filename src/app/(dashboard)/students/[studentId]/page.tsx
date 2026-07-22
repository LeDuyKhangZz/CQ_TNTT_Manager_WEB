import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { formatDateVi } from "@/lib/dates";
import {
  createSacramentFromForm,
  saveHealthProfileFromForm,
  updateStudentFromForm,
} from "@/features/students/server/actions";
import { getStudentDetail } from "@/features/students/server/queries";

const selectClassName = "h-11 w-full rounded-md border border-border bg-card px-3 text-sm";
const textareaClassName = "min-h-[80px] w-full rounded-md border border-border bg-card px-3 py-2 text-sm";

const statusLabels: Record<string, string> = {
  active: "Đang sinh hoạt",
  temporarily_inactive: "Tạm nghỉ",
  withdrawn: "Đã rút",
  archived: "Lưu trữ",
};
const genderLabels: Record<string, string> = { male: "Nam", female: "Nữ", other: "Khác" };
const sacramentLabels: Record<string, string> = {
  baptism: "Rửa tội",
  first_confession: "Xưng tội lần đầu",
  first_communion: "Rước lễ lần đầu",
  confirmation: "Thêm sức",
  profession: "Tuyên hứa",
  other: "Khác",
};

type TabKey = "overview" | "history" | "sacraments" | "health";

const enrollmentStatusLabels: Record<string, string> = {
  active: "Đang học",
  paused: "Tạm nghỉ",
  completed: "Hoàn thành",
  repeating: "Học lại",
  transferred: "Chuyển lớp",
  withdrawn: "Đã rút",
};

function tabHref(studentId: string, tab: TabKey): string {
  return tab === "overview" ? `/students/${studentId}` : `/students/${studentId}?tab=${tab}`;
}

export default async function StudentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { studentId } = await params;
  const { tab } = await searchParams;
  const { student, canWrite, canViewSensitive } = await getStudentDetail(studentId);

  if (!student) notFound();

  const activeTab: TabKey =
    tab === "sacraments" || tab === "health" || tab === "history" ? (tab as TabKey) : "overview";

  const tabs: Array<{ key: TabKey; label: string; visible: boolean }> = [
    { key: "overview", label: "Tổng quan", visible: true },
    { key: "history", label: "Lịch sử lớp", visible: true },
    { key: "sacraments", label: "Bí tích", visible: canViewSensitive },
    { key: "health", label: "Sức khỏe", visible: canViewSensitive },
  ];

  return (
    <PageContainer>
      <PageHeader
        title={`${student.saintName} ${student.fullName}`}
        description={`Mã thiếu nhi ${student.studentCode}`}
        action={
          <Link href="/students" className="text-sm text-muted-foreground hover:text-foreground">
            ← Danh sách thiếu nhi
          </Link>
        }
      />

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div>
            <p className="text-sm text-muted-foreground">Người giám hộ</p>
            <p className="font-medium">
              {student.guardian ? `${student.guardian.fullName} · ${student.guardian.phone}` : "Chưa gán"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {student.hardshipFlag ? <Badge variant="warning">Hoàn cảnh khó khăn</Badge> : null}
            <Badge variant={student.status === "active" ? "success" : "secondary"}>
              {statusLabels[student.status] ?? student.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <nav className="flex flex-wrap gap-1 border-b border-border">
        {tabs
          .filter((item) => item.visible)
          .map((item) => (
            <Link
              key={item.key}
              href={tabHref(studentId, item.key)}
              className={`min-h-[44px] rounded-t-md px-4 py-2 text-sm font-medium ${
                activeTab === item.key
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
      </nav>

      {activeTab === "overview" ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Tên thánh: </span>{student.saintName}</p>
              <p><span className="text-muted-foreground">Họ tên: </span>{student.fullName}</p>
              <p><span className="text-muted-foreground">Giới tính: </span>{genderLabels[student.gender] ?? student.gender}</p>
              <p><span className="text-muted-foreground">Ngày sinh: </span>{formatDateVi(student.dateOfBirth)}</p>
              <p>
                <span className="text-muted-foreground">Bổn mạng: </span>
                {student.patronFeastDate ? formatDateVi(student.patronFeastDate) : "—"}
              </p>
              <p><span className="text-muted-foreground">Điện thoại: </span>{student.phone ?? "—"}</p>
              <p><span className="text-muted-foreground">Địa chỉ: </span>{student.address ?? "—"}</p>
              <p><span className="text-muted-foreground">Ghi chú: </span>{student.generalNotes ?? "—"}</p>
            </CardContent>
          </Card>

          {canWrite ? (
            <Card>
              <CardHeader>
                <CardTitle>Cập nhật hồ sơ</CardTitle>
                <CardDescription>Chỉnh sửa thông tin cơ bản của thiếu nhi.</CardDescription>
              </CardHeader>
              <CardContent>
                <form action={updateStudentFromForm} className="space-y-3">
                  <input type="hidden" name="id" value={student.id} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="edit-saint">Tên thánh</Label>
                      <Input id="edit-saint" name="saintName" defaultValue={student.saintName} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-gender">Giới tính</Label>
                      <select id="edit-gender" name="gender" defaultValue={student.gender} className={selectClassName}>
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                        <option value="other">Khác</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Họ tên</Label>
                    <Input id="edit-name" name="fullName" defaultValue={student.fullName} required />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="edit-dob">Ngày sinh</Label>
                      <Input id="edit-dob" name="dateOfBirth" type="date" defaultValue={student.dateOfBirth} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-feast">Bổn mạng</Label>
                      <Input id="edit-feast" name="patronFeastDate" type="date" defaultValue={student.patronFeastDate ?? ""} />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="edit-phone">Điện thoại</Label>
                      <Input id="edit-phone" name="phone" defaultValue={student.phone ?? ""} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-status">Trạng thái</Label>
                      <select id="edit-status" name="status" defaultValue={student.status} className={selectClassName}>
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-address">Địa chỉ</Label>
                    <Input id="edit-address" name="address" defaultValue={student.address ?? ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-notes">Ghi chú</Label>
                    <textarea id="edit-notes" name="generalNotes" defaultValue={student.generalNotes ?? ""} className={textareaClassName} />
                  </div>
                  <label className="flex items-center gap-2 text-sm" htmlFor="edit-hardship">
                    <input id="edit-hardship" name="hardshipFlag" type="checkbox" defaultChecked={student.hardshipFlag} className="h-4 w-4" />
                    Hoàn cảnh khó khăn
                  </label>
                  <Button type="submit" className="w-full">Lưu thay đổi</Button>
                </form>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}

      {activeTab === "history" ? (
        <Card>
          <CardHeader>
            <CardTitle>Lịch sử lớp</CardTitle>
            <CardDescription>Ghi danh theo từng năm học.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {student.enrollments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có ghi danh nào.</p>
            ) : (
              student.enrollments.map((item) => (
                <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3 text-sm">
                  <div>
                    <p className="font-medium">{item.className}</p>
                    <p className="text-muted-foreground">
                      Năm học {item.academicYearCode} · từ {formatDateVi(item.enrolledOn)}
                      {item.endedOn ? ` đến ${formatDateVi(item.endedOn)}` : ""}
                    </p>
                  </div>
                  <Badge variant={item.status === "active" ? "success" : "secondary"}>
                    {enrollmentStatusLabels[item.status] ?? item.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "sacraments" && canViewSensitive ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Bí tích đã lãnh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {student.sacraments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có thông tin bí tích.</p>
              ) : (
                student.sacraments.map((item) => (
                  <div key={item.id} className="rounded-md border border-border p-3 text-sm">
                    <p className="font-medium">
                      {item.sacramentType === "other" ? item.sacramentName : sacramentLabels[item.sacramentType]}
                    </p>
                    <p className="text-muted-foreground">
                      {item.sacramentDate ? formatDateVi(item.sacramentDate) : "Chưa rõ ngày"}
                      {item.place ? ` · ${item.place}` : ""}
                    </p>
                    {item.godparentName ? <p className="text-muted-foreground">Người đỡ đầu: {item.godparentName}</p> : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {canWrite ? (
            <Card>
              <CardHeader>
                <CardTitle>Thêm bí tích</CardTitle>
              </CardHeader>
              <CardContent>
                <form action={createSacramentFromForm} className="space-y-3">
                  <input type="hidden" name="studentId" value={student.id} />
                  <div className="space-y-2">
                    <Label htmlFor="sac-type">Loại bí tích</Label>
                    <select id="sac-type" name="sacramentType" className={selectClassName}>
                      {Object.entries(sacramentLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sac-name">Tên (nếu chọn Khác)</Label>
                    <Input id="sac-name" name="sacramentName" />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="sac-date">Ngày lãnh</Label>
                      <Input id="sac-date" name="sacramentDate" type="date" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sac-place">Nơi lãnh</Label>
                      <Input id="sac-place" name="place" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sac-godparent">Người đỡ đầu</Label>
                    <Input id="sac-godparent" name="godparentName" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sac-registry">Số sổ</Label>
                    <Input id="sac-registry" name="registryNumber" />
                  </div>
                  <Button type="submit" className="w-full">Lưu bí tích</Button>
                </form>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}

      {activeTab === "health" && canViewSensitive ? (
        <Card>
          <CardHeader>
            <CardTitle>Sức khỏe</CardTitle>
            <CardDescription>Thông tin nhạy cảm, chỉ nhân sự có quyền xem.</CardDescription>
          </CardHeader>
          <CardContent>
            {canWrite ? (
              <form action={saveHealthProfileFromForm} className="space-y-3">
                <input type="hidden" name="studentId" value={student.id} />
                <div className="space-y-2">
                  <Label htmlFor="health-allergies">Dị ứng</Label>
                  <textarea id="health-allergies" name="allergies" defaultValue={student.health?.allergies ?? ""} className={textareaClassName} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="health-conditions">Bệnh lý</Label>
                  <textarea id="health-conditions" name="medicalConditions" defaultValue={student.health?.medicalConditions ?? ""} className={textareaClassName} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="health-medications">Thuốc đang dùng</Label>
                  <textarea id="health-medications" name="medications" defaultValue={student.health?.medications ?? ""} className={textareaClassName} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="health-emergency">Ghi chú khẩn cấp</Label>
                  <textarea id="health-emergency" name="emergencyNotes" defaultValue={student.health?.emergencyNotes ?? ""} className={textareaClassName} />
                </div>
                <Button type="submit" className="w-full">Lưu thông tin sức khỏe</Button>
              </form>
            ) : (
              <div className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">Dị ứng: </span>{student.health?.allergies ?? "—"}</p>
                <p><span className="text-muted-foreground">Bệnh lý: </span>{student.health?.medicalConditions ?? "—"}</p>
                <p><span className="text-muted-foreground">Thuốc: </span>{student.health?.medications ?? "—"}</p>
                <p><span className="text-muted-foreground">Ghi chú khẩn cấp: </span>{student.health?.emergencyNotes ?? "—"}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </PageContainer>
  );
}
