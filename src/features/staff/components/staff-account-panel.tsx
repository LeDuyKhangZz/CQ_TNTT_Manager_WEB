"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DateField } from "@/components/ui/date-field";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormMessage } from "@/components/ui/form-message";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { CLASS_ROLES, ROLE_LABELS, SECTOR_ROLES, type AppRole } from "@/lib/permissions/roles";
import { provisionAccountForStaff, assignPrimaryRole } from "@/features/auth/server/actions";
import { adminResetPassword, adminSetAccountStatus } from "@/features/auth/server/actions";
import { useGlobalPending } from "@/components/loading/loading-provider";

type ActiveAssignment = {
  classId: string;
  className: string;
  capacity: string;
  startsOn: string;
  academicYearId: string | null;
} | null;

type Account = {
  profileId: string;
  username: string;
  accountStatus: string;
  mustChangePassword: boolean;
  role: AppRole | null;
  roleScopeLabel: string | null;
} | null;

export type StaffAccountPanelProps = {
  staffProfileId: string;
  staffCode: string;
  fullName: string;
  account: Account;
  grantableRoles: AppRole[];
  /**
   * Vai trò chọn sẵn (D-111). Hồ sơ đang đứng lớp thì ô chọn nay có cả vai trò
   * ngành/toàn xứ đoàn, nên nếu không chọn sẵn vai trò lớp thì trường hợp áp đảo
   * lại tốn thêm một thao tác. `null` ⇒ để trống, bắt người dùng chọn.
   */
  recommendedRole: AppRole | null;
  activeAssignment: ActiveAssignment;
  currentAcademicYear: { id: string; name: string } | null;
  sectors: Array<{ id: string; name: string }>;
};

const STATUS_META: Record<string, { label: string; variant: "success" | "secondary" | "warning" }> = {
  active: { label: "Đang hoạt động", variant: "success" },
  disabled: { label: "Đã vô hiệu hóa", variant: "secondary" },
  locked: { label: "Đã khóa (cũ)", variant: "warning" },
};

function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/**
 * Khối "Tài khoản đăng nhập" của trang chi tiết GLV (TB-01/TB-05). Chỉ render khi
 * người xem là Super Admin (`canManageAccount` ở trang) — nhưng server action vẫn
 * tự authorize, ẩn nút không phải authorization (AGENTS §5).
 */
