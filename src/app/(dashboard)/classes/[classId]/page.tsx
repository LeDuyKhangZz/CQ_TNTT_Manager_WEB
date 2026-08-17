import Link from "next/link";
import { notFound } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterField, filterFieldLabelRowClassName } from "@/components/ui/filter-bar";
import { SearchInputControl } from "@/components/ui/search-input";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { formatDateVi, todayVi } from "@/lib/dates";
import { academicYearNotice } from "@/features/academic-years/year-lifecycle";
import { academicYearStatusLabel } from "@/features/academic-years/admin-feedback";
import { rosterSummary } from "@/features/enrollments/enrollment-status";
import { EnrollStudentForm } from "@/features/enrollments/components/enroll-student-form";
import { RosterRow } from "@/features/enrollments/components/roster-row";
import {
  classStatusBadgeVariant,
  classStatusLabel,
  needsStatusBadge,
  semester1Notice,
} from "@/features/classes/class-status";
import { ClassSettingsForm } from "@/features/classes/components/class-settings-form";
import { getClassDetail } from "@/features/classes/server/queries";

const capacityLabels: Record<string, string> = { representative: "GLV đại diện", member: "GLV lớp", trainee: "Dự trưởng phụ tá" };

export default async function ClassDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ classId: string }>;
  searchParams: Promise<{ student?: string }>;
}) {
  const { classId } = await params;
  // BR-M03-N20 — ô tìm em là `<form method="get">` trên chính trang này, nên nó
  // chạy khi chưa có JavaScript và kết quả tìm chép được bằng đường dẫn.
  const studentSearch = (await searchParams).student?.trim() ?? "";
  const { classDetail, canManage, canManageClass, availableStudentsTruncated } =
    await getClassDetail(classId, studentSearch);
  if (!classDetail) notFound();

  const today = todayVi();
  // D-121 — sĩ số tách hai số. `roster` gồm cả em `paused`, nên con số cũ
  // ("Sĩ số đang sinh hoạt: N") nói sai về những em không còn sinh hoạt.
  const summary = rosterSummary(classDetail.roster.map((item) => item.status));
  // TB-F07 / BR-M02-N10 — trang phải nói rõ đang xem năm nào và năm đó còn mở hay
  // không. `null` = năm đang áp dụng, tức chuyện thường ngày, không cần dải nào.
  const yearNotice = academicYearNotice(
    classDetail.academicYearStatus,
    `Năm học ${classDetail.academicYearCode}`,
  );
  // D-115 — lớp Dự trưởng qua mốc học kỳ 1 thì cảnh báo, không tự đóng.
  const traineeNotice =
    classDetail.classKind === "trainee"
      ? semester1Notice(classDetail.semester1EndDate, today, formatDateVi)
      : null;

  return (
    <PageContainer>
      <PageHeader
        title={classDetail.displayName}
        /* Trạng thái năm học đứng ngay trong phụ đề, không chỉ nằm trong dải cảnh
           báo: dải chỉ hiện khi năm khác `current`, còn câu này luôn có mặt. */
        description={`${classDetail.sectorName ?? "Dự trưởng"} · Năm học ${classDetail.academicYearCode} · ${academicYearStatusLabel(classDetail.academicYearStatus)}`}
        /* M14-C / AC-B6 — nút quay lại chuẩn, đạt vùng chạm 44px. Bản cũ là một
           liên kết chữ nhỏ ở góc phải, không đạt ngưỡng. */
        backHref="/classes"
        backLabel="Danh sách lớp"
        action={
          needsStatusBadge(classDetail.status) ? (
            <Badge variant={classStatusBadgeVariant(classDetail.status)}>
              {classStatusLabel(classDetail.status)}
            </Badge>
          ) : null
        }
      />

      {yearNotice ? (
        <Alert tone={yearNotice.tone} title={yearNotice.title} className="mb-5">
          {yearNotice.detail}
        </Alert>
      ) : null}
      {traineeNotice ? (
        <Alert tone="warning" title={traineeNotice.title} className="mb-5">
          {traineeNotice.detail}
        </Alert>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Danh sách thiếu nhi</CardTitle>
            <CardDescription>{summary.text}</CardDescription>
          </CardHeader>
          <CardContent>
            {classDetail.roster.length === 0 ? (
              <p className="text-sm text-ink-muted">Lớp chưa có thiếu nhi ghi danh.</p>
            ) : (
              <ul className="space-y-2">
                {classDetail.roster.map((item) => (
                  <RosterRow
                    key={item.enrollmentId}
                    enrollmentId={item.enrollmentId}
                    studentId={item.studentId}
                    studentName={`${item.saintName} ${item.fullName}`}
                    className={classDetail.displayName}
                    status={item.status}
                    today={today}
                    canManage={canManage}
                    pendingPromotion={item.pendingPromotion}
                  />
                ))}
              </ul>
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
                <p className="text-sm text-ink-muted">Chưa phân công nhân sự.</p>
              ) : (
                classDetail.team.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-2 text-sm">
                    {/*
                      M04-C: mở thẳng hồ sơ người phụ trách — điểm trừ duy nhất của
                      M04-F09 trong biên bản audit ("chưa link được vì
                      /staff/[staffId] chưa tồn tại"). Không đọc được hồ sơ thì giữ
                      chữ thường: một liên kết dẫn tới trang không tìm thấy còn tệ
                      hơn không có liên kết.
                    */}
                    {item.staffProfileId ? (
                      <Link
                        href={`/staff/${item.staffProfileId}`}
                        className="inline-flex min-h-11 items-center font-medium hover:underline"
                      >
                        {item.name}
                      </Link>
                    ) : (
                      <span>{item.name}</span>
                    )}
                    <Badge variant={item.capacity === "representative" ? "success" : "secondary"}>
                      {capacityLabels[item.capacity] ?? item.capacity}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/*
            I6 / TB-F08 — call site thật đầu tiên của `updateClass` (5W-F08: hàm viết
            xong từ Phase 1 mà không màn hình nào gọi, nên đóng lớp và ghi phòng sinh
            hoạt là việc `docs/11` §3 đòi mà thực tế KHÔNG làm được).

            Ai không đủ quyền — hoặc năm học đã đóng — vẫn **đọc được** cài đặt hiện
            tại. Ẩn hẳn thông tin thì Trưởng ngành không biết lớp mình đang họp ở
            phòng nào; điều phải ẩn là biểu mẫu ghi, không phải sự thật.
          */}
          {canManageClass ? (
            <Card>
              <CardHeader>
                <CardTitle>Cài đặt lớp</CardTitle>
                <CardDescription>
                  Trạng thái, phòng sinh hoạt và ghi chú. Đóng lớp không kết thúc ghi danh đang mở.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ClassSettingsForm
                  classId={classDetail.id}
                  className={classDetail.displayName}
                  status={classDetail.status}
                  meetingLocation={classDetail.meetingLocation}
                  notes={classDetail.notes}
                  openEnrollmentCount={classDetail.roster.length}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Cài đặt lớp</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <span className="text-ink-muted">Trạng thái: </span>
                  {classStatusLabel(classDetail.status)}
                </p>
                <p>
                  <span className="text-ink-muted">Phòng sinh hoạt: </span>
                  {classDetail.meetingLocation ?? "Chưa ghi"}
                </p>
                {classDetail.notes ? (
                  <p>
                    <span className="text-ink-muted">Ghi chú: </span>
                    {classDetail.notes}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          )}

          {canManage ? (
            <Card>
              <CardHeader>
                <CardTitle>Ghi danh thiếu nhi</CardTitle>
                <CardDescription>Mỗi em chỉ có một lớp đang mở trong năm học.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Ô tìm nằm NGOÀI biểu mẫu ghi danh: hai `<form>` lồng nhau là
                    HTML không hợp lệ, và biểu mẫu trong cùng sẽ nuốt lượt gửi. */}
                {/* Đợt E — khối lọc tự chế: ô tìm và nút "Tìm" đứng cùng một
                    hàng `items-end`, nên nút bị dòng gợi ý của ô đẩy lệch xuống.
                    `FilterField` giữ ba tầng cố định, nút tự canh theo tầng
                    control chứ không theo đáy khối. */}
                <form method="get" className="flex flex-wrap items-start gap-2">
                  <FilterField
                    className="min-w-0 flex-1"
                    label="Tìm thiếu nhi theo tên hoặc mã"
                    htmlFor="class-student-search"
                    helper="Gõ không dấu cũng tìm được."
                  >
                    <SearchInputControl
                      id="class-student-search"
                      name="student"
                      defaultValue={studentSearch}
                      placeholder="Ví dụ: tran ngoc"
                    />
                  </FilterField>
                  <div>
                    <div className={filterFieldLabelRowClassName} aria-hidden="true" />
                    <Button type="submit" variant="secondary">
                      Tìm
                    </Button>
                  </div>
                </form>

                {classDetail.availableStudents.length === 0 ? (
                  <p className="text-sm text-ink-muted">
                    {studentSearch
                      ? `Không có em nào chưa ghi danh khớp "${studentSearch}".`
                      : "Không còn thiếu nhi nào chưa ghi danh trong năm học."}
                  </p>
                ) : (
                  <>
                    <EnrollStudentForm
                      classId={classDetail.id}
                      today={today}
                      students={classDetail.availableStudents}
                    />
                    {/* `11` §5 — cắt bớt thì phải NÓI RA. Một danh sách âm thầm
                        dừng ở 50 dòng đọc như "chỉ có bấy nhiêu em". */}
                    {availableStudentsTruncated ? (
                      <p className="text-2xs text-ink-muted">
                        Danh sách đang hiện 50 em đầu tiên. Gõ tên vào ô tìm ở trên để thấy em khác.
                      </p>
                    ) : null}
                  </>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </PageContainer>
  );
}
