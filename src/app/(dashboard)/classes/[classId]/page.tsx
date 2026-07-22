import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { enrollStudentFromForm, endEnrollmentFromForm } from "@/features/enrollments/server/actions";
import { getClassDetail } from "@/features/classes/server/queries";

const selectClassName = "h-11 w-full rounded-md border border-border bg-card px-3 text-sm";
const capacityLabels: Record<string, string> = { representative: "GLV đại diện", member: "GLV lớp", trainee: "Dự trưởng phụ tá" };

export default async function ClassDetailPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  const { classDetail, canManage } = await getClassDetail(classId);
  if (!classDetail) notFound();

  const today = new Date().toISOString().slice(0, 10);

  return (
    <PageContainer>
      <PageHeader
        title={classDetail.displayName}
        description={`${classDetail.sectorName ?? "Dự trưởng"} · Năm học ${classDetail.academicYearCode}`}
        action={
          <Link href="/classes" className="text-sm text-muted-foreground hover:text-foreground">
            ← Danh sách lớp
          </Link>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Danh sách thiếu nhi</CardTitle>
            <CardDescription>Sĩ số đang sinh hoạt: {classDetail.roster.length}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {classDetail.roster.length === 0 ? (
              <p className="text-sm text-muted-foreground">Lớp chưa có thiếu nhi ghi danh.</p>
            ) : (
              classDetail.roster.map((item) => (
                <div key={item.enrollmentId} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3">
                  <Link href={`/students/${item.studentId}`} className="text-sm font-medium hover:underline">
                    {item.saintName} {item.fullName}
                  </Link>
                  {canManage ? (
                    <form action={endEnrollmentFromForm} className="flex flex-wrap items-end gap-2">
                      <input type="hidden" name="enrollmentId" value={item.enrollmentId} />
                      <select name="status" className="h-9 rounded-md border border-border bg-card px-2 text-xs" defaultValue="withdrawn">
                        <option value="withdrawn">Rút</option>
                        <option value="completed">Hoàn thành</option>
                        <option value="transferred">Chuyển</option>
                        <option value="paused">Tạm nghỉ</option>
                      </select>
                      <Input name="endedOn" type="date" defaultValue={today} className="h-9 w-40" required />
                      <Button type="submit" variant="outline" size="sm">Kết thúc</Button>
                    </form>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Đội ngũ lớp</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {classDetail.team.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa phân công nhân sự.</p>
              ) : (
                classDetail.team.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-2 text-sm">
                    <span>{item.name}</span>
                    <Badge variant={item.capacity === "representative" ? "success" : "secondary"}>
                      {capacityLabels[item.capacity] ?? item.capacity}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {canManage ? (
            <Card>
              <CardHeader>
                <CardTitle>Ghi danh thiếu nhi</CardTitle>
                <CardDescription>Mỗi em chỉ có một lớp đang mở trong năm học.</CardDescription>
              </CardHeader>
              <CardContent>
                {classDetail.availableStudents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Không còn thiếu nhi nào chưa ghi danh trong năm học.</p>
                ) : (
                  <form action={enrollStudentFromForm} className="space-y-3">
                    <input type="hidden" name="classId" value={classDetail.id} />
                    <div className="space-y-2">
                      <Label htmlFor="enroll-student">Thiếu nhi</Label>
                      <select id="enroll-student" name="studentId" required className={selectClassName}>
                        <option value="">Chọn thiếu nhi</option>
                        {classDetail.availableStudents.map((student) => (
                          <option key={student.id} value={student.id}>{student.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="enroll-date">Ngày ghi danh</Label>
                      <Input id="enroll-date" name="enrolledOn" type="date" defaultValue={today} required />
                    </div>
                    <Button type="submit" className="w-full">Ghi danh</Button>
                  </form>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </PageContainer>
  );
}
