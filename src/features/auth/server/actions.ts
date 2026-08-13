"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { AppError, type AppErrorCode } from "@/lib/errors";
import { requireAuthContext, requireRouteAccess } from "@/lib/auth/guards";
import { buildChangePasswordUrl, buildLoginUrl, resolveNextPath } from "@/lib/auth/login-redirect";
import { canActorAssignRole, isAppRole, CLASS_ROLES, ROLE_LABELS } from "@/lib/permissions/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { AuthContext } from "@/lib/auth/types";
import { deriveLoginAlias } from "../aliases";
import {
  accountIdSchema,
  accountStatusUpdateSchema,
  adminPasswordSchema,
  adminUsernameSchema,
  assignPrimaryRoleSchema,
  changePasswordSchema,
  changePasswordWithCurrentSchema,
  loginSchema,
  provisionAccountSchema,
  provisionForStaffSchema,
  type AssignPrimaryRoleInput,
  type ChangeOwnPasswordInput,
  type LoginValues,
  type ProvisionAccountInput,
  type ProvisionForStaffInput,
} from "../schemas";
import { generateTemporaryPassword } from "./passwords";
import { canManageAccounts } from "../permissions";

type AuthActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; code: AppErrorCode; message: string };

type AdminClient = ReturnType<typeof createAdminClient>;

/** Loại thao tác tài khoản được ghi vào `account_audit_events` (D-65). */
type AccountAuditAction =
  | "provision"
  | "reset_password"
  | "set_password"
  | "update_username"
  | "set_status"
  | "assign_role"
  | "delete";

function internalDomain(): string {
  return process.env.INTERNAL_AUTH_DOMAIN || "choquan.internal";
}

function fail(error: unknown, fallback: string): AuthActionResult<never> {
  if (error instanceof AppError) return { ok: false, code: error.code, message: error.message };
  return { ok: false, code: "CONFLICT", message: fallback };
}

/**
 * 🔴 Guard của mọi action quản trị tài khoản — gọi NGOÀI `try` (nợ #14, D-96).
 * `requireRouteAccess` báo hiệu "hết phiên"/"không đủ quyền" bằng `redirect()`,
 * mà `redirect()` của Next hoạt động bằng cách NÉM lỗi; nằm trong `try` thì
 * `catch` nuốt mất tín hiệu chuyển hướng và người hết phiên nhận một câu lỗi vô
 * nghĩa thay vì được đưa về `/login`. `/admin` trong `ROUTE_RULES` chỉ dành cho
 * `super_admin` nên non-SA gọi thẳng action đi thẳng tới `/access-denied`; lớp
 * `canManageAccounts` giữ lại làm hàng rào thứ hai phòng khi luật route đổi.
 */
async function guardAccountAdmin(): Promise<AuthContext> {
  const context = await requireRouteAccess("/admin");
  if (!canManageAccounts(context.role)) redirect("/access-denied");
  return context;
}

/**
 * Kiểm tra NGHIỆP VỤ trên tài khoản đích — KHÔNG `redirect()`, nên gọi TRONG
 * `try`: mọi nhánh chặn ở đây trả kết quả lỗi cho người dùng, không phải chuyển
 * trang. Giả định caller đã `guardAccountAdmin()` xong ở ngoài `try`.
 */
async function loadManageableAccount(actor: AuthContext, profileIdInput: string) {
  const profileId = accountIdSchema.parse(profileIdInput);
  if (profileId === actor.profileId) {
    throw new AppError("CONFLICT", "Không thể sửa hoặc xóa tài khoản đang đăng nhập.");
  }
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id, username, role_assignments(role, is_active)")
    .eq("id", profileId)
    .maybeSingle();
  if (error || !data) throw new AppError("RESOURCE_NOT_FOUND");
  const assignments = data.role_assignments as Array<{ role: string; is_active: boolean }>;
  if (assignments.some((assignment) => assignment.is_active && assignment.role === "super_admin")) {
    throw new AppError("FORBIDDEN", "Không thể quản trị tài khoản Super Admin bằng thao tác này.");
  }
  return { admin, profileId, username: data.username as string };
}