export function StaffAccountPanel(props: StaffAccountPanelProps) {
  const router = useRouter();
  const { account, grantableRoles, recommendedRole, activeAssignment } = props;

  const [dialog, setDialog] = useState<null | "grant" | "assign">(null);
  const [role, setRole] = useState<AppRole | "">(recommendedRole ?? "");
  const [sectorId, setSectorId] = useState("");
  const [startsOn, setStartsOn] = useState(activeAssignment?.startsOn ?? todayIso());
  const [pending, setPending] = useState(false);
  useGlobalPending(pending);
  const [error, setError] = useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [statusTarget, setStatusTarget] = useState<null | "disable" | "enable">(null);

  const selectedRole = role || null;
  const isClassRole = selectedRole !== null && CLASS_ROLES.includes(selectedRole);
  const isSectorRole = selectedRole !== null && SECTOR_ROLES.includes(selectedRole);

  function openDialog(which: "grant" | "assign") {
    setError(null);
    setTemporaryPassword(null);
    setNotice(null);
    setRole(recommendedRole ?? "");
    setSectorId("");
    setStartsOn(activeAssignment?.startsOn ?? todayIso());
    setDialog(which);
  }

  async function submit() {
    if (!selectedRole) {
      setError("Vui lòng chọn vai trò.");
      return;
    }
    // Phạm vi suy ra theo loại vai trò: role lớp lấy từ phân công đang hoạt động;
    // role ngành cần chọn ngành + năm hiện hành; role toàn cục không nhận phạm vi.
    const scope = isClassRole
      ? {
          academicYearId: activeAssignment?.academicYearId ?? null,
          classId: activeAssignment?.classId ?? null,
          sectorId: null,
        }
      : isSectorRole
        ? { academicYearId: props.currentAcademicYear?.id ?? null, sectorId: sectorId || null, classId: null }
        : { academicYearId: null, sectorId: null, classId: null };

    if (isSectorRole && !scope.sectorId) {
      setError("Vui lòng chọn ngành.");
      return;
    }
    if (isSectorRole && !scope.academicYearId) {
      setError("Chưa có năm học hiện hành để gán vai trò ngành.");
      return;
    }

    setPending(true);
    setError(null);
    try {
      if (dialog === "grant") {
        const result = await provisionAccountForStaff({
          staffProfileId: props.staffProfileId,
          role: selectedRole,
          academicYearId: scope.academicYearId,
          sectorId: scope.sectorId,
          classId: scope.classId,
          startsOn,
        });
        if (!result.ok) {
          setError(result.message);
          return;
        }
        setTemporaryPassword(result.data.temporaryPassword);
        setNotice(`Đã cấp tài khoản ${result.data.username}. Bàn giao mật khẩu tạm đúng một lần.`);
        setDialog(null);
        router.refresh();
      } else if (account) {
        const result = await assignPrimaryRole({
          profileId: account.profileId,
          role: selectedRole,
          academicYearId: scope.academicYearId,
          sectorId: scope.sectorId,
          classId: scope.classId,
          startsOn,
        });
        if (!result.ok) {
          setError(result.message);
          return;
        }
        setNotice(`Đã đổi vai trò sang ${ROLE_LABELS[selectedRole]}.`);
        setDialog(null);
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  }

  async function resetPassword() {
    if (!account) return;
    setError(null);
    setTemporaryPassword(null);
    setNotice(null);
    setPending(true);
    try {
      const result = await adminResetPassword(account.profileId);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setTemporaryPassword(result.data.temporaryPassword);
      setNotice("Đã đặt mật khẩu tạm mới. Tài khoản phải đổi khi đăng nhập.");
    } finally {
      setPending(false);
    }
  }

  async function changeStatus() {
    if (!account || !statusTarget) return;
    setError(null);
    setNotice(null);
    setPending(true);
    try {
      const result = await adminSetAccountStatus(account.profileId, statusTarget === "disable" ? "disabled" : "active");
      if (!result.ok) {
        setError(result.message);
      } else {
        setNotice(statusTarget === "disable" ? "Đã vô hiệu hóa tài khoản." : "Đã kích hoạt lại tài khoản.");
        router.refresh();
      }
    } finally {
      setPending(false);
      setStatusTarget(null);
    }
  }

  async function copyPassword() {
    if (!temporaryPassword) return;
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const status = account ? STATUS_META[account.accountStatus] ?? { label: account.accountStatus, variant: "secondary" as const } : null;
  const dialogTitle = dialog === "grant" ? "Cấp tài khoản đăng nhập" : "Đổi vai trò";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tài khoản đăng nhập</CardTitle>
        <CardDescription>Trạng thái phục vụ và tài khoản là hai việc độc lập.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {notice ? <FormMessage tone="success">{notice}</FormMessage> : null}
        {error && !dialog ? <FormMessage tone="danger">{error}</FormMessage> : null}
        {temporaryPassword ? (
          <div className="space-y-2 rounded-md border border-warning bg-warning-subtle p-3">
            <p className="text-sm font-medium text-ink">Mật khẩu tạm (hiện một lần):</p>
            <div className="flex items-center gap-2">
              <code className="rounded bg-surface px-2 py-1 text-base font-semibold tracking-wide">{temporaryPassword}</code>
              <Button type="button" variant="outline" size="sm" onClick={copyPassword}>
                {copied ? "Đã sao chép" : "Sao chép"}
              </Button>
            </div>
          </div>
        ) : null}

        {account === null ? (
          <div className="space-y-3">
            <Badge variant="secondary">Chưa có tài khoản</Badge>
            {grantableRoles.length > 0 ? (
              <Button type="button" onClick={() => openDialog("grant")}>Cấp tài khoản</Button>
            ) : (
              <p className="text-sm text-ink-muted">
                Hãy phân công hồ sơ vào lớp/ngành trước, hoặc chọn một vai trò phù hợp để cấp tài khoản.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-ink">{account.username}</span>
              {status ? <Badge variant={status.variant}>{status.label}</Badge> : null}
              {account.mustChangePassword ? <Badge variant="warning">Chưa đổi mật khẩu lần đầu</Badge> : null}
            </div>
            <p className="text-sm text-ink-muted">
              Vai trò: {account.role ? ROLE_LABELS[account.role] : "Chưa gán"}
              {account.roleScopeLabel ? ` · ${account.roleScopeLabel}` : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              {grantableRoles.length > 0 ? (
                <Button type="button" variant="outline" size="sm" onClick={() => openDialog("assign")}>Đổi vai trò</Button>
              ) : null}
              <Button type="button" variant="outline" size="sm" onClick={resetPassword} pending={pending}>Đặt lại mật khẩu</Button>
              {account.accountStatus === "active" ? (
                <Button type="button" variant="outline" size="sm" onClick={() => setStatusTarget("disable")}>Vô hiệu hóa</Button>
              ) : (
                <Button type="button" variant="outline" size="sm" onClick={() => setStatusTarget("enable")}>Kích hoạt lại</Button>
              )}
            </div>
          </div>
        )}
      </CardContent>

      <Dialog
        open={dialog !== null}
        onClose={() => setDialog(null)}
        title={dialogTitle}
        description={`Tên đăng nhập: ${props.staffCode} · ${props.fullName}`}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setDialog(null)} disabled={pending}>Hủy</Button>
            <Button type="button" onClick={submit} pending={pending}>Xác nhận</Button>
          </>
        }
      >
        <div className="space-y-3">
          {error && dialog ? <FormMessage tone="danger">{error}</FormMessage> : null}
          <div className="space-y-1">
            <Label htmlFor="grant-role">Vai trò</Label>
            <Select
              id="grant-role"
              value={role}
              placeholder="Chọn vai trò"
              onChange={(event) => setRole(event.target.value as AppRole)}
            >
              {grantableRoles.map((item) => (
                <option key={item} value={item}>{ROLE_LABELS[item]}</option>
              ))}
            </Select>
          </div>
          {isClassRole && activeAssignment ? (
            <p className="text-sm text-ink-muted">Lớp: {activeAssignment.className} (theo phân công đang hoạt động).</p>
          ) : null}
          {isSectorRole ? (
            <div className="space-y-1">
              <Label htmlFor="grant-sector">Ngành</Label>
              <Select id="grant-sector" value={sectorId} placeholder="Chọn ngành" onChange={(event) => setSectorId(event.target.value)}>
                {props.sectors.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </Select>
              {props.currentAcademicYear ? (
                <p className="text-xs text-ink-muted">Năm học: {props.currentAcademicYear.name}</p>
              ) : null}
            </div>
          ) : null}
          <div className="space-y-1">
            <Label htmlFor="grant-start">Ngày bắt đầu</Label>
            <DateField id="grant-start" value={startsOn} onChange={(event) => setStartsOn(event.target.value)} required />
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        open={statusTarget !== null}
        onClose={() => setStatusTarget(null)}
        onConfirm={changeStatus}
        pending={pending}
        title={statusTarget === "disable" ? "Vô hiệu hóa tài khoản?" : "Kích hoạt lại tài khoản?"}
        consequence={
          statusTarget === "disable"
            ? `Tài khoản ${account?.username ?? ""} sẽ không đăng nhập được cho tới khi kích hoạt lại.`
            : `Tài khoản ${account?.username ?? ""} sẽ đăng nhập lại được.`
        }
        confirmLabel={statusTarget === "disable" ? "Vô hiệu hóa" : "Kích hoạt"}
        tone={statusTarget === "disable" ? "danger" : "primary"}
      />
    </Card>
  );
}
