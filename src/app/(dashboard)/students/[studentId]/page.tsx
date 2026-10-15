import { DetailField, DetailFields } from "@/components/layout/detail-fields";
import { EntityLink } from "@/components/ui/entity-link";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TabNav } from "@/components/ui/tab-nav";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Dropdown, DropdownLink } from "@/components/ui/dropdown";
import { Section } from "@/components/ui/section";
import { PageContainer } from "@/components/layout/page-container";
import { EntityHeader } from "@/components/layout/entity-header";
import { formatDateVi, formatOptionalDateVi, todayVi } from "@/lib/dates";
import { enrollmentStatusBadgeVariant, enrollmentStatusLabel } from "@/features/enrollments/enrollment-status";
import { HealthProfileForm } from "@/features/students/components/health-profile-form";
import { SacramentPanel } from "@/features/students/components/sacrament-panel";
import { GuardianPanel } from "@/features/students/components/guardian-panel";
import { StudentStatusPanel } from "@/features/students/components/student-status-panel";
import { EnrollStudentForm } from "@/features/students/components/enroll-student-form";
import { UpdateStudentForm } from "@/features/students/components/update-student-form";
import { DetailLoadError, StudentFamilyMembers, StudentAttendanceSection, StudentAttendanceOverview } from "@/features/students/components/student-detail-sections";
import { genderLabel, studentStatusLabel } from "@/features/students/student-status";
import { getStudentDetail } from "@/features/students/server/queries";

