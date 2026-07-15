"use server";

import { AppError, type AppErrorCode } from "@/lib/errors";
import { requireAuthContext } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { deriveLoginAlias } from "../aliases";
import {
  accountIdSchema,
  accountStatusSchema,
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
    const alias = deriveLoginAlias(parsed.username, internalDomain());
    if (!alias) throw new AppError("VALIDATION_ERROR", "Tên đăng nhập không đúng định dạng.");
    const temporaryPassword = generateTemporaryPassword();
    const admin = createAdminClient();
    const { data: created, error: authError } = await admin.auth.admin.createUser({
      email: alias.email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: { display_name: parsed.displayName },
    });
    if (authError || !created.user) throw new AppError(authError?.status === 422 ? "CONFLICT" : "VALIDATION_ERROR");

    const profileId = created.user.id;
    const { error: profileError } = await admin.from("profiles").insert({
      id: profileId,
      username: alias.normalizedUsername,
      display_name: parsed.displayName,
      saint_name: parsed.saintName || null,
      phone: parsed.phone || null,
      email: parsed.email || null,
      must_change_password: true,
      account_status: "active",
    });
    if (profileError) {
      await admin.auth.admin.deleteUser(profileId);
      throw new AppError(profileError.code === "23505" ? "CONFLICT" : "VALIDATION_ERROR");
    }

    let linkedStaff = false;
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
      await admin.from("profiles").delete().eq("id", profileId);
      await admin.auth.admin.deleteUser(profileId);
      throw new AppError("VALIDATION_ERROR", "Role hoặc phạm vi tài khoản không hợp lệ.");
    }

    return { ok: true, data: { profileId, username: alias.normalizedUsername, temporaryPassword } };
  } catch (error) {
    return fail(error, "Không thể tạo tài khoản. Vui lòng thử lại.");
  }
}

export async function adminResetPassword(profileIdInput: string): Promise<AuthActionResult<{ temporaryPassword: string }>> {
  try {
    await requireSuperAdmin();
    const profileId = accountIdSchema.parse(profileIdInput);
    const temporaryPassword = generateTemporaryPassword();
    const admin = createAdminClient();
    const { error: authError } = await admin.auth.admin.updateUserById(profileId, { password: temporaryPassword });
    if (authError) throw new AppError(authError.status === 404 ? "RESOURCE_NOT_FOUND" : "CONFLICT");
    const { error: profileError } = await admin.from("profiles").update({ must_change_password: true }).eq("id", profileId);
    if (profileError) throw new AppError("CONFLICT");
    return { ok: true, data: { temporaryPassword } };
  } catch (error) {
    return fail(error, "Không thể đặt lại mật khẩu. Vui lòng thử lại.");
  }
}

export async function adminSetAccountStatus(profileIdInput: string, statusInput: string): Promise<AuthActionResult> {
  try {
    const actor = await requireSuperAdmin();
    const profileId = accountIdSchema.parse(profileIdInput);
    const status = accountStatusSchema.parse(statusInput);
    if (profileId === actor.profileId && status !== "active") {
      throw new AppError("CONFLICT", "Không thể tự khóa tài khoản đang đăng nhập.");
    }
    const admin = createAdminClient();
    const { error: authError } = await admin.auth.admin.updateUserById(profileId, {
      ban_duration: status === "active" ? "none" : "876000h",
    });
    if (authError) throw new AppError(authError.status === 404 ? "RESOURCE_NOT_FOUND" : "CONFLICT");
    const { error: profileError } = await admin.from("profiles").update({ account_status: status, updated_by: actor.profileId }).eq("id", profileId);
    if (profileError) throw new AppError("CONFLICT");
    return { ok: true, data: undefined };
  } catch (error) {
    return fail(error, "Không thể đổi trạng thái tài khoản. Vui lòng thử lại.");
  }
}
