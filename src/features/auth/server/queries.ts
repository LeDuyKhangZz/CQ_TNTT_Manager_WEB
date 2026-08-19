import "server-only";

import { AppError } from "@/lib/errors";
import { requireAuthContext } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import type { AuthContext } from "@/lib/auth/types";
import type { AppRole } from "@/lib/permissions/roles";
import { adminProvisionableRoles } from "../account-directory";

export interface AccountSummary {
  id: string;
  username: string;
  displayName: string;
  status: "active" | "locked" | "disabled";
  role: AppRole | null;
  /** TB-06 (F09): cờ "chưa đổi mật khẩu lần đầu" để danh sách nhìn ra ngay. */
  mustChangePassword: boolean;
}

export interface AccountAdminOptions {
  accounts: AccountSummary[];
  /**
   * Vai trò biểu mẫu `/admin` còn cấp được (D-111) — do MÁY CHỦ quyết theo vai
   * trò người thao tác, không phải danh sách cứng ở giao diện.
   */
  provisionableRoles: AppRole[];
  /** `username` null = phụ huynh chưa có SĐT ⇒ chưa cấp được tài khoản (IMP-BULK-002). */
  guardians: Array<{ id: string; username: string | null; displayName: string; label: string }>;
  students: Array<{ id: string; username: string; displayName: string; saintName: string; label: string }>;
}

export async function getAccountAdminOptions(): Promise<AccountAdminOptions> {
  const context = await requireAuthContext("/admin");
  if (context.role !== "super_admin") throw new AppError("FORBIDDEN");
  const supabase = await createClient();
  // M04-C: bốn truy vấn (năm học · ngành · lớp · hồ sơ nhân sự) đã bỏ — biểu mẫu
  // `/admin` không còn cấp tài khoản cho vai trò gắn hồ sơ nhân sự nên không cần
  // phạm vi năm/ngành/lớp nữa (D-111).
  const [profilesResult, guardiansResult, studentsResult] = await Promise.all([
    supabase.from("profiles").select("id, username, display_name, account_status, must_change_password, role_assignments(role, is_active)").order("username"),
    supabase.from("guardians").select("id, full_name, phone").is("profile_id", null).eq("status", "active").order("full_name"),
    supabase.from("students").select("id, student_code, saint_name, full_name").is("profile_id", null).eq("status", "active").order("full_name"),
  ]);

  const profiles = (profilesResult.data ?? []) as unknown as Array<{
    id: string;
    username: string;
    display_name: string;
    account_status: AccountSummary["status"];
    must_change_password: boolean;
    role_assignments: Array<{ role: AppRole; is_active: boolean }>;
  }>;

  return {
    accounts: profiles.map((profile) => ({
      id: profile.id,
      username: profile.username,
      displayName: profile.display_name,
      status: profile.account_status,
      role: profile.role_assignments.find((assignment) => assignment.is_active)?.role ?? null,
      mustChangePassword: profile.must_change_password,
    })),
    provisionableRoles: adminProvisionableRoles(context.role),
    // IMP-BULK-002 — phụ huynh không có số điện thoại vẫn hiện trong danh sách,
    // nhưng `username = null` để ô chọn khoá chúng lại. Lọc bỏ hẳn thì người
    // thao tác đi tìm một cái tên không có ở đâu cả và không ai nói vì sao.
    guardians: (guardiansResult.data ?? []).map((guardian) => ({
      id: guardian.id,
      username: guardian.phone,
      displayName: guardian.full_name,
      label: guardian.phone
        ? `${guardian.full_name} · ${guardian.phone}`
        : `${guardian.full_name} · chưa có SĐT nên chưa cấp được tài khoản`,
    })),
    students: (studentsResult.data ?? []).map((student) => ({
      id: student.id,
      username: student.student_code,
      displayName: student.full_name,
      saintName: student.saint_name,
      label: `${student.student_code} · ${student.saint_name} ${student.full_name}`,
    })),
  };
}

/**
 * Nhãn phạm vi (lớp/ngành) cho trang `/account` — TB-03, AC-M01-06.
 *
 * Vai trò toàn cục/ownership không có phạm vi lớp/ngành nên trả `null` và trang
 * bỏ hẳn dòng đó thay vì hiện một ô trống. Đọc qua client người dùng (chịu RLS):
 * `classes`/`sectors` là dữ liệu tra cứu mọi nhân sự đọc được; phụ huynh/thiếu
 * nhi không có `classId`/`sectorId` nên không chạm tới truy vấn nào.
 */
export async function getAccountScopeLabel(context: AuthContext): Promise<string | null> {
  if (context.classId) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("classes")
      .select("display_name")
      .eq("id", context.classId)
      .maybeSingle();
    return data ? `Lớp ${data.display_name}` : null;
  }
  if (context.sectorId) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("sectors")
      .select("name")
      .eq("id", context.sectorId)
      .maybeSingle();
    return data ? `Ngành ${data.name}` : null;
  }
  return null;
}
