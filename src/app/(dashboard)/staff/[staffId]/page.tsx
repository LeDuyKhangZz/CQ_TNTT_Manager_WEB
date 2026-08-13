import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { getStaffDetail } from "@/features/staff/server/queries";
import { StaffAccountPanel } from "@/features/staff/components/staff-account-panel";
import { StaffAssignmentPanel } from "@/features/staff/components/staff-assignment-panel";
import { StaffDeletePanel } from "@/features/staff/components/staff-delete-panel";
import { StaffProfileEditor } from "@/features/staff/components/staff-profile-editor";
// M04-B gom bốn bảng nhãn về `staff-directory.ts`. Trước đó chúng nằm rải ở ba
// file và đã lệch nhau thật: danh sách in `NONE` còn trang chi tiết in "Chưa có".
import {
  CAPACITY_LABELS,
  SERVICE_LABELS,
  TITLE_LABELS,
  formationLabel,
  staffDisplayName,
} from "@/features/staff/staff-directory";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function formatDate(value: string | null): string {
  if (!value) return "—";
  const [y, m, d] = value.split("-");
  return d && m && y ? `${d}/${m}/${y}` : value;
}

/**
 * 🔴 `searchParams` PHẢI được đọc ở đây. Bản M01-B chỉ nhận `params`, trong khi
 * `createStaffFromForm` điều hướng về `/staff/<id>?created=1` và hai form phân
 * công điều hướng kèm `?ok=`/`?error=`. Không đọc nghĩa là **mọi** thông báo bị
 * nuốt: tạo hồ sơ xong, phân công xong, hay phân công THẤT BẠI đều trông giống
 * hệt nhau — đúng bệnh 5W-05 mà M04 sinh ra để chữa. Bản đồ câu chữ nằm ở đây
 * chứ không ở action vì action còn được các component client gọi trực tiếp và
 * chúng tự hiển thị `result.message`.
 */
const NOTICES: Record<string, string> = {
  created: "Đã tạo hồ sơ. Bạn có thể cấp tài khoản và phân công lớp ngay tại đây.",
  assign: "Đã lưu phân công.",
  end: "Đã kết thúc phân công.",
  transfer: "Đã chuyển lớp.",
};
const ERRORS: Record<string, string> = {
  assign: "Không lưu được phân công. Vui lòng kiểm tra lại lớp, vai trò và ngày bắt đầu.",
  end: "Không kết thúc được phân công.",
  transfer: "Không chuyển được lớp.",
};