/**
 * Nhật ký thao tác tài khoản (D-65, AGENTS §6). Ghi qua service role vì đây là
 * bảng append-only mà `authenticated` không có INSERT. KHÔNG ghi mật khẩu/token.
 * Trả `false` nếu ghi hỏng để caller tự quyết: với thao tác XÓA (không hoàn tác)
 * phải ghi được nhật ký TRƯỚC khi xóa; các thao tác đảo ngược được thì chỉ log.
 */
async function recordAccountAudit(
  admin: AdminClient,
  entry: {
    actorProfileId: string;
    actorUsername: string;
    targetProfileId: string | null;
    targetUsername: string;
    action: AccountAuditAction;
    detail?: string | null;
  },
): Promise<boolean> {
  const { error } = await admin.from("account_audit_events").insert({
    actor_profile_id: entry.actorProfileId,
    actor_username: entry.actorUsername,
    target_profile_id: entry.targetProfileId,
    target_username: entry.targetUsername,
    action: entry.action,
    detail: entry.detail ?? null,
  });
  if (error) {
    console.error("account_audit_insert_failed", { action: entry.action, code: error.code });
    return false;
  }
  return true;
}

export async function loginWithUsername(
  input: LoginValues,
  /** `?next=` của trang đăng nhập. Không tin được — luôn đi qua `resolveNextPath`. */
  nextPath?: string,
): Promise<AuthActionResult<{ redirectTo: string }>> {
  try {
    const parsed = loginSchema.parse(input);
    const alias = deriveLoginAlias(parsed.username, internalDomain());
    if (!alias) throw new AppError("VALIDATION_ERROR", "Tên đăng nhập hoặc mật khẩu không đúng.");

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email: alias.email, password: parsed.password });
    if (error || !data.user) throw new AppError("AUTH_REQUIRED", "Tên đăng nhập hoặc mật khẩu không đúng.");

    const { data: profile } = await supabase
      .from("profiles")
      .select("account_status, must_change_password")
      .eq("id", data.user.id)
      .maybeSingle();
    if (!profile || profile.account_status !== "active") {
      await supabase.auth.signOut();
      throw new AppError("FORBIDDEN", "Tài khoản đang bị khóa hoặc đã vô hiệu hóa.");
    }

    // Đổi mật khẩu bắt buộc là trạm dừng, không phải điểm đến: `next` phải đi
    // xuyên qua nó (F01 TO-BE §4).
    if (profile.must_change_password) {
      return { ok: true, data: { redirectTo: buildChangePasswordUrl(nextPath) } };
    }

    // Đọc vai trò tại chỗ thay vì gọi `getAuthContext()`: hàm đó được `cache()`
    // theo request và trong chính request này nó đã từng trả `null` (lúc đó
    // chưa đăng nhập), nên gọi lại sẽ nhận đúng cái `null` đã nhớ.
    const { data: assignment } = await supabase
      .from("role_assignments")
      .select("role")
      .eq("profile_id", data.user.id)
      .eq("is_active", true)
      .maybeSingle();
    const role = isAppRole(assignment?.role) ? assignment.role : null;

    return {
      ok: true,
      data: { redirectTo: resolveNextPath({ accountStatus: "active", role }, nextPath) },
    };
  } catch (error) {
    return fail(error, "Không thể đăng nhập. Vui lòng thử lại.");
  }
}

/**
 * Đăng xuất — M14 A-01, luồng F07 (`CRITICAL`, 16/75).
 *
 * Trước phiên này hệ thống **không có** chức năng đăng xuất: `grep signOut` trên
 * toàn `src/` chỉ ra đúng một dòng dùng nội bộ khi phát hiện tài khoản bị khoá
 * lúc đăng nhập. Máy trong phòng học là máy dùng chung — chính lý do `sw.js` từ
 * chối cache HTML — mà người dùng không có cách nào kết thúc phiên của mình.
 *
 * 🔴 `scope: "local"` — chỉ thiết bị này (chủ dự án duyệt 2026-07-23, D-86).
 * `global` đóng mọi phiên, nghe an toàn hơn nhưng một Giáo lý viên đăng xuất ở
 * máy phòng học sẽ bị văng khỏi điện thoại riêng của mình mà không hiểu vì sao.
 *
 * Là Server Action gọi qua `<form action={...}>`, tức **POST** chứ không phải
 * link GET (AC-F3): đăng xuất làm thay đổi trạng thái, và một link GET thì bị
 * trình duyệt/trình quét link kích hoạt sẵn.
 */
