import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { requireRouteAccess } from "@/lib/auth/guards";
import { formatDateTimeVi, formatDateVi, todayVi } from "@/lib/dates";
import {
  archiveAcademicYearFormAction,
  generateDefaultClassesFormAction,
  setCurrentAcademicYearFormAction,
} from "@/features/academic-years/server/actions";
import {
  getAcademicYearCloseChecklist,
  getActiveClassTemplateCount,
  getCurrentAttendanceSettings,
  listAcademicYears,
} from "@/features/academic-years/server/queries";
import { academicYearStatusLabel } from "@/features/academic-years/admin-feedback";
import { canArchiveAcademicYear } from "@/features/academic-years/year-lifecycle";
import { AttendanceSettingsForm } from "@/features/academic-years/components/attendance-settings-form";
import { CloseYearPanel } from "@/features/academic-years/components/close-year-panel";
import { ConfirmSubmitForm } from "@/features/academic-years/components/confirm-submit-form";
import { CreateYearForm } from "@/features/academic-years/components/create-year-form";
import { SemesterMilestoneForm } from "@/features/academic-years/components/semester-milestone-form";
import { getAccountAdminOptions } from "@/features/auth/server/queries";
import { AccountAdminPanel } from "@/features/auth/components/account-admin-panel";

const STATUS_VARIANT: Record<string, "success" | "secondary" | "warning"> = {
  current: "success",
  draft: "warning",
  closed: "secondary",
  archived: "secondary",
};

/** Năm đã đóng/lưu trữ không sinh lớp được nữa (BR-M02-N03) — nút phải biến mất. */
function canGenerateClasses(status: string): boolean {
  return status === "draft" || status === "current";
}

