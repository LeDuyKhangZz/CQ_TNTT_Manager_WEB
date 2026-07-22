"use server";

import { revalidatePath } from "next/cache";
import { AppError, type AppErrorCode } from "@/lib/errors";
import { requireAuthContext } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { deriveLoginAlias } from "../aliases";
import {
  accountIdSchema,
  accountStatusSchema,
  adminPasswordSchema,
  adminUsernameSchema,
  changePasswordSchema,
  loginSchema,
  provisionAccountSchema,
  type ChangePasswordValues,
  type LoginValues,
  type ProvisionAccountInput,
} from "../schemas";
import { generateTemporaryPassword } from "./passwords";
import { canManageAccounts } from "../permissions";

type AuthActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; code: AppErrorCode; message: string };

function internalDomain(): string {
  return process.env.INTERNAL_AUTH_DOMAIN || "choquan.internal";
}

function fail(error: unknown, fallback: string): AuthActionResult<never> {
  if (error instanceof AppError) return { ok: false, code: error.code, message: error.message };
  return { ok: false, code: "CONFLICT", message: fallback };
}

async function requireSuperAdmin() {
  const context = await requireAuthContext("/admin");
  if (!canManageAccounts(context.role)) throw new AppError("FORBIDDEN");
  return context;
}

async function requireManageableAccount(profileIdInput: string) {
  const actor = await requireSuperAdmin();
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
  return { actor, admin, profileId };
}

export async function loginWithUsername(input: LoginValues): Promise<AuthActionResult<{ redirectTo: string }>> {
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
    return { ok: true, data: { redirectTo: profile.must_change_password ? "/change-password" : "/dashboard" } };
  } catch (error) {
    return fail(error, "Không thể đăng nhập. Vui lòng thử lại.");
  }
}

export async function changeOwnPassword(input: ChangePasswordValues): Promise<AuthActionResult<{ redirectTo: string }>> {
  try {
    await requireAuthContext("/change-password");
    const parsed = changePasswordSchema.parse(input);
    const supabase = await createClient();
    const { error: passwordError } = await supabase.auth.updateUser({ password: parsed.password });
    if (passwordError) throw new AppError("VALIDATION_ERROR", "Mật khẩu mới chưa được chấp nhận.");
    const { error: profileError } = await supabase.rpc("complete_password_change");
    if (profileError) throw new AppError("CONFLICT", "Mật khẩu đã đổi nhưng chưa thể hoàn tất tài khoản. Vui lòng thử lại.");
    return { ok: true, data: { redirectTo: "/dashboard" } };
  } catch (error) {
    return fail(error, "Không thể đổi mật khẩu. Vui lòng thử lại.");
  }
}

export async function adminProvisionAccount(input: ProvisionAccountInput): Promise<AuthActionResult<{ profileId: string; username: string; temporaryPassword: string }>> {
  try {
    await requireSuperAdmin();
    const parsed = provisionAccountSchema.parse(input);
    const admin = createAdminClient();
    let username = parsed.username;
    let displayName = parsed.displayName;
    let saintName = parsed.saintName || null;
    let phone = parsed.phone || null;
    let contactEmail = parsed.email || null;

    if (parsed.staffProfileId) {
      const { data: staff, error } = await admin
        .from("staff_profiles")
        .select("id, staff_code, full_name, saint_name, phone, email, profile_id")
        .eq("id", parsed.staffProfileId)
        .maybeSingle();
      if (error || !staff || staff.profile_id) {
        throw new AppError("CONFLICT", "Hồ sơ Giáo lý viên đã có tài khoản hoặc không tồn tại.");
      }
      username = staff.staff_code;
      displayName = staff.full_name;
      saintName = staff.saint_name;
      phone = staff.phone;
      contactEmail = staff.email;
    }

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

    let linkedStaff = false;
    let linkedGuardian = false;
    let linkedStudent = false;
    if (parsed.staffProfileId) {
      const { data: staff, error: staffError } = await admin
        .from("staff_profiles")
        .update({ profile_id: profileId })
        .eq("id", parsed.staffProfileId)
        .is("profile_id", null)
        .select("id")
        .single();
      if (staffError || !staff) {
        await admin.from("profiles").delete().eq("id", profileId);
        await admin.auth.admin.deleteUser(profileId);
        throw new AppError("CONFLICT", "Hồ sơ nhân sự đã có tài khoản hoặc không tồn tại.");
      }
      linkedStaff = true;
    }

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
      if (linkedStaff && parsed.staffProfileId) {
        await admin.from("staff_profiles").update({ profile_id: null }).eq("id", parsed.staffProfileId).eq("profile_id", profileId);
      }
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

    revalidatePath("/admin");
    return { ok: true, data: { profileId, username: alias.normalizedUsername, temporaryPassword } };
  } catch (error) {
    return fail(error, "Không thể tạo tài khoản. Vui lòng thử lại.");
  }
}