export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  // Xoá bản dựng đã nhớ của vỏ ứng dụng. Thiếu dòng này thì bấm nút Back sau khi
  // đăng xuất vẫn thấy lại trang cũ dựng sẵn trong bộ nhớ router (AC-F2) — trang
  // đó không còn dữ liệu mới nào, nhưng vẫn phơi tên và số liệu của người trước.
  revalidatePath("/", "layout");
  redirect(buildLoginUrl({ notice: "signed_out" }));
}

export async function changeOwnPassword(
  input: ChangeOwnPasswordInput,
  /** `?next=` mà `buildChangePasswordUrl` mang qua trạm đổi mật khẩu. */
  nextPath?: string,
): Promise<AuthActionResult<{ redirectTo: string }>> {
  // Guard NGOÀI try (nợ #14): nếu phiên hết hạn giữa chừng, `requireAuthContext`
  // phải `redirect()` được về `/login`, không bị `catch` nuốt thành câu lỗi.
  const context = await requireAuthContext("/change-password");
  try {
    const supabase = await createClient();
    if (context.mustChangePassword) {
      // Lần đăng nhập đầu: vừa nhận mật khẩu tạm, không hỏi lại mật khẩu cũ.
      const parsed = changePasswordSchema.parse({
        password: input.password,
        confirmPassword: input.confirmPassword,
      });
      const { error: passwordError } = await supabase.auth.updateUser({ password: parsed.password });
      if (passwordError) throw new AppError("VALIDATION_ERROR", "Mật khẩu mới chưa được chấp nhận.");
    } else {
      // TB-04 đổi tự nguyện: bắt buộc xác thực lại mật khẩu hiện tại (AC-03.2).
      const parsed = changePasswordWithCurrentSchema.parse(input);
      const alias = deriveLoginAlias(context.username, internalDomain());
      if (!alias) throw new AppError("CONFLICT");
      // Xác thực trên MỘT client dùng-một-lần, `persistSession: false`: không đụng
      // vào cookie phiên đang đăng nhập, nên mật khẩu sai không làm rớt phiên.
      const verifier = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } },
      );
      const { error: verifyError } = await verifier.auth.signInWithPassword({
        email: alias.email,
        password: parsed.currentPassword,
      });
      if (verifyError) throw new AppError("VALIDATION_ERROR", "Mật khẩu hiện tại không đúng.");
      const { error: passwordError } = await supabase.auth.updateUser({ password: parsed.password });
      if (passwordError) throw new AppError("VALIDATION_ERROR", "Mật khẩu mới chưa được chấp nhận.");
    }
    const { error: profileError } = await supabase.rpc("complete_password_change");
    if (profileError) throw new AppError("CONFLICT", "Mật khẩu đã đổi nhưng chưa thể hoàn tất tài khoản. Vui lòng thử lại.");
    return { ok: true, data: { redirectTo: resolveNextPath(context, nextPath) } };
  } catch (error) {
    return fail(error, "Không thể đổi mật khẩu. Vui lòng thử lại.");
  }
}

/**
 * Cấp tài khoản tại `/admin` — sau M04-C là đường **ngoại lệ**: chỉ cho người
 * không có hồ sơ Giáo lý viên (Cha sở · Cha phó · Phụ huynh · Thiếu nhi). Vai trò
 * gắn hồ sơ nhân sự đã bị `provisionAccountSchema` từ chối (D-111), nên nhánh
 * liên kết `staff_profiles` được gỡ hẳn khỏi hàm này thay vì để nằm lại làm bẫy
 * cho phiên sau: đường cấp tài khoản GLV duy nhất là `provisionAccountForStaff`.
 */