export default async function AdminPage() {
  await requireRouteAccess("/admin");
  const [academicYears, accountOptions, attendanceSettings, templateCount] = await Promise.all([
    listAcademicYears(),
    getAccountAdminOptions(),
    getCurrentAttendanceSettings(),
    getActiveClassTemplateCount(),
  ]);

  const currentYear = academicYears.find((year) => year.status === "current") ?? null;
  // Bảng kiểm chỉ có nghĩa cho năm ĐANG áp dụng — nó là năm duy nhất đóng được
  // (WF-16). Không có năm hiện hành thì không tốn lượt gọi nào.
  const closeChecklist = currentYear ? await getAcademicYearCloseChecklist(currentYear.id) : null;
  const today = todayVi();

  return (
    <PageContainer>
      <PageHeader title="Quản trị hệ thống" description="Cấu hình năm học và khởi tạo cơ cấu lớp chuẩn." />

      {/* Thiếu danh mục lớp chuẩn là hỏng cấu hình môi trường, không phải lỗi
          thao tác — nói ra NGAY ở đầu trang, đừng đợi tới lúc bấm nút rồi mới
          báo. Đây chính là thứ đã thiếu khi sự cố production xảy ra (5W-F02). */}
      {templateCount === 0 ? (
        <div className="mb-4">
          <FormMessage tone="danger">
            Hệ thống chưa có danh mục lớp chuẩn nào. Chưa nạp dữ liệu tham chiếu thì không sinh
            được lớp cho bất kỳ năm học nào.
          </FormMessage>
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Năm học</CardTitle>
            <CardDescription>Mỗi thời điểm chỉ có một năm học hiện hành.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {academicYears.length === 0 ? (
              <p className="text-sm text-ink-muted">
                Chưa có năm học. Tạo năm học đầu tiên bằng biểu mẫu bên cạnh.
              </p>
            ) : academicYears.map((year) => {
              const short = `${year.classCount}/${templateCount ?? "?"} lớp`;
              const missingClasses = templateCount !== null && year.classCount < templateCount;
              return (
                <div key={year.id} className="rounded-md border border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{year.name}</p>
                      <p className="text-sm text-ink-muted">
                        {year.code} · {formatDateVi(year.start_date)} → {formatDateVi(year.end_date)} · {short}
                      </p>
                    </div>
                    <Badge variant={STATUS_VARIANT[year.status] ?? "secondary"}>
                      {academicYearStatusLabel(year.status)}
                    </Badge>
                  </div>
                  {/* D-71 / D-116 — mốc học kỳ 1 sửa được cho năm nháp và năm đang
                      áp dụng. Năm đã đóng thì không: sửa mốc của một năm đã kết thúc
                      chỉ làm đổi cảnh báo trên dữ liệu quá khứ. */}
                  {canGenerateClasses(year.status) ? (
                    <div className="mt-3 border-t border-border pt-3">
                      <SemesterMilestoneForm
                        academicYearId={year.id}
                        startDate={year.start_date}
                        endDate={year.end_date}
                        semester1EndDate={year.semester_1_end_date}
                      />
                    </div>
                  ) : year.semester_1_end_date ? (
                    <p className="mt-3 text-sm text-ink-muted">
                      Kết thúc học kỳ 1: {formatDateVi(year.semester_1_end_date)}
                    </p>
                  ) : null}

                  {/* I7 — năm đã đóng phải nói ra CHỐT LÚC NÀO và VÌ SAO. Năm bị đóng
                      trước migration `20260726000100` không có hai giá trị này, nên
                      dòng chỉ hiện khi thật sự có dữ liệu chứ không in "—". */}
                  {year.closed_at ? (
                    <p className="mt-3 text-sm text-ink-muted">
                      Chốt sổ lúc {formatDateTimeVi(year.closed_at)}
                      {year.close_reason ? ` · Lý do: ${year.close_reason}` : ""}
                    </p>
                  ) : null}

                  {/* I7 / TB-F09 — chốt sổ. Chỉ năm đang áp dụng: năm nháp chưa từng
                      chạy, năm đã đóng thì đóng lại sẽ ghi đè thời điểm chốt sổ thật. */}
                  {year.status === "current" ? (
                    <div className="mt-3 border-t border-border pt-3">
                      <CloseYearPanel
                        academicYearId={year.id}
                        code={year.code}
                        name={year.name}
                        openWork={closeChecklist}
                      />
                    </div>
                  ) : null}

                  {/* D-120 — chưa tới hạn thì KHÔNG hiện nút, và nói rõ bao giờ mới
                      hiện. Một nút xám không giải thích được gì là chỗ người dùng bấm
                      mãi rồi nghĩ hệ thống hỏng. */}
                  {year.status === "closed" && !canArchiveAcademicYear(year.status, year.retention_until, today) ? (
                    <p className="mt-3 text-sm text-ink-muted">
                      Lưu trữ được từ sau {formatDateVi(year.retention_until)} — dữ liệu của
                      năm học phải được giữ 5 năm sau khi kết thúc.
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {canGenerateClasses(year.status) ? (
                      <ConfirmSubmitForm
                        action={generateDefaultClassesFormAction}
                        fields={{ academicYearId: year.id }}
                        label="Sinh lớp mặc định"
                        title="Sinh cơ cấu lớp chuẩn?"
                        confirmLabel="Sinh lớp"
                        consequence={
                          <>
                            <p>
                              Sẽ tạo các lớp còn thiếu của cơ cấu chuẩn cho{" "}
                              <strong>{year.name}</strong>. Hiện năm này có <strong>{short}</strong>.
                            </p>
                            <p className="mt-2">
                              Chạy lại nhiều lần không tạo lớp trùng, và không xoá lớp nào đang có.
                            </p>
                          </>
                        }
                      />
                    ) : null}
                    {year.status === "draft" ? (
                      <ConfirmSubmitForm
                        action={setCurrentAcademicYearFormAction}
                        fields={{ academicYearId: year.id }}
                        label="Đặt hiện hành"
                        variant="primary"
                        tone={missingClasses ? "danger" : "primary"}
                        title="Đặt năm học này thành hiện hành?"
                        confirmLabel="Đặt hiện hành"
                        consequence={
                          <>
                            {/* D-113 — chủ dự án chốt: CẢNH BÁO bằng con số thật rồi
                                vẫn cho đặt, không chặn cứng. Đây là nửa sau của sự
                                cố production: năm học thành hiện hành khi chưa có
                                lớp nào, và không màn hình nào nói ra điều đó. */}
                            {missingClasses ? (
                              <p className="font-medium text-danger">
                                {year.name} mới có {short}. Đặt hiện hành bây giờ thì chưa ghi danh
                                hay điểm danh được cho tới khi sinh đủ lớp.
                              </p>
                            ) : null}
                            <p className={missingClasses ? "mt-2" : undefined}>
                              <strong>{year.name}</strong> sẽ thành năm đang áp dụng cho toàn hệ thống.
                              {currentYear ? (
                                <>
                                  {" "}Năm <strong>{currentYear.name}</strong> đang áp dụng sẽ chuyển
                                  sang <strong>Đã đóng</strong>.
                                </>
                              ) : null}
                            </p>
                          </>
                        }
                      />
                    ) : null}
                    {canArchiveAcademicYear(year.status, year.retention_until, today) ? (
                      <ConfirmSubmitForm
                        action={archiveAcademicYearFormAction}
                        fields={{ academicYearId: year.id }}
                        label="Lưu trữ"
                        tone="danger"
                        title="Lưu trữ năm học này?"
                        confirmLabel="Lưu trữ"
                        consequence={
                          <>
                            <p>
                              <strong>{year.name}</strong> sẽ chuyển sang{" "}
                              <strong>Đã lưu trữ</strong>. Hạn giữ dữ liệu (
                              {formatDateVi(year.retention_until)}) đã qua.
                            </p>
                            <p className="mt-2">
                              Dữ liệu <strong>không bị xoá</strong> — năm học chỉ được dọn
                              khỏi danh sách làm việc. Nhưng đây là thao tác{" "}
                              <strong>một chiều</strong>: hệ thống chưa có cách bỏ lưu trữ.
                            </p>
                          </>
                        }
                      />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tạo năm học</CardTitle>
            <CardDescription>Năm mới được tạo ở trạng thái nháp; hãy sinh lớp trước khi đặt hiện hành.</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateYearForm />
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
              <p className="text-sm text-ink-muted">
                Chưa có năm học hiện hành. Đặt một năm học thành hiện hành trước.
              </p>
            ) : (
              <AttendanceSettingsForm
                academicYearId={attendanceSettings.id}
                lockDays={attendanceSettings.attendance_lock_days}
                leaseMinutes={attendanceSettings.attendance_edit_lease_minutes}
                consecutiveAbsences={attendanceSettings.attendance_warning_consecutive_absences}
                consecutiveSundays={attendanceSettings.attendance_warning_consecutive_sundays}
                ratePercent={Math.round(Number(attendanceSettings.attendance_warning_rate_threshold) * 100)}
              />
            )}
          </CardContent>
        </Card>
      </div>
      <AccountAdminPanel options={accountOptions} />
    </PageContainer>
  );
}
