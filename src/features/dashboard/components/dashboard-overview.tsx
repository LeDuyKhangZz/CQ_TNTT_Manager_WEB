import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDateTimeVi, formatDateVi } from "@/lib/dates";
import type { DashboardData } from "../server/queries";

function percent(value: number | null): string {
  return value === null ? "—" : `${Math.round(value * 1000) / 10}%`;
}

function KpiTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-ink">{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink-muted">{hint}</p> : null}
    </Card>
  );
}

/**
 * TB-03 — trang tổng quan phân nhánh theo `audience` **ngay từ đầu**, không rắc
 * cờ `isStaff` vào từng thẻ.
 *
 * 🔴 Bản cũ bọc đúng **ba** thẻ bằng `isStaff` và bỏ sót thẻ "Cần quan tâm", nên
 * phụ huynh mở trang chủ, thấy tên con mình đang bị cảnh báo chuyên cần, bấm
 * vào — và bị đá sang `/access-denied` vì liên kết trỏ `/students/<id>`, một
 * route chỉ dành cho nhân sự. Không có đường nào khác từ đó: **ngõ cụt**
 * (`03_AUDIT_RESULTS` §4.3). Gốc rễ là *"dashboard được thiết kế như MỘT màn
 * hình dùng chung với vài chỗ ẩn/hiện"* trong khi `docs/06` §7 đã tách sẵn bốn
 * bố cục.
 *
 * Nên đích đến của một cái tên **suy từ audience**, ở một chỗ duy nhất:
 *   · nhân sự → `/students/<id>` (hồ sơ đầy đủ)
 *   · phụ huynh → `/parent/children/<id>` (hồ sơ con, cổng phụ huynh)
 *   · thiếu nhi → `/student/attendance` (điểm danh của chính em)
 */
function atRiskHref(audience: DashboardData["audience"], studentId: string): string {
  if (audience === "guardian") return `/parent/children/${studentId}`;
  if (audience === "student") return "/student/attendance";
  return `/students/${studentId}`;
}