export async function adminProvisionAccount(input: ProvisionAccountInput): Promise<AuthActionResult<{ profileId: string; username: string; temporaryPassword: string }>> {
  const actor = await guardAccountAdmin();
  try {
    const parsed = provisionAccountSchema.parse(input);
    // Trần vai trò (D-102) áp cho MỌI màn hình cấp tài khoản, kể cả `/admin`:
    // không tạo Super Admin thứ hai, không cấp vai trò ngang/cao hơn người thao tác.
    if (!canActorAssignRole(actor.role, parsed.role)) {
      throw new AppError("FORBIDDEN", "Không thể cấp vai trò này (trần vai trò).");
    }
    const admin = createAdminClient();
    let username = parsed.username;
    let displayName = parsed.displayName;
    let saintName = parsed.saintName || null;
    let phone = parsed.phone || null;
    const contactEmail = parsed.email || null;

    if (parsed.role === "guardian" && parsed.guardianId) {
      const { data: guardian, error } = await admin
        .from("guardians")
        .select("id, full_name, phone, profile_id")
        .eq("id", parsed.guardianId)
        .maybeSingle();
      if (error || !guardian || guardian.profile_id) {
        throw new AppError("CONFLICT", "Hồ sơ phụ huynh đã có tài khoản hoặc không tồn tại.");
      }
      username = guardian.phone;
      displayName = guardian.full_name;
      saintName = null;
      phone = guardian.phone;
    }

    if (parsed.role === "student" && parsed.studentId) {
      const { data: student, error } = await admin
        .from("students")
        .select("id, student_code, full_name, saint_name, phone, profile_id")
        .eq("id", parsed.studentId)
        .maybeSingle();
      if (error || !student || student.profile_id) {
        throw new AppError("CONFLICT", "Hồ sơ thiếu nhi đã có tài khoản hoặc không tồn tại.");
      }
      username = student.student_code;
      displayName = student.full_name;
      saintName = student.saint_name;
      phone = student.phone;
    }

    const alias = deriveLoginAlias(username, internalDomain());
    if (!alias) throw new AppError("VALIDATION_ERROR", "Tên đăng nhập không đúng định dạng.");
    const temporaryPassword = generateTemporaryPassword();
    const { data: created, error: authError } = await admin.auth.admin.createUser({
      email: alias.email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: { display_name: displayName },
    });
    if (authError || !created.user) throw new AppError(authError?.status === 422 ? "CONFLICT" : "VALIDATION_ERROR");

    const profileId = created.user.id;
    const { error: profileError } = await admin.from("profiles").insert({
      id: profileId,
      username: alias.normalizedUsername,
      display_name: displayName,
      saint_name: saintName,
      phone,
      email: contactEmail,
      must_change_password: true,
      account_status: "active",
    });
    if (profileError) {
      await admin.auth.admin.deleteUser(profileId);
      throw new AppError(profileError.code === "23505" ? "CONFLICT" : "VALIDATION_ERROR");
    }

    let linkedGuardian = false;
    let linkedStudent = false;
    if (parsed.guardianId) {
      const { data: guardian, error } = await admin
        .from("guardians")
        .update({ profile_id: profileId })
        .eq("id", parsed.guardianId)
        .is("profile_id", null)
        .select("id")
        .single();
      if (error || !guardian) {
        await admin.from("profiles").delete().eq("id", profileId);
        await admin.auth.admin.deleteUser(profileId);
        throw new AppError("CONFLICT", "Hồ sơ phụ huynh đã có tài khoản hoặc không tồn tại.");
      }
      linkedGuardian = true;
    }

    if (parsed.studentId) {
      const { data: student, error } = await admin
        .from("students")
        .update({ profile_id: profileId })
        .eq("id", parsed.studentId)
        .is("profile_id", null)
        .select("id")
        .single();
      if (error || !student) {
        if (linkedGuardian && parsed.guardianId) {
          await admin.from("guardians").update({ profile_id: null }).eq("id", parsed.guardianId).eq("profile_id", profileId);
        }
        await admin.from("profiles").delete().eq("id", profileId);
        await admin.auth.admin.deleteUser(profileId);
        throw new AppError("CONFLICT", "Hồ sơ thiếu nhi đã có tài khoản hoặc không tồn tại.");
      }
      linkedStudent = true;
    }

    const { error: roleError } = await admin.from("role_assignments").insert({
      profile_id: profileId,
      role: parsed.role,
      academic_year_id: parsed.academicYearId || null,
      sector_id: parsed.sectorId || null,
      class_id: parsed.classId || null,
      starts_on: parsed.startsOn,
      is_active: true,
    });
    if (roleError) {
      if (linkedGuardian && parsed.guardianId) {
        await admin.from("guardians").update({ profile_id: null }).eq("id", parsed.guardianId).eq("profile_id", profileId);
      }
      if (linkedStudent && parsed.studentId) {
        await admin.from("students").update({ profile_id: null }).eq("id", parsed.studentId).eq("profile_id", profileId);
      }
      await admin.from("profiles").delete().eq("id", profileId);
      await admin.auth.admin.deleteUser(profileId);
      throw new AppError("VALIDATION_ERROR", "Role hoặc phạm vi tài khoản không hợp lệ.");
    }

    // Best-effort: tài khoản đã tạo xong, không hủy vì lỗi nhật ký. Vẫn log để
    // Super Admin đối chiếu (D-65). Thao tác này đảo ngược được bằng cách xóa.
    await recordAccountAudit(admin, {
      actorProfileId: actor.profileId,
      actorUsername: actor.username,
      targetProfileId: profileId,
      targetUsername: alias.normalizedUsername,
      action: "provision",
      detail: `Vai trò: ${parsed.role}`,
    });

    revalidatePath("/admin");
    return { ok: true, data: { profileId, username: alias.normalizedUsername, temporaryPassword } };
  } catch (error) {
    return fail(error, "Không thể tạo tài khoản. Vui lòng thử lại.");
  }
}

