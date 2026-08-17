"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Panel } from "@/components/ui/card";
import { DateField } from "@/components/ui/date-field";
import { Dialog } from "@/components/ui/dialog";
import { FilterField } from "@/components/ui/filter-bar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { APP_ROLES, ROLE_LABELS, type AppRole } from "@/lib/permissions/roles";
import {
  filterAccounts,
  paginateAccounts,
  type AccountRoleFilter,
  type AccountStatusFilter,
} from "../account-directory";
import type { AccountAdminOptions, AccountSummary } from "../server/queries";
import {
  adminDeleteAccount,
  adminProvisionAccount,
  adminResetPassword,
  adminSetAccountStatus,
  adminSetPassword,
  adminUpdateUsername,
} from "../server/actions";
import { FormPendingBridge } from "@/components/loading/form-pending-bridge";
import { useGlobalPending } from "@/components/loading/loading-provider";

/**
 * Q4 (D-103): giao diện chỉ đặt được active/disabled. Dữ liệu cũ còn 'locked' thì
 * hiện đúng tên (không giả vờ là disabled), nhưng bộ đặt trạng thái không đẩy ai
 * vào 'locked' nữa. Badge có icon riêng nên màu không phải tín hiệu duy nhất.
 */
const STATUS_META: Record<AccountSummary["status"], { label: string; variant: "success" | "secondary" | "warning" }> = {
  active: { label: "Đang hoạt động", variant: "success" },
  disabled: { label: "Đã vô hiệu hóa", variant: "secondary" },
  locked: { label: "Đã khóa (cũ)", variant: "warning" },
};