export function DashboardOverview({ data }: { data: DashboardData }) {
  const isStaff = data.audience === "staff";
  const isGuardian = data.audience === "guardian";
  const isStudent = data.audience === "student";
  // D-170 — Thủ quỹ đọc được SỐ, không đọc được TÊN. Các thẻ danh sách bên dưới
  // sẽ rỗng với họ, và một thẻ rỗng ở đây **không** có nghĩa "không có gì" mà có
  // nghĩa "bạn không được xem" — hai chuyện khác nhau mà bản cũ in ra cùng một
  // câu, đúng lỗi mà `03_AUDIT_RESULTS` tiêu chí 2 chấm 3/5. Nên thay vì hiện
  // một danh sách rỗng nói dối, nói thẳng ranh giới ra.
  const aggregateOnly = data.aggregateOnly;
  const showNamedLists = isStaff && !aggregateOnly;

  // AC-B03 — nhãn KPI mang đúng nghĩa của người đang xem. "Thiếu nhi: 2" trên
  // trang của một phụ huynh có hai con là một con số đúng dưới một cái tên sai.
  const studentTileLabel = isGuardian ? "Con của tôi" : "Thiếu nhi";
  const massRateLabel = isGuardian
    ? "Tỷ lệ dự lễ của con"
    : isStudent
      ? "Tỷ lệ dự lễ của tôi"
      : "Tỷ lệ dự lễ";
  const catechismRateLabel = isGuardian
    ? "Tỷ lệ học giáo lý của con"
    : isStudent
      ? "Tỷ lệ học giáo lý của tôi"
      : "Tỷ lệ học giáo lý";
  const atRiskTitle = isStaff ? "Cần quan tâm" : "Nhắc nhở chuyên cần";

  if (!data.kpis) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-ink-muted">
          Chưa có năm học nào đang diễn ra.{" "}
          {/* F05 (`04_TO_BE_FLOWS` §6) — chỉ Quản trị viên hệ thống vào được
              `/admin`, nên với mọi vai trò khác đây từng là một liên kết dẫn
              thẳng tới `/access-denied` ngay trên màn hình đầu tiên. */}
          {data.canOpenAdmin ? (
            <>
              Vào <Link href="/admin" className="underline">Quản trị hệ thống</Link> để đặt năm học hiện hành.
            </>
          ) : (
            <>Xin liên hệ Ban quản trị Xứ đoàn để mở năm học mới.</>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* N-2 (`07_IMPLEMENTATION_IMPACT` §5) — bảy truy vấn của trang này từng
          bỏ qua `error` của Supabase, nên một mục hỏng hiện y hệt một mục rỗng.
          Nay hỏng thì NÓI RA, và nói ra ở đầu trang chứ không ở chỗ cái thẻ
          rỗng, vì người dùng không có cách nào biết thẻ nào lẽ ra có dữ liệu. */}
      {data.hasLoadError ? (
        <FormMessage tone="danger">
          Không tải được một số mục của trang tổng quan. Số liệu hiển thị có thể chưa đủ — xin tải lại trang.
        </FormMessage>
      ) : null}

      <section aria-label="Chỉ số năm học" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {isStudent ? null : (
          <KpiTile
            label={studentTileLabel}
            value={String(data.kpis.studentCount)}
            hint={`Năm học ${data.kpis.academicYearCode}`}
          />
        )}
        {isStaff ? <KpiTile label="Giáo lý viên" value={String(data.kpis.staffCount)} /> : null}
        {isStaff ? <KpiTile label="Lớp" value={String(data.kpis.classCount)} /> : null}
        <KpiTile
          label={massRateLabel}
          value={percent(data.kpis.massRate)}
          hint={data.kpis.lastSessionDate ? `Tính tới ${formatDateVi(data.kpis.lastSessionDate)}` : "Chưa có buổi đã chốt"}
        />
        <KpiTile label={catechismRateLabel} value={percent(data.kpis.catechismRate)} />
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        {aggregateOnly ? (
          <Card>
            <CardHeader>
              <CardTitle as="h2">Cần quan tâm</CardTitle>
              <CardDescription>Số liệu tổng hợp của cả xứ đoàn.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-2xl font-semibold text-ink">{data.kpis.warnedStudentCount}</p>
              <p className="text-ink-muted">
                em đang có cảnh báo chuyên cần. Vai trò Thủ quỹ xem được số tổng hợp;
                danh sách tên từng em thuộc quyền của Ban điều hành và giáo lý viên phụ trách.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {/* Phụ huynh và thiếu nhi VẪN thấy thẻ này (nó liệt kê con của chính họ),
            nên điều kiện là `!aggregateOnly` chứ không phải `isStaff`. */}
        {!aggregateOnly ? (
          <Card>
            <CardHeader>
              <CardTitle as="h2">{atRiskTitle}</CardTitle>
              <CardDescription>
                {isStaff
                  ? `${data.kpis.warnedStudentCount} em đang có cảnh báo chuyên cần.`
                  : "Những buổi vắng liên tiếp mà Xứ đoàn đang lưu ý."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.atRisk.length === 0 ? (
                <p className="text-sm text-ink-muted">
                  {isStaff
                    ? "Không có em nào cần lưu ý trong phạm vi của bạn."
                    : "Không có nhắc nhở nào."}
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {data.atRisk.map((student) => (
                    <li key={student.studentId} className="py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Link
                          href={atRiskHref(data.audience, student.studentId)}
                          className="min-h-11 text-sm font-medium hover:underline"
                        >
                          {student.displayName}
                        </Link>
                        <Badge variant="warning">{student.className ?? "—"}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-ink-muted">
                        {student.reasons.join(", ")}
                        {student.weightedAverage !== null ? ` · TB ${student.weightedAverage}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ) : null}

        {!aggregateOnly ? (
          <Card>
            <CardHeader>
              <CardTitle as="h2">Buổi học sắp tới</CardTitle>
              <CardDescription>Ba tuần tới, kèm các buổi có kiểm tra.</CardDescription>
            </CardHeader>
            <CardContent>
              {data.upcoming.length === 0 ? (
                <p className="text-sm text-ink-muted">Chưa có bài nào được xếp lịch.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {data.upcoming.map((item) => (
                    <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink">{item.title}</p>
                        <p className="text-xs text-ink-muted">{item.className} · {formatDateVi(item.plannedDate)}</p>
                      </div>
                      {item.isAssessment ? <Badge variant="danger">Kiểm tra</Badge> : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ) : null}

        {/* Danh sách sinh nhật/bổn mạng của **cả lớp** là dữ liệu của người khác:
            giữ cho nhân sự, bỏ khỏi bố cục cổng (docs/06 §7 không có thẻ này cho
            phụ huynh/thiếu nhi). */}
        {showNamedLists ? (
          <Card>
            <CardHeader>
              <CardTitle as="h2">Sinh nhật và bổn mạng</CardTitle>
              <CardDescription>Trong 30 ngày tới.</CardDescription>
            </CardHeader>
            <CardContent>
              {data.celebrations.length === 0 ? (
                <p className="text-sm text-ink-muted">Không có dịp nào sắp tới.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {data.celebrations.map((item) => (
                    <li key={`${item.studentId}-${item.kind}`} className="flex items-center justify-between gap-2 py-3">
                      <span className="text-sm text-ink">{item.displayName}</span>
                      <span className="text-xs text-ink-muted">
                        {item.kind === "birthday" ? "Sinh nhật" : "Bổn mạng"} · {formatDateVi(item.nextOccurrence)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader><CardTitle as="h2">Thông báo mới</CardTitle></CardHeader>
          <CardContent>
            {data.latestNotifications.length === 0 ? (
              <p className="text-sm text-ink-muted">Chưa có thông báo nào.</p>
            ) : (
              <ul className="divide-y divide-line">
                {data.latestNotifications.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <Link href="/notifications" className="min-h-11 text-sm hover:underline">{item.title}</Link>
                    <span className="text-xs text-ink-muted">
                      {item.readAt === null ? "Chưa đọc · " : ""}{formatDateTimeVi(item.publishedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {showNamedLists ? (
          <Card>
            <CardHeader><CardTitle as="h2">Công việc Ban</CardTitle></CardHeader>
            <CardContent>
              {data.committeeTasks.length === 0 ? (
                <p className="text-sm text-ink-muted">Ban của bạn chưa đăng công việc tuần.</p>
              ) : (
                <ul className="space-y-3">
                  {data.committeeTasks.map((task) => (
                    <li key={`${task.committeeName}-${task.weekStart}`}>
                      <p className="text-sm font-medium text-ink">{task.committeeName} · tuần {formatDateVi(task.weekStart)}</p>
                      <ul className="mt-1 list-inside list-disc text-sm text-ink-muted">
                        {task.checklist.map((entry, index) => <li key={`${task.weekStart}-${index}`}>{entry}</li>)}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ) : null}

        {showNamedLists ? (
          <Card>
            <CardHeader><CardTitle as="h2">Hồ sơ thiếu dữ liệu</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-2xl font-semibold text-ink">{data.incompleteProfileCount}</p>
              <p className="text-ink-muted">
                Hồ sơ còn thiếu số điện thoại phụ huynh, bổn mạng hoặc địa chỉ.
              </p>
              <Link href="/students" className="text-theme-accent-text hover:underline">Mở danh sách thiếu nhi</Link>
            </CardContent>
          </Card>
        ) : null}

        {/* Thiếu nhi không có `ChildrenLinks` như phụ huynh, nên đây là đường vào
            duy nhất tới trang điểm danh của chính em từ màn hình đầu tiên. */}
        {isStudent ? (
          <Card>
            <CardHeader><CardTitle as="h2">Điểm danh của tôi</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-ink-muted">Xem lại từng buổi Thánh lễ và Giáo lý đã được chốt.</p>
              <Link href="/student/attendance" className="text-theme-accent-text hover:underline">
                Mở trang điểm danh của tôi
              </Link>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {/* Trạng thái rỗng chuẩn (`09` §9) cho ca "chưa gắn hồ sơ": một thiếu nhi
          chưa được nối hồ sơ thấy mọi thẻ rỗng mà không hiểu vì sao. */}
      {isStudent && data.atRisk.length === 0 && data.kpis.massRate === null ? (
        <EmptyState
          variant="not-linked"
          title="Chưa có buổi điểm danh nào được chốt cho em"
          description="Khi giáo lý viên chốt buổi điểm danh đầu tiên, số liệu của em sẽ hiện ở đây."
        />
      ) : null}
    </div>
  );
}
