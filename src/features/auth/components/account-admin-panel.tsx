"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_ROLES, CLASS_ROLES, ROLE_LABELS, SECTOR_ROLES, STAFF_PROFILE_ROLES, type AppRole } from "@/lib/permissions/roles";
import type { AccountAdminOptions } from "../server/queries";
import {
  adminDeleteAccount,
  adminProvisionAccount,
  adminResetPassword,
  adminSetAccountStatus,
  adminSetPassword,
  adminUpdateUsername,
} from "../server/actions";

const selectClassName = "h-11 w-full rounded-md border border-border bg-card px-3 text-sm";

export function AccountAdminPanel({ options }: { options: AccountAdminOptions }) {
  const router = useRouter();
  const [role, setRole] = useState<AppRole>("class_teacher");
  const [message, setMessage] = useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [usernames, setUsernames] = useState<Record<string, string>>({});
  const [passwords, setPasswords] = useState<Record<string, string>>({});

  async function provision(formData: FormData) {
    setMessage(null);
    setTemporaryPassword(null);
    const guardianId = String(formData.get("guardianId") ?? "") || null;
    const studentId = String(formData.get("studentId") ?? "") || null;
    const guardian = options.guardians.find((item) => item.id === guardianId);
    const student = options.students.find((item) => item.id === studentId);
    const staffProfileId = String(formData.get("staffProfileId") ?? "") || null;
    const staff = options.staffProfiles.find((item) => item.id === staffProfileId);
    const result = await adminProvisionAccount({
      username: staff?.username ?? guardian?.username ?? student?.username ?? String(formData.get("username") ?? ""),
      displayName: staff?.displayName ?? guardian?.displayName ?? student?.displayName ?? String(formData.get("displayName") ?? ""),
      saintName: staff?.saintName ?? student?.saintName ?? (String(formData.get("saintName") ?? "") || null),
      phone: staff?.phone ?? guardian?.username ?? (String(formData.get("phone") ?? "") || null),
      email: staff?.email ?? (String(formData.get("email") ?? "") || null),
      role,
      academicYearId: String(formData.get("academicYearId") ?? "") || null,
      sectorId: String(formData.get("sectorId") ?? "") || null,
      classId: String(formData.get("classId") ?? "") || null,
      staffProfileId,
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

  async function deleteAccount(profileId: string, displayName: string) {
    if (!window.confirm(`Xóa tài khoản của ${displayName}? Hồ sơ nghiệp vụ vẫn được giữ lại.`)) return;
    setMessage(null);
    setTemporaryPassword(null);
    const result = await adminDeleteAccount(profileId);
    setMessage(result.ok ? "Đã xóa tài khoản; hồ sơ nghiệp vụ vẫn được giữ lại." : result.message);
    if (result.ok) router.refresh();
  }

  const needsYear = SECTOR_ROLES.includes(role) || CLASS_ROLES.includes(role);
  const isOwnershipRole = role === "guardian" || role === "student";
  const needsStaffProfile = STAFF_PROFILE_ROLES.includes(role);
  return (
    <div className="mt-5 grid gap-5 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Tạo tài khoản</CardTitle>
          <CardDescription>Mật khẩu tạm 8 ký tự chỉ hiển thị sau khi tạo thành công.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={provision} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="account-role">Role chính</Label>
              <select id="account-role" name="role" value={role} onChange={(event) => setRole(event.target.value as AppRole)} className={selectClassName}>
                {APP_ROLES.map((item) => <option key={item} value={item}>{ROLE_LABELS[item]}</option>)}
              </select>
            </div>

            {!isOwnershipRole && !needsStaffProfile ? (
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
                <select id="account-guardian" name="guardianId" required className={selectClassName}>
                  <option value="">Chọn hồ sơ chưa có tài khoản</option>
                  {options.guardians.map((guardian) => <option key={guardian.id} value={guardian.id}>{guardian.label}</option>)}
                </select>
              </div>
            ) : null}

            {role === "student" ? (
              <div className="space-y-2">
                <Label htmlFor="account-student">Hồ sơ thiếu nhi</Label>
                <select id="account-student" name="studentId" required className={selectClassName}>
                  <option value="">Chọn hồ sơ chưa có tài khoản</option>
                  {options.students.map((student) => <option key={student.id} value={student.id}>{student.label}</option>)}
                </select>
              </div>
            ) : null}

            {needsYear ? <div className="space-y-2"><Label htmlFor="account-year">Năm học</Label><select id="account-year" name="academicYearId" required className={selectClassName}><option value="">Chọn năm học</option>{options.academicYears.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}</select></div> : null}
            {SECTOR_ROLES.includes(role) ? <div className="space-y-2"><Label htmlFor="account-sector">Ngành</Label><select id="account-sector" name="sectorId" required className={selectClassName}><option value="">Chọn ngành</option>{options.sectors.map((sector) => <option key={sector.id} value={sector.id}>{sector.name}</option>)}</select></div> : null}
            {CLASS_ROLES.includes(role) ? <div className="space-y-2"><Label htmlFor="account-class">Lớp</Label><select id="account-class" name="classId" required className={selectClassName}><option value="">Chọn lớp</option>{options.classes.map((item) => <option key={item.id} value={item.id}>{item.displayName}</option>)}</select></div> : null}
            {needsStaffProfile ? <div className="space-y-2"><Label htmlFor="account-staff">Hồ sơ Giáo lý viên</Label><select id="account-staff" name="staffProfileId" required className={selectClassName}><option value="">{CLASS_ROLES.includes(role) ? "Chọn hồ sơ đã phân công đúng lớp" : "Chọn hồ sơ chưa có tài khoản"}</option>{options.staffProfiles.map((staff) => <option key={staff.id} value={staff.id}>{staff.label}</option>)}</select></div> : null}
            <div className="space-y-2"><Label htmlFor="account-start">Ngày bắt đầu</Label><Input id="account-start" name="startsOn" type="date" required /></div>
            <Button type="submit" className="w-full">Tạo tài khoản</Button>
          </form>
          {message ? <p className="mt-4 text-sm text-muted-foreground" role="status">{message}</p> : null}
          {temporaryPassword ? <div className="mt-3 rounded-md border border-warning/40 bg-warning/10 p-4"><p className="text-xs font-medium uppercase tracking-wide">Mật khẩu tạm — chỉ hiển thị lần này</p><code className="mt-2 block text-xl font-semibold">{temporaryPassword}</code></div> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Tài khoản hiện có</CardTitle><CardDescription>Chỉ tài khoản không phải Super Admin mới sửa hoặc xóa được tại đây.</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          {options.accounts.length === 0 ? <p className="text-sm text-muted-foreground">Chưa có tài khoản.</p> : options.accounts.map((account) => {
            const canManage = account.role !== "super_admin";
            return (
              <div key={account.id} className="rounded-md border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-medium">{account.displayName}</p><p className="text-sm text-muted-foreground">{account.username} · {account.role ? ROLE_LABELS[account.role] : "Chưa gán role"}</p></div><Badge variant={account.status === "active" ? "success" : "warning"}>{account.status}</Badge></div>
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
                      <Button type="button" size="sm" variant="danger" onClick={() => deleteAccount(account.id, account.displayName)}>Xóa tài khoản</Button>
                    </div>
                  </div>
                ) : <p className="mt-3 text-xs text-muted-foreground">Tài khoản Super Admin không được sửa/xóa qua danh sách này.</p>}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