/**
 * TB-01 (M01-B) — cấp tài khoản NGAY TẠI hồ sơ GLV. Khác `adminProvisionAccount`
 * (dùng cho `/admin`, nhận username/tên hiển thị từ client): action này chỉ nhận
 * `staffProfileId` + vai trò + phạm vi, tự suy mọi thông tin từ `staff_profiles`.
 * Guard `super_admin` (S3) + trần vai trò (D-102) + pre-check phân công lớp
 * (AC-01.3: báo lỗi cụ thể TRƯỚC khi tạo Auth user, không để rác).
 */
export async function provisionAccountForStaff(
  input: ProvisionForStaffInput,
): Promise<AuthActionResult<{ profileId: string; username: string; temporaryPassword: string }>> {
  const actor = await guardAccountAdmin();
  try {
    const parsed = provisionForStaffSchema.parse(input);
    // Trần vai trò (D-102). Ở v1 actor luôn là Super Admin nên chỉ chặn super_admin
    // (schema cũng đã loại) — giữ lại làm hàng rào nếu sau này nới quyền.
    if (!canActorAssignRole(actor.role, parsed.role)) {
      throw new AppError("FORBIDDEN", "Bạn không được cấp vai trò này.");
    }
    const admin = createAdminClient();

    const { data: staff, error: staffError } = await admin
      .from("staff_profiles")
      .select("id, staff_code, full_name, saint_name, phone, email, profile_id")
      .eq("id", parsed.staffProfileId)
      .maybeSingle();
    if (staffError || !staff) throw new AppError("RESOURCE_NOT_FOUND", "Không tìm thấy hồ sơ nhân sự.");
    if (staff.profile_id) throw new AppError("CONFLICT", "Hồ sơ này đã có tài khoản.");

    // AC-01.3 — role lớp cần phân công đúng capacity; báo lỗi CỤ THỂ trước khi tạo
    // Auth user. BR-A17 ở DB là chốt cuối; đây chỉ để không tạo rác + câu chữ rõ.
    if (CLASS_ROLES.includes(parsed.role)) {
      const expectedCapacity =
        parsed.role === "class_representative" ? "representative" : parsed.role === "class_teacher" ? "member" : "trainee";
      const { data: assignment } = await admin
        .from("class_staff_assignments")
        .select("id")
        .eq("staff_profile_id", parsed.staffProfileId)
        .eq("class_id", parsed.classId ?? "")
        .eq("capacity", expectedCapacity)
        .eq("is_active", true)
        .maybeSingle();
      if (!assignment) {
        throw new AppError(
          "VALIDATION_ERROR",
          `Hồ sơ chưa được phân công vào lớp với vai trò ${ROLE_LABELS[parsed.role]}. Hãy phân công trước.`,
        );
      }
    }

    const alias = deriveLoginAlias(staff.staff_code, internalDomain());
    if (!alias) throw new AppError("VALIDATION_ERROR", "Mã nhân sự không đúng định dạng.");
    const temporaryPassword = generateTemporaryPassword();
    const { data: created, error: authError } = await admin.auth.admin.createUser({
      email: alias.email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: { display_name: staff.full_name },
    });
    if (authError || !created.user) throw new AppError(authError?.status === 422 ? "CONFLICT" : "VALIDATION_ERROR");
    const profileId = created.user.id;

    const { error: profileError } = await admin.from("profiles").insert({
      id: profileId,
      username: alias.normalizedUsername,
      display_name: staff.full_name,
      saint_name: staff.saint_name,
      phone: staff.phone,
      email: staff.email,
      must_change_password: true,
      account_status: "active",
    });
    if (profileError) {
      await admin.auth.admin.deleteUser(profileId);
      throw new AppError(profileError.code === "23505" ? "CONFLICT" : "VALIDATION_ERROR");
    }

    // Liên kết hồ sơ với điều kiện `.is null` — chống race hai request cùng cấp
    // cho một hồ sơ (AC-01.4): chỉ một thắng, request kia thấy 0 dòng.
    const { data: linked, error: linkError } = await admin
      .from("staff_profiles")
      .update({ profile_id: profileId })
      .eq("id", parsed.staffProfileId)
      .is("profile_id", null)
      .select("id")
      .single();
    if (linkError || !linked) {
      await admin.from("profiles").delete().eq("id", profileId);
      await admin.auth.admin.deleteUser(profileId);
      throw new AppError("CONFLICT", `Hồ sơ này đã có tài khoản ${alias.normalizedUsername}.`);
    }

    const { error: roleError } = await admin.from("role_assignments").insert({
      profile_id: profileId,
      role: parsed.role,
      academic_year_id: parsed.academicYearId || null,
      sector_id: parsed.sectorId || null,
      class_id: parsed.classId || null,
      starts_on: parsed.startsOn,
      is_active: true,
    });
    if (roleError) {
      await admin.from("staff_profiles").update({ profile_id: null }).eq("id", parsed.staffProfileId).eq("profile_id", profileId);
      await admin.from("profiles").delete().eq("id", profileId);
      await admin.auth.admin.deleteUser(profileId);
      throw new AppError("VALIDATION_ERROR", "Vai trò hoặc phạm vi không hợp lệ.");
    }

    await recordAccountAudit(admin, {
      actorProfileId: actor.profileId,
      actorUsername: actor.username,
      targetProfileId: profileId,
      targetUsername: alias.normalizedUsername,
      action: "provision",
      detail: `Vai trò: ${parsed.role} (tại hồ sơ)`,
    });

    revalidatePath("/staff");
    revalidatePath(`/staff/${parsed.staffProfileId}`);
    revalidatePath("/admin");
    return { ok: true, data: { profileId, username: alias.normalizedUsername, temporaryPassword } };
  } catch (error) {
    return fail(error, "Không thể cấp tài khoản. Vui lòng thử lại.");
  }
}

