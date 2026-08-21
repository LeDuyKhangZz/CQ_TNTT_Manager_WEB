import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Panel } from "@/components/ui/card";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { formatDateVi, formatOptionalDateVi } from "@/lib/dates";
import {
  enrollmentStatusBadgeVariant,
  enrollmentStatusLabel,
} from "@/features/enrollments/enrollment-status";
import { HealthProfileForm } from "@/features/students/components/health-profile-form";
import { SacramentPanel } from "@/features/students/components/sacrament-panel";
import { GuardianPanel } from "@/features/students/components/guardian-panel";
import { StudentStatusPanel } from "@/features/students/components/student-status-panel";
import { EnrollStudentForm } from "@/features/students/components/enroll-student-form";
import { UpdateStudentForm } from "@/features/students/components/update-student-form";
import { todayVi } from "@/lib/dates";
import { genderLabel, studentStatusLabel } from "@/features/students/student-status";
import { getStudentDetail } from "@/features/students/server/queries";

type TabKey = "overview" | "history" | "sacraments" | "health";

function tabHref(studentId: string, tab: TabKey): string {
  return tab === "overview" ? `/students/${studentId}` : `/students/${studentId}?tab=${tab}`;
}

export default async function StudentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ tab?: string; edit?: string }>;
}) {
  const { studentId } = await params;
  const { tab, edit } = await searchParams;
  const {
    student,
    canWrite,
    canWriteSensitive,
    canViewSensitive,
    canDeleteSacrament,
    canArchive,
    enrollableClasses,
    openEnrollmentClassName,
    guardianOptions,
  } = await getStudentDetail(studentId);

  if (!student) notFound();

  const studentName = `${student.saintName} ${student.fullName}`.trim();

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
        backHref="/students"
        backLabel="Danh sách thiếu nhi"
      />

      {/* R1.5 (redesign 2C, UX-09): thẻ tóm tắt và thanh tab từng dính sát 0px. */}
      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div>
            <p className="text-sm text-ink-muted">Người giám hộ</p>
            <p className="font-medium">
              {student.guardian ? `${student.guardian.fullName} · ${student.guardian.phone}` : "Chưa gán"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {student.hardshipFlag ? <Badge variant="warning">Hoàn cảnh khó khăn</Badge> : null}
            {/*
              TB-F06 — lớp hiện tại hiện ngay trên thẻ đầu trang. `docs/06` §230-235
              đòi nó từ đầu (điểm trừ C12 của luồng F04), và từ đợt này nó còn là
              **thông tin quyết định**: đổi trạng thái hồ sơ sẽ đụng đúng lớp này.
            */}
            {openEnrollmentClassName ? (
              <Badge variant="secondary">Lớp {openEnrollmentClassName}</Badge>
            ) : (
              <Badge variant="secondary">Chưa xếp lớp</Badge>
            )}
            <Badge variant={student.status === "active" ? "success" : "secondary"}>
              {studentStatusLabel(student.status)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <nav className="mb-5 flex flex-wrap gap-1 border-b border-line">
        {tabs
          .filter((item) => item.visible)
          .map((item) => (
            <Link
              key={item.key}
              href={tabHref(studentId, item.key)}
              className={`min-h-[44px] rounded-t-md px-4 py-2 text-sm font-medium ${
                activeTab === item.key
                  ? "border-b-2 border-theme-primary text-ink"
                  : "text-ink-muted hover:text-ink"
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
              <p><span className="text-ink-muted">Tên thánh: </span>{student.saintName}</p>
              <p><span className="text-ink-muted">Họ tên: </span>{student.fullName}</p>
              <p><span className="text-ink-muted">Giới tính: </span>{genderLabel(student.gender)}</p>
              <p><span className="text-ink-muted">Ngày sinh: </span>{formatOptionalDateVi(student.dateOfBirth, "chưa có")}</p>
              <p>
                <span className="text-ink-muted">Bổn mạng: </span>
                {student.patronFeastDate ? formatDateVi(student.patronFeastDate) : "—"}
              </p>
              <p><span className="text-ink-muted">Điện thoại: </span>{student.phone ?? "—"}</p>
              <p><span className="text-ink-muted">Địa chỉ: </span>{student.address ?? "—"}</p>
              <p><span className="text-ink-muted">Ghi chú: </span>{student.generalNotes ?? "—"}</p>
            </CardContent>
          </Card>

          {canWrite ? (
            <Card>
              <CardHeader>
                <CardTitle>Cập nhật hồ sơ</CardTitle>
                <CardDescription>Chỉnh sửa thông tin cơ bản của thiếu nhi.</CardDescription>
              </CardHeader>
              <CardContent>
                <UpdateStudentForm student={student} />
              </CardContent>
            </Card>
          ) : null}

          {/*
            TB-F12 — khối người giám hộ. Phương án B của `04_TO_BE_FLOWS`: nhúng
            vào trang chi tiết em thay vì dựng route `/guardians` riêng (phương
            án A, để dành cho M13 Cổng phụ huynh — nơi mới thật sự cần "gia đình
            này có mấy em").
          */}
          <Card>
            <CardHeader>
              <CardTitle>Người giám hộ</CardTitle>
              <CardDescription>
                Số điện thoại ở đây là số gọi khi em cần giúp đỡ giữa buổi học.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GuardianPanel
                studentId={student.id}
                studentName={studentName}
                guardian={student.guardian}
                options={guardianOptions}
                canWrite={canWrite}
              />
            </CardContent>
          </Card>

          {/*
            TB-F06 — khối trạng thái hồ sơ, TÁCH khỏi biểu mẫu "Cập nhật hồ sơ"
            ngay bên cạnh. Trước M03-C nó là một ô `<select>` chung nút "Lưu
            thay đổi" với số điện thoại (C5 = 2 trong biên bản audit).
          */}
          {canWrite ? (
            <Card>
              <CardHeader>
                <CardTitle>Trạng thái hồ sơ</CardTitle>
                <CardDescription>
                  Đổi trạng thái hồ sơ cũng đổi chỗ của em trong lớp — hệ thống nói rõ hệ quả
                  trước khi ghi.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StudentStatusPanel
                  studentId={student.id}
                  studentName={studentName}
                  currentStatus={student.status}
                  openClassName={openEnrollmentClassName}
                  canArchive={canArchive}
                  today={todayVi()}
                />
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}

      {/*
        BR-M03-N19 / TB-F09 — mời ghi danh ngay khi em chưa có lớp trong năm hiện
        hành. `enrollableClasses` rỗng nghĩa là em đã có lớp, hoặc người xem không
        ghi được, hoặc chưa có năm học hiện hành — cả ba đều không có gì để mời.
      */}
      {activeTab === "history" && enrollableClasses.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Ghi danh vào lớp</CardTitle>
            <CardDescription>
              Em chưa được xếp lớp trong năm học hiện hành.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EnrollStudentForm studentId={student.id} classes={enrollableClasses} />
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "history" ? (
        <Card>
          <CardHeader>
            <CardTitle>Lịch sử lớp</CardTitle>
            <CardDescription>Ghi danh theo từng năm học.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {student.enrollments.length === 0 ? (
              <p className="text-sm text-ink-muted">Chưa có ghi danh nào.</p>
            ) : (
              student.enrollments.map((item) => (
                <Panel key={item.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <div>
                    <p className="font-medium">{item.className}</p>
                    <p className="text-ink-muted">
                      Năm học {item.academicYearCode} · từ {formatDateVi(item.enrolledOn)}
                      {item.endedOn ? ` đến ${formatDateVi(item.endedOn)}` : ""}
                    </p>
                  </div>
                  <Badge variant={enrollmentStatusBadgeVariant(item.status)}>
                    {enrollmentStatusLabel(item.status)}
                  </Badge>
                </Panel>
              ))
            )}
          </CardContent>
        </Card>
      ) : null}

      {/*
        TB-F08 — danh sách và biểu mẫu nằm trong MỘT component để dùng chung một
        `useActionState`: hai state riêng sẽ để câu "Đã lưu bí tích Rửa tội" đứng
        nguyên sau khi người dùng vừa xoá đúng bản ghi ấy (bài học M03-A).

        Bản ghi đang sửa chọn bằng `?edit=<id>` chứ không bằng state React, nên
        nút "Sửa" vẫn chạy khi chưa có JavaScript (`09` §11).
      */}
      {activeTab === "sacraments" && canViewSensitive ? (
        <SacramentPanel
          studentId={student.id}
          studentName={studentName}
          sacraments={student.sacraments}
          editing={student.sacraments.find((item) => item.id === edit) ?? null}
          canWrite={canWriteSensitive}
          canDelete={canDeleteSacrament}
          backHref={`/students/${studentId}?tab=sacraments`}
        />
      ) : null}

      {activeTab === "health" && canViewSensitive ? (
        <Card>
          <CardHeader>
            <CardTitle>Sức khỏe</CardTitle>
            <CardDescription>Thông tin nhạy cảm, chỉ nhân sự có quyền xem.</CardDescription>
          </CardHeader>
          <CardContent>
            {canWriteSensitive ? (
              <HealthProfileForm studentId={student.id} health={student.health ?? null} />
            ) : (
              <div className="space-y-2 text-sm">
                <p><span className="text-ink-muted">Dị ứng: </span>{student.health?.allergies ?? "—"}</p>
                <p><span className="text-ink-muted">Bệnh lý: </span>{student.health?.medicalConditions ?? "—"}</p>
                <p><span className="text-ink-muted">Thuốc: </span>{student.health?.medications ?? "—"}</p>
                <p><span className="text-ink-muted">Ghi chú khẩn cấp: </span>{student.health?.emergencyNotes ?? "—"}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </PageContainer>
  );
}
