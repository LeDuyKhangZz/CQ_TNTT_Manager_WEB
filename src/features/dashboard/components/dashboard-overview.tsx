import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { Section } from "@/components/ui/section";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDateTimeVi, formatDateVi } from "@/lib/dates";
import type { DashboardData } from "../server/queries";

function percent(value: number | null): string {
  return value === null ? "—" : `${Math.round(value * 1000) / 10}%`;
}

function SummaryValue({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0 px-4 py-3">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="mt-1 text-base font-semibold tabular-nums text-ink">
        {value}
        {hint ? <span className="mt-1 block text-sm font-normal text-ink-muted">{hint}</span> : null}
      </dd>
    </div>
  );
}

/** M11 TB-03: each audience must retain its own permitted destination. */
function atRiskHref(audience: DashboardData["audience"], studentId: string): string {
  if (audience === "guardian") return `/parent/children/${studentId}`;
  if (audience === "student") return "/student/attendance";
  return `/students/${studentId}`;
}

export function DashboardOverview({ data }: { data: DashboardData }) {
  const isStaff = data.audience === "staff";
  const isGuardian = data.audience === "guardian";
  const isStudent = data.audience === "student";
  // D-170: the treasurer sees aggregate values, never named student lists.
  const aggregateOnly = data.aggregateOnly;
  const showNamedLists = isStaff && !aggregateOnly;
  const studentLabel = isGuardian ? "Con của tôi" : "Thiếu nhi";
  const massRateLabel = isGuardian ? "Tỷ lệ dự lễ của con" : isStudent ? "Tỷ lệ dự lễ của tôi" : "Tỷ lệ dự lễ";
  const catechismRateLabel = isGuardian ? "Tỷ lệ học giáo lý của con" : isStudent ? "Tỷ lệ học giáo lý của tôi" : "Tỷ lệ học giáo lý";

  if (!data.kpis) {
    return (
      <Card>
        <CardContent className="pt-4 text-sm text-ink-muted">
          Chưa có năm học nào đang diễn ra.{" "}
          {data.canOpenAdmin ? (
            <>Vào <Link href="/admin" className="underline">Quản trị hệ thống</Link> để đặt năm học hiện hành.</>
          ) : (
            <>Xin liên hệ Ban quản trị Xứ đoàn để mở năm học mới.</>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {data.hasLoadError ? (
        <FormMessage tone="danger">
          Không tải được một số mục của trang tổng quan. Số liệu hiển thị có thể chưa đủ — xin tải lại trang.
        </FormMessage>
      ) : null}

      <div className={`grid items-start gap-6 ${aggregateOnly ? "" : "xl:grid-cols-2 xl:gap-8"}`}>
        <div className="min-w-0 space-y-5">
          {isStudent ? (
            <Section id="dashboard-self-attendance" title="Điểm danh của tôi">
              <div className="text-sm">
                <p className="text-ink-muted">Xem lại từng buổi Thánh lễ và Giáo lý đã được chốt.</p>
                <Link href="/student/attendance" className="inline-flex min-h-11 items-center text-theme-accent-text hover:underline">
                  Mở trang điểm danh của tôi
                </Link>
              </div>
            </Section>
          ) : null}

          <Section
            id="dashboard-attendance-attention"
            title={isStaff ? "Cần quan tâm" : "Nhắc nhở chuyên cần"}
            description={aggregateOnly
              ? "Số liệu tổng hợp của cả xứ đoàn."
              : isStaff
                ? `${data.kpis.warnedStudentCount} em đang có cảnh báo chuyên cần.`
                : "Những buổi vắng liên tiếp mà Xứ đoàn đang lưu ý."}
          >
            {aggregateOnly ? (
              <div className="max-w-3xl space-y-2 text-sm">
                <p className="font-semibold tabular-nums text-ink">{data.kpis.warnedStudentCount}</p>
                <p className="text-ink-muted">
                  em đang có cảnh báo chuyên cần. Vai trò Thủ quỹ xem được số tổng hợp;
                  danh sách tên từng em thuộc quyền của Ban điều hành và giáo lý viên phụ trách.
                </p>
              </div>
            ) : data.atRisk.length === 0 ? (
              <p className="text-sm text-ink-muted">
                {isStaff ? "Không có em nào cần lưu ý trong phạm vi của bạn." : "Không có nhắc nhở nào."}
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {data.atRisk.map((student) => (
                  <li key={student.studentId}>
                    <Link
                      href={atRiskHref(data.audience, student.studentId)}
                      aria-label={student.displayName}
                      className="flex min-h-11 flex-col gap-1 rounded-sm py-2 text-sm hover:bg-surface-muted"
                    >
                      <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <span className="min-w-0 break-words font-medium text-theme-accent-text">{student.displayName}</span>
                        <span className="text-ink-muted">{student.className ?? "—"}</span>
                      </span>
                      <span className="text-ink-muted">
                        {student.reasons.join(", ")}
                        {student.weightedAverage !== null ? ` · TB ${student.weightedAverage}` : ""}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {showNamedLists ? (
            <Section id="dashboard-incomplete-profiles" title="Hồ sơ thiếu dữ liệu">
              <div className="text-sm">
                <p className="text-ink-muted">
                  <span className="font-semibold tabular-nums text-ink">{data.incompleteProfileCount}</span> hồ sơ còn thiếu số điện thoại phụ huynh, bổn mạng hoặc địa chỉ.
                </p>
                <Link href="/students" className="inline-flex min-h-11 items-center text-theme-accent-text hover:underline">Mở danh sách thiếu nhi</Link>
              </div>
            </Section>
          ) : null}
        </div>

        {!aggregateOnly ? (
          <div className="min-w-0 space-y-5">
            <Section id="dashboard-upcoming" title="Buổi học sắp tới" description="Ba tuần tới, kèm các buổi có kiểm tra.">
              {data.upcoming.length === 0 ? (
                <p className="text-sm text-ink-muted">Chưa có bài nào được xếp lịch.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {data.upcoming.map((item) => (
                    <li key={item.id} className="flex flex-wrap items-start justify-between gap-2 py-2 text-sm">
                      <div className="min-w-0">
                        <p className="break-words font-medium text-ink">{item.title}</p>
                        <p className="text-ink-muted">{item.className} · {formatDateVi(item.plannedDate)}</p>
                      </div>
                      {item.isAssessment ? <Badge variant="default">Kiểm tra</Badge> : null}
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            {showNamedLists ? (
              <Section id="dashboard-committee-work" title="Công việc Ban">
                {data.committeeTasks.length === 0 ? (
                  <p className="text-sm text-ink-muted">Ban của bạn chưa đăng công việc tuần.</p>
                ) : (
                  <ul className="divide-y divide-line">
                    {data.committeeTasks.map((task) => (
                      <li key={`${task.committeeName}-${task.weekStart}`} className="py-2 text-sm first:pt-0">
                        <p className="font-medium text-ink">{task.committeeName} · tuần {formatDateVi(task.weekStart)}</p>
                        <ul className="mt-1 list-inside list-disc text-ink-muted">
                          {task.checklist.map((entry, index) => <li key={`${task.weekStart}-${index}`}>{entry}</li>)}
                        </ul>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            ) : null}
          </div>
        ) : null}
      </div>

      <section aria-label="Chỉ số năm học" className="overflow-hidden rounded-lg border border-line bg-surface">
        <dl className={`grid grid-cols-2 ${isStaff ? "sm:grid-cols-3 xl:grid-cols-5" : isGuardian ? "sm:grid-cols-3" : ""}`}>
          {isStudent ? null : (
            <SummaryValue label={studentLabel} value={String(data.kpis.studentCount)} hint={data.kpis.academicYearCode ? `Năm học ${data.kpis.academicYearCode}` : undefined} />
          )}
          {isStaff ? <SummaryValue label="Giáo lý viên" value={String(data.kpis.staffCount)} /> : null}
          {isStaff ? <SummaryValue label="Lớp" value={String(data.kpis.classCount)} /> : null}
          <SummaryValue
            label={massRateLabel}
            value={percent(data.kpis.massRate)}
            hint={data.kpis.lastSessionDate ? `Tính tới ${formatDateVi(data.kpis.lastSessionDate)}` : "Chưa có buổi đã chốt"}
          />
          <SummaryValue label={catechismRateLabel} value={percent(data.kpis.catechismRate)} />
        </dl>
      </section>

      <div className={`grid items-start gap-6 ${showNamedLists ? "xl:grid-cols-2 xl:gap-8" : ""}`}>
        <Section id="dashboard-notifications" title="Thông báo mới">
          {data.latestNotifications.length === 0 ? (
            <p className="text-sm text-ink-muted">Chưa có thông báo nào.</p>
          ) : (
            <ul className="divide-y divide-line">
              {data.latestNotifications.map((item) => (
                <li key={item.id}>
                  <Link href="/notifications" className="flex min-h-11 flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-sm py-2 text-sm hover:bg-surface-muted">
                    <span className="min-w-0 break-words text-theme-accent-text">{item.title}</span>
                    <span className="text-ink-muted">{item.readAt === null ? "Chưa đọc · " : ""}{formatDateTimeVi(item.publishedAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {showNamedLists ? (
          <Section id="dashboard-celebrations" title="Sinh nhật và bổn mạng" description="Trong 30 ngày tới.">
            {data.celebrations.length === 0 ? (
              <p className="text-sm text-ink-muted">Không có dịp nào sắp tới.</p>
            ) : (
              <ul className="divide-y divide-line">
                {data.celebrations.map((item) => (
                  <li key={`${item.studentId}-${item.kind}`} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2 text-sm">
                    <span className="min-w-0 break-words text-ink">{item.displayName}</span>
                    <span className="text-ink-muted">{item.kind === "birthday" ? "Sinh nhật" : "Bổn mạng"} · {formatDateVi(item.nextOccurrence)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        ) : null}
      </div>

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