/**
 * TB-05 (M01-B) — đổi vai trò chính của một tài khoản đã có, GIỮ đăng nhập. Gọi
 * RPC `assign_primary_role` (đổi nguyên tử) qua CLIENT NGƯỜI DÙNG chứ không service
 * role: RPC tự kiểm `app.is_super_admin()` theo JWT, gọi bằng service role thì
 * `auth.uid()` null ⇒ bị từ chối. `loadManageableAccount` chặn tự sửa mình / sửa
 * Super Admin khác trước khi chạm RPC.
 */
export async function assignPrimaryRole(input: AssignPrimaryRoleInput): Promise<AuthActionResult> {
  const actor = await guardAccountAdmin();
  try {
    const parsed = assignPrimaryRoleSchema.parse(input);
    if (!canActorAssignRole(actor.role, parsed.role)) {
      throw new AppError("FORBIDDEN", "Bạn không được cấp vai trò này.");
    }
    const { admin, profileId, username } = await loadManageableAccount(actor, parsed.profileId);

    const supabase = await createClient();
    const { error } = await supabase.rpc("assign_primary_role", {
      p_profile_id: profileId,
      p_role: parsed.role,
      p_starts_on: parsed.startsOn,
      p_academic_year_id: parsed.academicYearId || undefined,
      p_sector_id: parsed.sectorId || undefined,
      p_class_id: parsed.classId || undefined,
    });
    if (error) {
      const message =
        error.code === "23514" && /ACTIVE_CLASS_ASSIGNMENT_REQUIRED/.test(error.message)
          ? `Hồ sơ chưa được phân công vào lớp với vai trò ${ROLE_LABELS[parsed.role]}. Hãy phân công trước.`
          : error.code === "42501"
            ? "Bạn không đủ quyền đổi vai trò tài khoản này."
            : "Vai trò hoặc phạm vi không hợp lệ.";
      throw new AppError(error.code === "42501" ? "FORBIDDEN" : "VALIDATION_ERROR", message);
    }

    await recordAccountAudit(admin, {
      actorProfileId: actor.profileId,
      actorUsername: actor.username,
      targetProfileId: profileId,
      targetUsername: username,
      action: "assign_role",
      detail: `Vai trò mới: ${parsed.role}`,
    });

    revalidatePath("/staff", "layout");
    revalidatePath("/admin");
    return { ok: true, data: undefined };
  } catch (error) {
    return fail(error, "Không thể đổi vai trò. Vui lòng thử lại.");
  }
}