export default async function StaffDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ staffId: string }>;
  searchParams: Promise<{ created?: string; ok?: string; error?: string }>;
}) {
  const { staffId } = await params;
  // UUID sai định dạng là 404, không phải 500 (S12, AGENTS §5).
  if (!UUID_PATTERN.test(staffId)) notFound();

  const detail = await getStaffDetail(staffId);
  if (!detail) notFound();

  const { staff, canWrite, canTransfer, canManageAccount } = detail;
  const fullTitle = staffDisplayName(staff);

  const { created, ok, error } = await searchParams;
  const notice = created ? NOTICES.created : ok ? NOTICES[ok] : null;
  const errorMessage = error ? (ERRORS[error] ?? null) : null;

  return (
    <PageContainer>
      <PageHeader
        title={fullTitle}
        description={`${staff.staffCode} · Huấn luyện ${formationLabel(staff.formationLevel)}`}
        backHref="/staff"
        backLabel="Danh sách nhân sự"
      />

      {notice ? <div className="mb-4"><FormMessage tone="success">{notice}</FormMessage></div> : null}
      {errorMessage ? <div className="mb-4"><FormMessage tone="danger">{errorMessage}</FormMessage></div> : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle>Hồ sơ</CardTitle><CardDescription>Thông tin nhân sự và trạng thái phục vụ.</CardDescription></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="text-ink-muted">Danh xưng:</span> {TITLE_LABELS[staff.title] ?? staff.title}</p>
              <p><span className="text-ink-muted">Số điện thoại:</span> {staff.phone}</p>
              <p className="flex items-center gap-2"><span className="text-ink-muted">Trạng thái phục vụ:</span> <Badge variant={staff.serviceStatus === "active" ? "success" : "secondary"}>{SERVICE_LABELS[staff.serviceStatus] ?? staff.serviceStatus}</Badge></p>
              {staff.sensitive ? (
                <>
                  <p><span className="text-ink-muted">Ngày sinh:</span> {formatDate(staff.sensitive.dateOfBirth)}</p>
                  <p><span className="text-ink-muted">Địa chỉ:</span> {staff.sensitive.address || "—"}</p>
                  <p><span className="text-ink-muted">Email:</span> {staff.sensitive.email || "—"}</p>
                </>
              ) : (
                <p className="text-ink-muted">Thông tin liên hệ riêng tư chỉ hiển thị cho vai trò quản trị.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Phân công lớp</CardTitle><CardDescription>Mỗi người chỉ có một lớp đang phục vụ tại một thời điểm.</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {staff.assignmentHistory.length === 0 ? (
                <p className="text-sm text-ink-muted">Chưa có phân công lớp nào.</p>
              ) : (
                <ul className="space-y-2">
                  {staff.assignmentHistory.map((item) => (
                    <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3 text-sm">
                      <span>{item.className} · {CAPACITY_LABELS[item.capacity] ?? item.capacity}<span className="text-ink-muted"> · từ {formatDate(item.startsOn)}{item.endsOn ? ` đến ${formatDate(item.endsOn)}` : ""}</span></span>
                      <Badge variant={item.isActive ? "success" : "secondary"}>{item.isActive ? "Đang phục vụ" : "Đã kết thúc"}</Badge>
                    </li>
                  ))}
                </ul>
              )}

              {canWrite || canTransfer ? (
                <StaffAssignmentPanel
                  staffProfileId={staff.id}
                  staffName={fullTitle}
                  activeAssignment={
                    staff.activeAssignment
                      ? {
                          id: staff.activeAssignment.id,
                          classId: staff.activeAssignment.classId,
                          className: staff.activeAssignment.className,
                          capacity: staff.activeAssignment.capacity,
                          startsOn: staff.activeAssignment.startsOn,
                        }
                      : null
                  }
                  classes={detail.classes}
                  canWrite={canWrite}
                  canTransfer={canTransfer}
                  hasAccount={staff.hasAccount}
                />
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          {canManageAccount ? (
            <StaffAccountPanel
              staffProfileId={staff.id}
              staffCode={staff.staffCode}
              fullName={staff.fullName}
              account={staff.account}
              grantableRoles={detail.grantableRoles}
              recommendedRole={detail.recommendedRole}
              activeAssignment={
                staff.activeAssignment
                  ? {
                      classId: staff.activeAssignment.classId,
                      className: staff.activeAssignment.className,
                      capacity: staff.activeAssignment.capacity,
                      startsOn: staff.activeAssignment.startsOn,
                      academicYearId: staff.activeAssignment.academicYearId,
                    }
                  : null
              }
              currentAcademicYear={detail.currentAcademicYear}
              sectors={detail.sectors}
            />
          ) : null}

          {canWrite ? (
            <Card>
              <CardHeader><CardTitle>Sửa hồ sơ</CardTitle><CardDescription>Cập nhật thông tin và trạng thái phục vụ.</CardDescription></CardHeader>
              <CardContent>
                <StaffProfileEditor
                  id={staff.id}
                  title={staff.title}
                  saintName={staff.saintName}
                  fullName={staff.fullName}
                  phone={staff.phone}
                  formationLevel={staff.formationLevel}
                  serviceStatus={staff.serviceStatus}
                  dateOfBirth={staff.sensitive?.dateOfBirth ?? null}
                  address={staff.sensitive?.address ?? null}
                  email={staff.sensitive?.email ?? null}
                />
              </CardContent>
            </Card>
          ) : null}

          {/* D-106 — khối cuối cùng của cột, và đặt cuối là có chủ ý: thao tác
              không hoàn tác được thì không nằm cạnh những nút dùng hằng ngày. */}
          {detail.canDelete ? (
            <Card>
              <CardHeader>
                <CardTitle>Xóa hồ sơ</CardTitle>
                <CardDescription>Chỉ xóa được hồ sơ tạo nhầm, chưa dùng vào việc gì.</CardDescription>
              </CardHeader>
              <CardContent>
                <StaffDeletePanel
                  staffId={staff.id}
                  staffCode={staff.staffCode}
                  fullName={staff.fullName}
                  blockers={detail.deleteBlockers ?? []}
                />
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </PageContainer>
  );
}