export default async function StudentDetailPage({ params, searchParams }: {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ tab?: string; edit?: string; panel?: string; noteSession?: string }>;
}) {
  const { studentId } = await params;
  const { tab, edit, panel, noteSession } = await searchParams;
  const data = await getStudentDetail(studentId);
  const { student, canWrite, canWriteSensitive, canViewSensitive, canDeleteSacrament,
    canArchive, enrollableClasses, openEnrollmentClassName, viewedClassName, guardianOptions, guardianOptionsError } = data;
  if (!student) notFound();
  const studentName = (student.saintName + " " + student.fullName).trim();
  const rootHref = "/students/" + studentId;
  const tabHref = (key: string) => key === "overview" ? rootHref : rootHref + "?tab=" + key;
  const tabs = [
    {key:"overview",label:"Tổng quan"}, {key:"family",label:"Gia đình"},
    {key:"history",label:"Lớp & Ghi danh"}, {key:"attendance",label:"Chuyên cần"},
    ...(canViewSensitive ? [{key:"sacraments",label:"Bí tích"},{key:"health",label:"Sức khỏe"}] : []),
  ];
  const activeTab = tabs.some(item => item.key === tab) ? tab! : "overview";
  const closeHref = tabHref(activeTab);
  const panelHref = (key: string) => closeHref + (closeHref.includes("?") ? "&" : "?") + "panel=" + key;
  const className = viewedClassName === undefined ? openEnrollmentClassName : viewedClassName;
  const guardian = student.guardian;
  const phoneHref = guardian?.phone ? "tel:" + guardian.phone.replace(/[^+\d]/g,"") : undefined;
  const openPanel = (panel === "profile" || panel === "guardian" || panel === "status" || panel === "enroll") && canWrite
    ? panel : panel === "health" && canWriteSensitive ? panel : null;
  const panelTitles: Record<string,string> = {
    profile:"Cập nhật hồ sơ", guardian:"Người giám hộ", status:"Trạng thái hồ sơ", enroll:"Ghi danh vào lớp", health:"Sức khỏe",
  };

  return <PageContainer className="detail-workspace space-y-5">
    <EntityHeader label="Hồ sơ thiếu nhi" initials={student.fullName.trim().split(/\s+/).slice(-2).map(part => part[0]).join("")} title={studentName} description={"Mã thiếu nhi " + student.studentCode} backHref="/students" backLabel="Danh sách thiếu nhi"
      chips={<>
        <Badge variant="secondary">{className ? "Lớp " + className : "Chưa xếp lớp"}</Badge>
        <Badge variant={student.status === "active" ? "success" : "secondary"}>{studentStatusLabel(student.status)}</Badge>
        {student.hardshipFlag ? <Badge variant="warning">Hoàn cảnh khó khăn</Badge> : null}
      </>}
      facts={<p className="text-sm">Giám hộ: <span className="font-medium">{guardian?.fullName ?? "Chưa gán"}</span>
        {phoneHref ? <> · <a href={phoneHref} className="inline-flex min-h-11 items-center text-theme-accent-text underline">{guardian!.phone}</a></> : null}
      </p>}
      actions={canWrite ? [
        <Link key="edit" href={panelHref("profile")} className={buttonVariants()}>Sửa hồ sơ</Link>,
        <Link key="enroll" href={enrollableClasses.length ? tabHref("history") + "&panel=enroll" : tabHref("history")} className={buttonVariants({variant:"outline"})}>Lớp & Ghi danh</Link>,
      ] : []}
      more={canWrite ? <Dropdown label="Thao tác khác" align="start" className="sm:[&>[role=menu]]:left-auto sm:[&>[role=menu]]:right-0">
        <DropdownLink href={panelHref("status")}>Đổi trạng thái hồ sơ</DropdownLink>
      </Dropdown> : undefined} />
    <TabNav layout="wrap" stickyMobile={false} label="Thông tin thiếu nhi" activeKey={activeTab}
      items={tabs.map(item => ({...item,href:tabHref(item.key)}))} />

    {activeTab === "overview" ? <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <Section id="student-overview" title="Thông tin cá nhân">
        <DetailFields>
          <DetailField label="Tên thánh">{student.saintName}</DetailField>
          <DetailField label="Họ tên">{student.fullName}</DetailField>
          <DetailField label="Giới tính">{genderLabel(student.gender)}</DetailField>
          <DetailField label="Ngày sinh">{formatOptionalDateVi(student.dateOfBirth,"Chưa có")}</DetailField>
          <DetailField label="Bổn mạng">{formatOptionalDateVi(student.patronFeastDate,"Chưa có")}</DetailField>
          <DetailField label="Ghi chú" wide>{student.generalNotes}</DetailField>
        </DetailFields>
      </Section>
      <div className="space-y-4">
        <Section id="student-contact" title="Liên hệ">
          <DetailFields className="grid-cols-1">
            <DetailField label="Điện thoại của em">{student.phone ? <a href={"tel:" + student.phone.replace(/[^+\d]/g, "")} className="inline-flex min-h-11 items-center text-theme-accent-text underline">{student.phone}</a> : null}</DetailField>
            <DetailField label="Địa chỉ">{student.address}</DetailField>
          </DetailFields>
          <EntityLink href={tabHref("family")} label="Xem gia đình">
            <p className="text-xs text-ink-muted">Người giám hộ</p>
            <p className="mt-1 font-semibold">{guardian?.fullName ?? "Chưa gán người giám hộ"}</p>
          </EntityLink>
        </Section>
        <StudentAttendanceOverview studentId={student.id} />
        <EntityLink href={tabHref("attendance")}>
          <p className="font-semibold">Chuyên cần</p>
          <p className="mt-1 text-xs text-ink-muted">Xem chuyên cần và cảnh báo vắng</p>
        </EntityLink>
      </div>
    </div> : null}

    {activeTab === "family" ? <div className="space-y-6">
      <Section id="student-guardian" title="Người giám hộ" description="Liên lạc khi em cần giúp đỡ giữa buổi học."
        action={canWrite ? <Link href={panelHref("guardian")} className={buttonVariants({variant:"outline"})}>Sửa / đổi người giám hộ</Link> : undefined}>
        {guardian ? <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-ink-muted">Họ tên</dt><dd className="font-medium">{guardian.fullName}</dd></div>
          <div><dt className="text-ink-muted">Điện thoại</dt><dd>{phoneHref ? <a href={phoneHref} className="inline-flex min-h-11 items-center text-theme-accent-text underline">{guardian.phone}</a> : "Chưa có"}</dd></div>
          <div><dt className="text-ink-muted">Địa chỉ</dt><dd>{guardian.address ?? "Chưa có"}</dd></div>
        </dl> : <p className="text-sm text-ink-muted">Chưa gán người giám hộ.</p>}
      </Section>
      {guardian ? <StudentFamilyMembers studentId={student.id} guardianId={guardian.id} /> : null}
    </div> : null}

    {activeTab === "history" ? <Section id="student-enrollment" title="Lịch sử lớp" description="Ghi danh theo từng năm học."
      action={enrollableClasses.length ? <Link href={panelHref("enroll")} className={buttonVariants()}>Ghi danh vào lớp</Link> : undefined}>
      {!student.enrollments.length ? <p className="text-sm text-ink-muted">Chưa có ghi danh nào.</p> :
        <ol className="divide-y divide-line">{student.enrollments.map(item => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm">
          <div><p className="font-medium">{item.className}</p><p className="text-ink-muted">Năm học {item.academicYearCode} · từ {formatDateVi(item.enrolledOn)}{item.endedOn ? " đến " + formatDateVi(item.endedOn) : ""}</p></div>
          <Badge variant={enrollmentStatusBadgeVariant(item.status)}>{enrollmentStatusLabel(item.status)}</Badge>
        </li>)}</ol>}
    </Section> : null}

    {activeTab === "attendance" ? <StudentAttendanceSection studentId={student.id} noteSession={noteSession} /> : null}
    {activeTab === "sacraments" && canViewSensitive ? <SacramentPanel studentId={student.id} studentName={studentName}
      sacraments={student.sacraments} editing={student.sacraments.find(item => item.id === edit) ?? null}
      canWrite={canWriteSensitive} canDelete={canDeleteSacrament} backHref={tabHref("sacraments")} /> : null}
    {activeTab === "health" && canViewSensitive ? <Section id="student-health" title="Sức khỏe" description="Thông tin nhạy cảm, chỉ nhân sự có quyền xem."
      action={canWriteSensitive ? <Link href={panelHref("health")} className={buttonVariants({variant:"outline"})}>Sửa sức khỏe</Link> : undefined}>
      <dl className="grid gap-4 text-sm sm:grid-cols-2">
        {[["Dị ứng",student.health?.allergies],["Bệnh lý",student.health?.medicalConditions],["Thuốc",student.health?.medications],["Ghi chú khẩn cấp",student.health?.emergencyNotes]].map(([label,value]) =>
          <div key={label}><dt className="text-ink-muted">{label}</dt><dd className="whitespace-pre-wrap break-words">{value || "Chưa có"}</dd></div>)}
      </dl>
    </Section> : null}

    <Drawer open={!!openPanel} title={panelTitles[openPanel ?? ""] ?? "Hồ sơ thiếu nhi"} closeHref={closeHref}>
      {openPanel === "profile" ? <UpdateStudentForm student={student} /> : null}
      {openPanel === "guardian" ? <div className="space-y-4">
        {guardianOptionsError ? <DetailLoadError href={panelHref("guardian")} label="danh sách người giám hộ" /> : null}
        <GuardianPanel studentId={student.id} studentName={studentName} guardian={guardian} options={guardianOptions} canWrite={canWrite} />
      </div> : null}
      {openPanel === "status" ? <StudentStatusPanel studentId={student.id} studentName={studentName} currentStatus={student.status}
        openClassName={openEnrollmentClassName} canArchive={canArchive} today={todayVi()} /> : null}
      {openPanel === "enroll" && enrollableClasses.length ? <EnrollStudentForm studentId={student.id} classes={enrollableClasses} /> : null}
      {openPanel === "health" ? <HealthProfileForm studentId={student.id} health={student.health ?? null} /> : null}
    </Drawer>
  </PageContainer>;
}