export async function adminResetPassword(profileIdInput: string): Promise<AuthActionResult<{ temporaryPassword: string }>> {
  const actor = await guardAccountAdmin();
  try {
    const { admin, profileId, username } = await loadManageableAccount(actor, profileIdInput);
    const temporaryPassword = generateTemporaryPassword();
    const { error: authError } = await admin.auth.admin.updateUserById(profileId, { password: temporaryPassword });
    if (authError) throw new AppError(authError.status === 404 ? "RESOURCE_NOT_FOUND" : "CONFLICT");
    const { error: profileError } = await admin.from("profiles").update({ must_change_password: true }).eq("id", profileId);
    if (profileError) throw new AppError("CONFLICT");
    await recordAccountAudit(admin, {
      actorProfileId: actor.profileId,
      actorUsername: actor.username,
      targetProfileId: profileId,
      targetUsername: username,
      action: "reset_password",
    });
    revalidatePath("/admin");
    return { ok: true, data: { temporaryPassword } };
  } catch (error) {
    return fail(error, "Không thể đặt lại mật khẩu. Vui lòng thử lại.");
  }
}

export async function adminSetPassword(profileIdInput: string, passwordInput: string): Promise<AuthActionResult> {
  const actor = await guardAccountAdmin();
  try {
    const { admin, profileId, username } = await loadManageableAccount(actor, profileIdInput);
    const password = adminPasswordSchema.parse(passwordInput);
    const { error: authError } = await admin.auth.admin.updateUserById(profileId, { password });
    if (authError) throw new AppError(authError.status === 404 ? "RESOURCE_NOT_FOUND" : "VALIDATION_ERROR", "Mật khẩu mới chưa được chấp nhận.");
    const { error: profileError } = await admin
      .from("profiles")
      .update({ must_change_password: true })
      .eq("id", profileId);
    if (profileError) throw new AppError("CONFLICT");
    await recordAccountAudit(admin, {
      actorProfileId: actor.profileId,
      actorUsername: actor.username,
      targetProfileId: profileId,
      targetUsername: username,
      action: "set_password",
    });
    revalidatePath("/admin");
    return { ok: true, data: undefined };
  } catch (error) {
    return fail(error, "Không thể đặt mật khẩu mới. Vui lòng thử lại.");
  }
}

export async function adminUpdateUsername(profileIdInput: string, usernameInput: string): Promise<AuthActionResult<{ username: string }>> {
  const actor = await guardAccountAdmin();
  try {
    const { admin, profileId, username: previousUsername } = await loadManageableAccount(actor, profileIdInput);
    const username = adminUsernameSchema.parse(usernameInput);
    const alias = deriveLoginAlias(username, internalDomain());
    if (!alias) throw new AppError("VALIDATION_ERROR", "Tên đăng nhập không đúng định dạng.");

    const { data: duplicate } = await admin
      .from("profiles")
      .select("id")
      .eq("username", alias.normalizedUsername)
      .neq("id", profileId)
      .maybeSingle();
    if (duplicate) throw new AppError("CONFLICT", "Tên đăng nhập đã được sử dụng.");

    const { data: authUserResult, error: authUserError } = await admin.auth.admin.getUserById(profileId);
    if (authUserError || !authUserResult.user) throw new AppError("RESOURCE_NOT_FOUND");
    const previousEmail = authUserResult.user.email;
    const { error: authError } = await admin.auth.admin.updateUserById(profileId, {
      email: alias.email,
      email_confirm: true,
    });
    if (authError) throw new AppError(authError.status === 422 ? "CONFLICT" : "VALIDATION_ERROR", "Tên đăng nhập đã được sử dụng hoặc không hợp lệ.");

    const { error: profileError } = await admin
      .from("profiles")
      .update({ username: alias.normalizedUsername, updated_by: actor.profileId })
      .eq("id", profileId);
    if (profileError) {
      if (previousEmail) {
        await admin.auth.admin.updateUserById(profileId, { email: previousEmail, email_confirm: true });
      }
      throw new AppError("CONFLICT", "Không thể đồng bộ tên đăng nhập. Tài khoản vẫn giữ tên cũ.");
    }

    await recordAccountAudit(admin, {
      actorProfileId: actor.profileId,
      actorUsername: actor.username,
      targetProfileId: profileId,
      targetUsername: alias.normalizedUsername,
      action: "update_username",
      detail: `${previousUsername} → ${alias.normalizedUsername}`,
    });
    revalidatePath("/admin");
    return { ok: true, data: { username: alias.normalizedUsername } };
  } catch (error) {
    return fail(error, "Không thể đổi tên đăng nhập. Vui lòng thử lại.");
  }
}