export function AccountAdminPanel({ options }: { options: AccountAdminOptions }) {
  const router = useRouter();
  // D-111: danh sách vai trò do máy chủ đưa xuống (đã lọc trần vai trò + bỏ vai
  // trò gắn hồ sơ nhân sự). Mặc định là mục đầu tiên chứ không phải một mã viết
  // cứng — `class_teacher` cũ nay là vai trò biểu mẫu này KHÔNG cấp được nữa.
  const [role, setRole] = useState<AppRole>(options.provisionableRoles[0] ?? "guardian");
  const [message, setMessage] = useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [usernames, setUsernames] = useState<Record<string, string>>({});
  const [passwords, setPasswords] = useState<Record<string, string>>({});

  // TB-06 (F09): lọc + phân trang danh sách tài khoản.
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<AccountRoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<AccountStatusFilter>("all");
  const [page, setPage] = useState(1);

  // Xóa tài khoản: hộp thoại gõ lại tên đăng nhập (thay window.confirm — nợ #1).
  const [deleteTarget, setDeleteTarget] = useState<AccountSummary | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletePending, setDeletePending] = useState(false);
  useGlobalPending(deletePending);

  const filtered = useMemo(
    () => filterAccounts(options.accounts, { search, role: roleFilter, status: statusFilter }),
    [options.accounts, search, roleFilter, statusFilter],
  );
  const paged = paginateAccounts(filtered, page);
  // Lọc đổi thì về trang 1; nếu không, trang hiện tại có thể trỏ ra ngoài kết quả.
  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, statusFilter]);

  const deleteMatches =
    deleteTarget !== null &&
    deleteConfirmText.trim().toLowerCase() === deleteTarget.username.toLowerCase();

  async function provision(formData: FormData) {
    setMessage(null);
    setTemporaryPassword(null);
    const guardianId = String(formData.get("guardianId") ?? "") || null;
    const studentId = String(formData.get("studentId") ?? "") || null;
    const guardian = options.guardians.find((item) => item.id === guardianId);
    const student = options.students.find((item) => item.id === studentId);
    const result = await adminProvisionAccount({
      username: guardian?.username ?? student?.username ?? String(formData.get("username") ?? ""),
      displayName: guardian?.displayName ?? student?.displayName ?? String(formData.get("displayName") ?? ""),
      saintName: student?.saintName ?? (String(formData.get("saintName") ?? "") || null),
      phone: guardian?.username ?? (String(formData.get("phone") ?? "") || null),
      email: String(formData.get("email") ?? "") || null,
      role,
      academicYearId: null,
      sectorId: null,
      classId: null,
      guardianId,
      studentId,
      startsOn: String(formData.get("startsOn") ?? ""),
    });
    if (!result.ok) return setMessage(result.message);
    setTemporaryPassword(result.data.temporaryPassword);
    setMessage(`Đã tạo ${result.data.username}. Hãy bàn giao mật khẩu đúng một lần.`);
    router.refresh();
  }

  async function resetPassword(profileId: string) {
    setMessage(null);
    setTemporaryPassword(null);
    const result = await adminResetPassword(profileId);
    if (!result.ok) return setMessage(result.message);
    setTemporaryPassword(result.data.temporaryPassword);
    setMessage("Đã đặt mật khẩu tạm mới. Tài khoản phải đổi mật khẩu khi đăng nhập.");
  }

  async function setPassword(profileId: string) {
    setMessage(null);
    setTemporaryPassword(null);
    const result = await adminSetPassword(profileId, passwords[profileId] ?? "");
    if (!result.ok) return setMessage(result.message);
    setPasswords((current) => ({ ...current, [profileId]: "" }));
    setMessage("Đã đặt mật khẩu mới. Tài khoản phải đổi mật khẩu khi đăng nhập.");
  }

  async function updateUsername(profileId: string, currentUsername: string) {
    setMessage(null);
    setTemporaryPassword(null);
    const result = await adminUpdateUsername(profileId, usernames[profileId] ?? currentUsername);
    if (!result.ok) return setMessage(result.message);
    setUsernames((current) => ({ ...current, [profileId]: result.data.username }));
    setMessage(`Đã đổi tên đăng nhập thành ${result.data.username}.`);
    router.refresh();
  }

  async function setStatus(profileId: string, status: "active" | "disabled") {
    setMessage(null);
    setTemporaryPassword(null);
    const result = await adminSetAccountStatus(profileId, status);
    setMessage(result.ok ? "Đã cập nhật trạng thái tài khoản." : result.message);
    if (result.ok) router.refresh();
  }

  function openDelete(account: AccountSummary) {
    setMessage(null);
    setTemporaryPassword(null);
    setDeleteConfirmText("");
    setDeleteTarget(account);
  }

  function closeDelete() {
    if (deletePending) return;
    setDeleteTarget(null);
    setDeleteConfirmText("");
  }

  async function confirmDelete() {
    if (!deleteTarget || !deleteMatches) return;
    setDeletePending(true);
    const result = await adminDeleteAccount(deleteTarget.id);
    setDeletePending(false);
    setDeleteTarget(null);
    setDeleteConfirmText("");
    setMessage(result.ok ? "Đã xóa tài khoản; hồ sơ nghiệp vụ vẫn được giữ lại." : result.message);
    if (result.ok) router.refresh();
  }

  const isOwnershipRole = role === "guardian" || role === "student";
  return (
    <div className="mt-5 grid gap-5 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Tạo tài khoản ngoại lệ</CardTitle>
          <CardDescription>
            Chỉ dành cho người <strong>không có hồ sơ Giáo lý viên</strong>: Cha sở, Cha phó, phụ
            huynh và thiếu nhi. Mật khẩu tạm 8 ký tự chỉ hiển thị sau khi tạo thành công.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Panel as="p" className="mb-4 text-sm text-ink-muted">
            Tài khoản của Giáo lý viên được cấp ngay tại hồ sơ người đó —{" "}
            <Link href="/staff" className="font-medium text-ink underline underline-offset-2">
              mở Danh sách nhân sự
            </Link>
            , chọn đúng người rồi bấm &ldquo;Cấp tài khoản&rdquo;. Ở đó trang biết sẵn mã GLV, lớp và
            phân công nên không phải gõ lại.
          </Panel>
          <form action={provision} className="space-y-4">
            <FormPendingBridge />
            <div className="space-y-2">
              <Label htmlFor="account-role">Vai trò</Label>
              <Select
                id="account-role"
                name="role"
                value={role}
                onChange={(event) => setRole(event.target.value as AppRole)}
              >
                {options.provisionableRoles.map((item) => <option key={item} value={item}>{ROLE_LABELS[item]}</option>)}
              </Select>
            </div>

            {!isOwnershipRole ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="account-username">Tên đăng nhập</Label><Input id="account-username" name="username" required /></div>
                <div className="space-y-2"><Label htmlFor="account-display-name">Tên hiển thị</Label><Input id="account-display-name" name="displayName" required /></div>
                <div className="space-y-2"><Label htmlFor="account-saint-name">Tên thánh</Label><Input id="account-saint-name" name="saintName" /></div>
                <div className="space-y-2"><Label htmlFor="account-phone">Điện thoại</Label><Input id="account-phone" name="phone" inputMode="tel" /></div>
                <div className="space-y-2 sm:col-span-2"><Label htmlFor="account-email">Email liên hệ (tùy chọn)</Label><Input id="account-email" name="email" type="email" /></div>
              </div>
            ) : null}

            {role === "guardian" ? (
              <div className="space-y-2">
                <Label htmlFor="account-guardian">Hồ sơ phụ huynh</Label>
                <Select id="account-guardian" name="guardianId" required defaultValue="" placeholder="Chọn hồ sơ chưa có tài khoản">
                  {options.guardians.map((guardian) => <option key={guardian.id} value={guardian.id}>{guardian.label}</option>)}
                </Select>
              </div>
            ) : null}

            {role === "student" ? (
              <div className="space-y-2">
                <Label htmlFor="account-student">Hồ sơ thiếu nhi</Label>
                <Select id="account-student" name="studentId" required defaultValue="" placeholder="Chọn hồ sơ chưa có tài khoản">
                  {options.students.map((student) => <option key={student.id} value={student.id}>{student.label}</option>)}
                </Select>
              </div>
            ) : null}

            <div className="space-y-2"><Label htmlFor="account-start">Ngày bắt đầu</Label><DateField id="account-start" name="startsOn" required /></div>
            <Button type="submit" className="w-full">Tạo tài khoản</Button>
          </form>
          {message ? <p className="mt-4 text-sm text-ink-muted" role="status">{message}</p> : null}
          {temporaryPassword ? <div className="mt-3 rounded-md border border-warning bg-warning-subtle p-4"><p className="text-xs font-medium uppercase tracking-wide text-warning">Mật khẩu tạm — chỉ hiển thị lần này</p><code className="mt-2 block text-xl font-semibold text-ink">{temporaryPassword}</code></div> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Tài khoản hiện có</CardTitle><CardDescription>Chỉ tài khoản không phải Super Admin mới sửa hoặc xóa được tại đây.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          {/* Đợt E — khối lọc tự chế, và là ví dụ rõ nhất của "lệch tùm lum":
              ô tìm có `<Label>` nhưng `sr-only` **không chiếm chỗ**, hai ô chọn
              cạnh nó chỉ có `aria-label` nên **không có** hàng nhãn nào ⇒ ba ô
              trong một lưới bắt đầu ở ba độ cao khác nhau. Nay cả ba đi qua
              `FilterField`, và cả nhóm nằm trong `<fieldset>`+`<legend>` theo
              `09` §6 — trước đó ba ô lọc này rời rạc với trình đọc màn hình.
              🔴 Nhãn của hai ô chọn giữ **nguyên văn** "Lọc theo vai trò" /
              "Lọc theo trạng thái": `account-security.spec.ts:106` tìm ô "Vai
              trò" bằng `exact: true` đúng vì trên trang còn ô này. */}
          <fieldset className="min-w-0 border-0 p-0">
            <legend className="mb-3 text-sm font-semibold text-ink">Lọc danh sách tài khoản</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              <FilterField
                className="sm:col-span-2"
                label="Tìm tài khoản"
                htmlFor="account-search"
                helper="Tìm theo tên hiển thị hoặc tên đăng nhập."
              >
                <Input
                  id="account-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm theo tên hoặc tên đăng nhập"
                />
              </FilterField>
              <FilterField label="Lọc theo vai trò" htmlFor="account-role-filter">
                <Select id="account-role-filter" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as AccountRoleFilter)}>
                  <option value="all">Tất cả vai trò</option>
                  {APP_ROLES.map((item) => <option key={item} value={item}>{ROLE_LABELS[item]}</option>)}
                </Select>
              </FilterField>
              <FilterField label="Lọc theo trạng thái" htmlFor="account-status-filter">
                <Select id="account-status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as AccountStatusFilter)}>
                  <option value="all">Mọi trạng thái</option>
                  <option value="active">Đang hoạt động</option>
                  <option value="disabled">Đã vô hiệu hóa</option>
                </Select>
              </FilterField>
            </div>
          </fieldset>

          <p className="text-sm text-ink-muted" role="status">
            {paged.total === 0
              ? "Không có tài khoản nào khớp bộ lọc."
              : `${paged.total} tài khoản · trang ${paged.page}/${paged.pageCount}`}
          </p>

          {paged.items.map((account) => {
            const canManage = account.role !== "super_admin";
            const status = STATUS_META[account.status];
            return (
              <Panel key={account.id} padding="md">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-ink">{account.displayName}</p>
                    <p className="text-sm text-ink-muted">{account.username} · {account.role ? ROLE_LABELS[account.role] : "Chưa gán vai trò"}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {account.mustChangePassword ? <Badge variant="warning">Chưa đổi mật khẩu</Badge> : null}
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                </div>
                {canManage ? (
                  <div className="mt-4 space-y-3">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input aria-label={`Tên đăng nhập ${account.displayName}`} value={usernames[account.id] ?? account.username} onChange={(event) => setUsernames((current) => ({ ...current, [account.id]: event.target.value }))} />
                      <Button type="button" variant="outline" onClick={() => updateUsername(account.id, account.username)}>Lưu username</Button>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input aria-label={`Mật khẩu mới ${account.displayName}`} type="password" minLength={8} placeholder="Mật khẩu mới, ít nhất 8 ký tự" value={passwords[account.id] ?? ""} onChange={(event) => setPasswords((current) => ({ ...current, [account.id]: event.target.value }))} />
                      <Button type="button" variant="outline" onClick={() => setPassword(account.id)}>Đặt mật khẩu</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => resetPassword(account.id)}>Tạo mật khẩu ngẫu nhiên</Button>
                      {account.status === "active" ? <Button type="button" size="sm" variant="danger" onClick={() => setStatus(account.id, "disabled")}>Vô hiệu hóa</Button> : <Button type="button" size="sm" onClick={() => setStatus(account.id, "active")}>Kích hoạt</Button>}
                      <Button type="button" size="sm" variant="danger" onClick={() => openDelete(account)}>Xóa tài khoản</Button>
                    </div>
                  </div>
                ) : <p className="mt-3 text-xs text-ink-muted">Tài khoản Super Admin không được sửa/xóa qua danh sách này.</p>}
              </Panel>
            );
          })}

          {paged.pageCount > 1 ? (
            <div className="flex items-center justify-between gap-2">
              <Button type="button" variant="outline" size="sm" disabled={paged.page <= 1} onClick={() => setPage(paged.page - 1)}>Trang trước</Button>
              <span className="text-sm text-ink-muted">Trang {paged.page}/{paged.pageCount}</span>
              <Button type="button" variant="outline" size="sm" disabled={paged.page >= paged.pageCount} onClick={() => setPage(paged.page + 1)}>Trang sau</Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog
        open={deleteTarget !== null}
        onClose={closeDelete}
        title="Xóa tài khoản đăng nhập"
        description={
          deleteTarget ? (
            <>
              Xóa quyền đăng nhập của <strong>{deleteTarget.displayName}</strong> (tên đăng nhập{" "}
              <strong>{deleteTarget.username}</strong>). Hồ sơ nghiệp vụ và lịch sử vai trò vẫn được
              giữ lại; thao tác này <strong>không hoàn tác được</strong>. Gõ lại tên đăng nhập để xác nhận.
            </>
          ) : null
        }
        footer={
          <>
            <Button variant="outline" onClick={closeDelete} disabled={deletePending}>Huỷ</Button>
            <Button variant="danger" onClick={confirmDelete} pending={deletePending} disabled={!deleteMatches}>
              Xóa tài khoản
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          <Label htmlFor="delete-confirm">Nhập lại tên đăng nhập</Label>
          <Input
            id="delete-confirm"
            value={deleteConfirmText}
            autoComplete="off"
            placeholder={deleteTarget?.username}
            onChange={(event) => setDeleteConfirmText(event.target.value)}
          />
        </div>
      </Dialog>
    </div>
  );
}