export async function adminResetPassword(profileIdInput: string): Promise<AuthActionResult<{ temporaryPassword: string }>> {
  try {
    const { admin, profileId } = await requireManageableAccount(profileIdInput);
    const temporaryPassword = generateTemporaryPassword();
    const { error: authError } = await admin.auth.admin.updateUserById(profileId, { password: temporaryPassword });
    if (authError) throw new AppError(authError.status === 404 ? "RESOURCE_NOT_FOUND" : "CONFLICT");
    const { error: profileError } = await admin.from("profiles").update({ must_change_password: true }).eq("id", profileId);
    if (profileError) throw new AppError("CONFLICT");
    revalidatePath("/admin");
    return { ok: true, data: { temporaryPassword } };
  } catch (error) {
    return fail(error, "Không thể đặt lại mật khẩu. Vui lòng thử lại.");
  }
}

export async function adminSetPassword(profileIdInput: string, passwordInput: string): Promise<AuthActionResult> {
  try {
    const { admin, profileId } = await requireManageableAccount(profileIdInput);
    const password = adminPasswordSchema.parse(passwordInput);
    const { error: authError } = await admin.auth.admin.updateUserById(profileId, { password });
    if (authError) throw new AppError(authError.status === 404 ? "RESOURCE_NOT_FOUND" : "VALIDATION_ERROR", "Mật khẩu mới chưa được chấp nhận.");
    const { error: profileError } = await admin
      .from("profiles")
      .update({ must_change_password: true })
      .eq("id", profileId);
    if (profileError) throw new AppError("CONFLICT");
    revalidatePath("/admin");
    return { ok: true, data: undefined };
  } catch (error) {
    return fail(error, "Không thể đặt mật khẩu mới. Vui lòng thử lại.");
  }
}

export async function adminUpdateUsername(profileIdInput: string, usernameInput: string): Promise<AuthActionResult<{ username: string }>> {
  try {
    const { actor, admin, profileId } = await requireManageableAccount(profileIdInput);
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

    revalidatePath("/admin");
    return { ok: true, data: { username: alias.normalizedUsername } };
  } catch (error) {
    return fail(error, "Không thể đổi tên đăng nhập. Vui lòng thử lại.");
  }
}

export async function adminDeleteAccount(profileIdInput: string): Promise<AuthActionResult> {
  try {
    const { admin, profileId } = await requireManageableAccount(profileIdInput);
    const { error } = await admin.auth.admin.deleteUser(profileId);
    if (error) throw new AppError(error.status === 404 ? "RESOURCE_NOT_FOUND" : "CONFLICT");
    revalidatePath("/admin");
    return { ok: true, data: undefined };
  } catch (error) {
    return fail(error, "Không thể xóa tài khoản. Vui lòng thử lại.");
  }
}

export async function adminSetAccountStatus(profileIdInput: string, statusInput: string): Promise<AuthActionResult> {
  try {
    const { actor, admin, profileId } = await requireManageableAccount(profileIdInput);
    const status = accountStatusSchema.parse(statusInput);
    const { error: authError } = await admin.auth.admin.updateUserById(profileId, {
      ban_duration: status === "active" ? "none" : "876000h",
    });
    if (authError) throw new AppError(authError.status === 404 ? "RESOURCE_NOT_FOUND" : "CONFLICT");
    const { error: profileError } = await admin.from("profiles").update({ account_status: status, updated_by: actor.profileId }).eq("id", profileId);
    if (profileError) throw new AppError("CONFLICT");
    revalidatePath("/admin");
    return { ok: true, data: undefined };
  } catch (error) {
    return fail(error, "Không thể đổi trạng thái tài khoản. Vui lòng thử lại.");
  }
}
