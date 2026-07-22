import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTimeVi, formatDateVi } from "@/lib/dates";
import type { DashboardData } from "../server/queries";

function percent(value: number | null): string {
  return value === null ? "—" : `${Math.round(value * 1000) / 10}%`;
}

function KpiTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function DashboardOverview({ data }: { data: DashboardData }) {
  const isStaff = data.audience === "staff";

  if (!data.kpis) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Chưa có năm học nào đang diễn ra. Vào{" "}
          <Link href="/admin" className="underline">Quản trị hệ thống</Link> để đặt năm học hiện hành.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <section aria-label="Chỉ số năm học" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile label="Thiếu nhi" value={String(data.kpis.studentCount)} hint={`Năm học ${data.kpis.academicYearCode}`} />
        {isStaff ? <KpiTile label="Giáo lý viên" value={String(data.kpis.staffCount)} /> : null}
        {isStaff ? <KpiTile label="Lớp" value={String(data.kpis.classCount)} /> : null}
        <KpiTile
          label="Tỷ lệ dự lễ"
          value={percent(data.kpis.massRate)}
          hint={data.kpis.lastSessionDate ? `Tính tới ${formatDateVi(data.kpis.lastSessionDate)}` : "Chưa có buổi đã chốt"}
        />
        <KpiTile label="Tỷ lệ học giáo lý" value={percent(data.kpis.catechismRate)} />
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cần quan tâm</CardTitle>
            <CardDescription>{data.kpis.warnedStudentCount} em đang có cảnh báo chuyên cần.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.atRisk.length === 0 ? (
              <p className="text-sm text-muted-foreground">Không có em nào cần lưu ý trong phạm vi của bạn.</p>
            ) : (
              <ul className="divide-y divide-border">
                {data.atRisk.map((student) => (
                  <li key={student.studentId} className="py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link href={`/students/${student.studentId}`} className="text-sm font-medium hover:underline">
                        {student.displayName}
                      </Link>
                      <Badge variant="warning">{student.className ?? "—"}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {student.reasons.join(", ")}
                      {student.weightedAverage !== null ? ` · TB ${student.weightedAverage}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Buổi học sắp tới</CardTitle>
            <CardDescription>Ba tuần tới, kèm các buổi có kiểm tra.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có bài nào được xếp lịch.</p>
            ) : (
              <ul className="divide-y divide-border">
                {data.upcoming.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.className} · {formatDateVi(item.plannedDate)}</p>
                    </div>
                    {item.isAssessment ? <Badge variant="danger">Kiểm tra</Badge> : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sinh nhật và bổn mạng</CardTitle>
            <CardDescription>Trong 30 ngày tới.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.celebrations.length === 0 ? (
              <p className="text-sm text-muted-foreground">Không có dịp nào sắp tới.</p>
            ) : (
              <ul className="divide-y divide-border">
                {data.celebrations.map((item) => (
                  <li key={`${item.studentId}-${item.kind}`} className="flex items-center justify-between gap-2 py-3">
                    <span className="text-sm">{item.displayName}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.kind === "birthday" ? "Sinh nhật" : "Bổn mạng"} · {formatDateVi(item.nextOccurrence)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Thông báo mới</CardTitle></CardHeader>
          <CardContent>
            {data.latestNotifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có thông báo nào.</p>
            ) : (
              <ul className="divide-y divide-border">
                {data.latestNotifications.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <Link href="/notifications" className="text-sm hover:underline">{item.title}</Link>
                    <span className="text-xs text-muted-foreground">
                      {item.readAt === null ? "Chưa đọc · " : ""}{formatDateTimeVi(item.publishedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {isStaff ? (
          <Card>
            <CardHeader><CardTitle>Công việc Ban</CardTitle></CardHeader>
            <CardContent>
              {data.committeeTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ban của bạn chưa đăng công việc tuần.</p>
              ) : (
                <ul className="space-y-3">
                  {data.committeeTasks.map((task) => (
                    <li key={`${task.committeeName}-${task.weekStart}`}>
                      <p className="text-sm font-medium">{task.committeeName} · tuần {formatDateVi(task.weekStart)}</p>
                      <ul className="mt-1 list-inside list-disc text-sm text-muted-foreground">
                        {task.checklist.map((entry, index) => <li key={`${task.weekStart}-${index}`}>{entry}</li>)}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ) : null}

        {isStaff ? (
          <Card>
            <CardHeader><CardTitle>Hồ sơ thiếu dữ liệu</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-2xl font-semibold">{data.incompleteProfileCount}</p>
              <p className="text-muted-foreground">
                Hồ sơ còn thiếu số điện thoại phụ huynh, bổn mạng hoặc địa chỉ.
              </p>
              <Link href="/students" className="text-primary hover:underline">Mở danh sách thiếu nhi</Link>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