export async function adminDeleteAccount(profileIdInput: string): Promise<AuthActionResult> {
  const actor = await guardAccountAdmin();
  try {
    const { admin, profileId, username } = await loadManageableAccount(actor, profileIdInput);
    // Nhật ký TRƯỚC khi xóa (xóa không hoàn tác được): nếu chưa ghi được nhật ký
    // thì KHÔNG xóa — D-65 không cho phép một thao tác phá huỷ mà không để lại vết.
    // Bảng nhật ký không có FK sang `profiles` nên bản ghi sống sót sau khi hồ sơ
    // đăng nhập bị xóa (AC-05.3: "một bản ghi audit với actor là Super Admin").
    const audited = await recordAccountAudit(admin, {
      actorProfileId: actor.profileId,
      actorUsername: actor.username,
      targetProfileId: profileId,
      targetUsername: username,
      action: "delete",
    });
    if (!audited) {
      throw new AppError("CONFLICT", "Chưa ghi được nhật ký nên chưa xóa tài khoản. Vui lòng thử lại.");
    }
    const { error } = await admin.auth.admin.deleteUser(profileId);
    if (error) throw new AppError(error.status === 404 ? "RESOURCE_NOT_FOUND" : "CONFLICT");
    revalidatePath("/admin");
    return { ok: true, data: undefined };
  } catch (error) {
    return fail(error, "Không thể xóa tài khoản. Vui lòng thử lại.");
  }
}

export async function adminSetAccountStatus(profileIdInput: string, statusInput: string): Promise<AuthActionResult> {
  const actor = await guardAccountAdmin();
  try {
    const { admin, profileId, username } = await loadManageableAccount(actor, profileIdInput);
    // Q4 (D-103): chỉ nhận active/disabled — không đẩy tài khoản vào 'locked'.
    const status = accountStatusUpdateSchema.parse(statusInput);
    const { error: authError } = await admin.auth.admin.updateUserById(profileId, {
      ban_duration: status === "active" ? "none" : "876000h",
    });
    if (authError) throw new AppError(authError.status === 404 ? "RESOURCE_NOT_FOUND" : "CONFLICT");
    const { error: profileError } = await admin.from("profiles").update({ account_status: status, updated_by: actor.profileId }).eq("id", profileId);
    if (profileError) {
      // AC-05.1: khóa ở Auth đã đổi nhưng `profiles` chưa — hoàn nguyên khóa Auth
      // để hai nơi không lệch nhau (một tài khoản bị ban ở Auth mà app tưởng còn
      // active). Bộ chuyển active↔disabled nên trạng thái đối nghịch chính là cũ.
      await admin.auth.admin.updateUserById(profileId, {
        ban_duration: status === "active" ? "876000h" : "none",
      });
      throw new AppError("CONFLICT");
    }
    await recordAccountAudit(admin, {
      actorProfileId: actor.profileId,
      actorUsername: actor.username,
      targetProfileId: profileId,
      targetUsername: username,
      action: "set_status",
      detail: status === "active" ? "Kích hoạt" : "Vô hiệu hóa",
    });
    revalidatePath("/admin");
    return { ok: true, data: undefined };
  } catch (error) {
    return fail(error, "Không thể đổi trạng thái tài khoản. Vui lòng thử lại.");
  }
}
