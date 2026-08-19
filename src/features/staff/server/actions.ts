"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AppError, type AppErrorCode } from "@/lib/errors";
import { requireAuthContext, requireRouteAccess } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import type { AuthContext } from "@/lib/auth/types";
import type { AppRole } from "@/lib/permissions/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { assignmentErrorMessage } from "../assignment-messages";
import {
  missingStaffContactFields,
  type StaffContactField,
} from "../profile-completeness";
import type { CreateStaffFormState, CreateStaffFormValues } from "../create-form-state";
import {
  findDuplicateSuspects,
  type DuplicateCandidate,
  type DuplicateSuspect,
} from "../staff-duplicates";
import {
  assignStaffSchema,
  createStaffSchema,
  deleteStaffSchema,
  endStaffAssignmentSchema,
  ownStaffContactSchema,
  transferClassStaffSchema,
  updateStaffSchema,
  type AssignStaffInput,
  type CreateStaffInput,
  type DeleteStaffInput,
  type OwnStaffContactInput,
  type TransferClassStaffInput,
  type UpdateStaffInput,
} from "../schemas";

type StaffActionResult<T = undefined> =
  | { ok: true; data: T }
  | {
      ok: false;
      code: AppErrorCode;
      message: string;
      /** TB-M04-03 — chỉ có ở pha cảnh báo trùng; rỗng/thiếu ở mọi lỗi khác. */
      duplicates?: DuplicateSuspect[];
    };
const STAFF_WRITE_ROLES: readonly AppRole[] = ["super_admin", "group_leader", "deputy_group_leader", "secretary"];
/**
 * Ai được bấm "Chuyển lớp" (D-105). Rộng hơn `STAFF_WRITE_ROLES` đúng hai vai
 * trò ngành — nhưng đây CHỈ là lớp lọc để người không bao giờ dùng được nút thì
 * nhận câu lỗi tử tế thay vì một `42501` trần. Ranh giới thật ("lớp cũ VÀ lớp
 * mới đều thuộc ngành mình") do `app.can_manage_class` trong RPC quyết định:
 * nó cần tra lớp → cấp → ngành, và chép luật đó sang TypeScript là tạo bản sao
 * thứ hai sẽ lệch đi.
 */
const STAFF_TRANSFER_ROLES: readonly AppRole[] = [...STAFF_WRITE_ROLES, "sector_leader", "sector_deputy"];

/**
 * Guard NGOÀI `try` (D-96, nợ #14). `requireRouteAccess("/staff")` báo hiệu hết
 * phiên / không được vào bằng `redirect()` — mà `redirect()` ném lỗi; nằm trong
 * `try` thì `catch` nuốt mất và người dùng nhận một câu lỗi vô nghĩa thay vì được
 * đưa về `/login`. Quyền ĐỌC `/staff` mở cho mọi vai trò nhân sự; quyền GHI hẹp
 * hơn nên kiểm bằng `assertStaffWrite` TRONG `try` (trả kết quả FORBIDDEN, không
 * chuyển trang — người chỉ có quyền đọc vẫn đang ở đúng trang mình được vào).
 */
async function requireStaffAccess(): Promise<AuthContext> {
  return requireRouteAccess("/staff");
}

function assertStaffWrite(context: AuthContext): void {
  if (!context.role || !STAFF_WRITE_ROLES.includes(context.role)) throw new AppError("FORBIDDEN");
}

function fail(error: unknown): StaffActionResult<never> {
  if (error instanceof AppError) return { ok: false, code: error.code, message: error.message };
  return { ok: false, code: "CONFLICT", message: "Không thể lưu dữ liệu nhân sự. Vui lòng thử lại." };
}

/**
 * TB-M04-03 pha một — tìm hồ sơ nghi trùng. Chạy dưới RLS của người thao tác,
 * và điều đó là đúng: bốn vai trò ghi được hồ sơ đều đọc được toàn xứ đoàn, nên
 * phép dò nhìn đủ; còn nếu về sau có ai đó ghi được mà đọc hẹp, cảnh báo hụt còn
 * hơn là rò hồ sơ ngoài phạm vi qua một danh sách "nghi trùng".
 */
async function findStaffDuplicates(input: {
  fullName: string;
  phone: string;
  dateOfBirth: string | null;
}): Promise<DuplicateSuspect[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("staff_profiles")
    .select("id, staff_code, full_name, saint_name, phone, date_of_birth, service_status")
    .order("full_name");
  const candidates: DuplicateCandidate[] = (data ?? []).map((row) => ({
    id: row.id,
    staffCode: row.staff_code,
    fullName: row.full_name,
    saintName: row.saint_name,
    phone: row.phone,
    dateOfBirth: row.date_of_birth,
    serviceStatus: row.service_status,
  }));
  return findDuplicateSuspects(candidates, input);
}

export async function createStaff(input: CreateStaffInput): Promise<StaffActionResult<{ id: string; staffCode: string }>> {
  const context = await requireStaffAccess();
  try {
    assertStaffWrite(context);
    const parsed = createStaffSchema.parse(input);

    // TB-M04-03 — cảnh báo MỀM. Không tạo ngay, nhưng cũng không chặn: người
    // nhập xem danh sách nghi trùng rồi bấm "Vẫn tạo hồ sơ mới" là qua. Không có
    // ràng buộc `unique` nào ở DB (AC-05.2 canh) vì hai GLV trùng họ tên và cả
    // một gia đình dùng chung một số điện thoại đều là chuyện bình thường.
    if (!parsed.confirmDuplicate) {
      const duplicates = await findStaffDuplicates({
        fullName: parsed.fullName,
        phone: parsed.phone,
        dateOfBirth: parsed.dateOfBirth,
      });
      if (duplicates.length > 0) {
        return {
          ok: false,
          code: "CONFLICT",
          message: "Đã có hồ sơ trông giống người này. Kiểm tra lại trước khi tạo.",
          duplicates,
        };
      }
    }

    const supabase = await createClient();
    const { data, error } = await supabase.from("staff_profiles").insert({
      title: parsed.title,
      saint_name: parsed.saintName || null,
      full_name: parsed.fullName,
      date_of_birth: parsed.dateOfBirth || null,
      phone: parsed.phone,
      email: parsed.email || null,
      address: parsed.address || null,
      formation_level: parsed.formationLevel,
      // STAFF-COMP-001 — cột này quyết tiền tố mã ở trigger
      // `staff_profiles_assign_code`: `tro_ta` ⇒ TTxxx, còn lại ⇒ GLVxxx.
      component: parsed.component,
      service_status: parsed.serviceStatus,
      updated_by: context.profileId,
    }).select("id, staff_code").single();
    if (error || !data) throw new AppError(error?.code === "23505" ? "CONFLICT" : "VALIDATION_ERROR");
    revalidatePath("/staff");
    return { ok: true, data: { id: data.id, staffCode: data.staff_code } };
  } catch (error) { return fail(error); }
}

export async function updateStaff(input: UpdateStaffInput): Promise<StaffActionResult> {
  const context = await requireStaffAccess();
  try {
    assertStaffWrite(context);
    const parsed = updateStaffSchema.parse(input);
    const { id, ...changes } = parsed;
    const payload = {
      ...(changes.title !== undefined ? { title: changes.title } : {}),
      ...(changes.saintName !== undefined ? { saint_name: changes.saintName || null } : {}),
      ...(changes.fullName !== undefined ? { full_name: changes.fullName } : {}),
      ...(changes.dateOfBirth !== undefined ? { date_of_birth: changes.dateOfBirth || null } : {}),
      ...(changes.phone !== undefined ? { phone: changes.phone || null } : {}),
      ...(changes.email !== undefined ? { email: changes.email || null } : {}),
      ...(changes.address !== undefined ? { address: changes.address || null } : {}),
      ...(changes.formationLevel !== undefined ? { formation_level: changes.formationLevel } : {}),
      // Sửa được thành phần, nhưng mã hồ sơ KHÔNG đổi theo — xem chú thích ở
      // `createStaffSchema.component` và trigger trong migration.
      ...(changes.component !== undefined ? { component: changes.component } : {}),
      ...(changes.serviceStatus !== undefined ? { service_status: changes.serviceStatus } : {}),
      updated_by: context.profileId,
    };
    const supabase = await createClient();
    const { data, error } = await supabase.from("staff_profiles").update(payload).eq("id", id).select("id").maybeSingle();
    if (error) throw new AppError("VALIDATION_ERROR");
    // SW-04: mọi write kiểm số dòng — 0 dòng (RLS chặn / id sai) = thất bại.
    if (!data) throw new AppError("RESOURCE_NOT_FOUND", "Không cập nhật được hồ sơ (không tìm thấy hoặc không đủ quyền).");
    revalidatePath("/staff");
    revalidatePath(`/staff/${id}`);
    return { ok: true, data: undefined };
  } catch (error) { return fail(error); }
}

export async function assignStaffToClass(input: AssignStaffInput): Promise<StaffActionResult<{ id: string }>> {
  const context = await requireStaffAccess();
  try {
    assertStaffWrite(context);
    const parsed = assignStaffSchema.parse(input);
    const supabase = await createClient();
    const { data, error } = await supabase.from("class_staff_assignments").insert({
      staff_profile_id: parsed.staffProfileId,
      class_id: parsed.classId,
      capacity: parsed.capacity,
      starts_on: parsed.startsOn,
      updated_by: context.profileId,
    }).select("id").single();
    if (error || !data) {
      // AC-01.4 — nêu ĐÚNG lý do kèm tên lớp/tên người, không gộp mọi thất bại
      // vào một câu liệt kê hai khả năng rồi để người dùng tự đoán.
      throw new AppError(
        error?.code === "23505" ? "CONFLICT" : "VALIDATION_ERROR",
        assignmentErrorMessage(error, await describeAssignmentTarget(parsed.staffProfileId, parsed.classId)),
      );
    }
    revalidatePath("/staff");
    revalidatePath(`/staff/${parsed.staffProfileId}`);
    revalidatePath("/classes");
    return { ok: true, data: { id: data.id } };
  } catch (error) { return fail(error); }
}

export async function endClassStaffAssignment(assignmentIdInput: string, endsOnInput: string): Promise<StaffActionResult> {
  const context = await requireStaffAccess();
  try {
    assertStaffWrite(context);
    const parsed = endStaffAssignmentSchema.parse({ assignmentId: assignmentIdInput, endsOn: endsOnInput });
    const supabase = await createClient();
    // Đọc trước để câu lỗi `INVALID_END_DATE` nêu được ngày bắt đầu thật (AC-03.2).
    const { data: current } = await supabase
      .from("class_staff_assignments")
      .select("starts_on, classes(display_name), staff_profiles(full_name)")
      .eq("id", parsed.assignmentId)
      .maybeSingle();
    const { error } = await supabase.rpc("end_class_staff_assignment", {
      target_assignment_id: parsed.assignmentId,
      target_ends_on: parsed.endsOn,
    });
    if (error) {
      throw new AppError(
        error.code === "P0002" ? "RESOURCE_NOT_FOUND" : error.code === "42501" ? "FORBIDDEN" : "VALIDATION_ERROR",
        assignmentErrorMessage(error, {
          staffName: (current?.staff_profiles as { full_name: string } | null)?.full_name ?? "Nhân sự này",
          currentClassName: (current?.classes as { display_name: string } | null)?.display_name ?? null,
          targetClassName: (current?.classes as { display_name: string } | null)?.display_name ?? null,
          startsOn: current?.starts_on ?? null,
        }),
      );
    }
    revalidatePath("/staff", "layout");
    revalidatePath("/classes");
    return { ok: true, data: undefined };
  } catch (error) { return fail(error); }
}

/** Tên người + tên lớp cho câu lỗi phân công. Chỉ chạy trên nhánh lỗi. */
async function describeAssignmentTarget(staffProfileId: string, classId: string) {
  const supabase = await createClient();
  const [staffResult, classResult] = await Promise.all([
    supabase
      .from("staff_profiles")
      .select("full_name, class_staff_assignments(is_active, classes(display_name))")
      .eq("id", staffProfileId)
      .maybeSingle(),
    supabase.from("classes").select("display_name").eq("id", classId).maybeSingle(),
  ]);
  const assignments = (staffResult.data?.class_staff_assignments ?? []) as Array<{
    is_active: boolean;
    classes: { display_name: string } | null;
  }>;
  return {
    staffName: staffResult.data?.full_name ?? "Nhân sự này",
    targetClassName: classResult.data?.display_name ?? null,
    currentClassName: assignments.find((item) => item.is_active)?.classes?.display_name ?? null,
    startsOn: null,
  };
}

/**
 * Chuyển lớp một bước (D-105 / TB-M04-02 PA A) — đóng M04-F06.
 *
 * Ba việc mà bản cũ bắt người dùng tự nhớ làm đúng thứ tự (kết thúc phân công →
 * phân công lớp mới → đổi vai trò đăng nhập) nay gộp vào một lệnh gọi RPC chạy
 * trong MỘT giao dịch. Dừng giữa chừng là điều không còn xảy ra được.
 *
 * Guard NGOÀI `try` (D-96). Quyền hẹp kiểm TRONG `try` để trả lỗi tại chỗ.
 */
export async function transferClassStaff(
  input: TransferClassStaffInput,
): Promise<StaffActionResult<{ assignmentId: string }>> {
  const context = await requireStaffAccess();
  try {
    if (!context.role || !STAFF_TRANSFER_ROLES.includes(context.role)) {
      throw new AppError("FORBIDDEN", "Bạn không có quyền chuyển lớp cho nhân sự.");
    }
    const parsed = transferClassStaffSchema.parse(input);
    const supabase = await createClient();

    // Đọc TRƯỚC khi gọi RPC: sau khi chuyển xong, `is_active` của dòng cũ đã đổi
    // nên không lấy lại được tên lớp cũ để viết câu thông báo, và hồ sơ đích cần
    // cho cả nhật ký lẫn câu lỗi.
    const { data: before } = await supabase
      .from("class_staff_assignments")
      .select("id, starts_on, classes(display_name), staff_profiles(id, full_name, profile_id)")
      .eq("id", parsed.assignmentId)
      .maybeSingle();
    const staffRow = (before?.staff_profiles ?? null) as
      | { id: string; full_name: string; profile_id: string | null }
      | null;
    const { data: targetClass } = await supabase
      .from("classes")
      .select("display_name")
      .eq("id", parsed.newClassId)
      .maybeSingle();

    const errorContext = {
      staffName: staffRow?.full_name ?? "Nhân sự này",
      targetClassName: targetClass?.display_name ?? null,
      currentClassName: (before?.classes as { display_name: string } | null)?.display_name ?? null,
      startsOn: before?.starts_on ?? null,
    };

    const { data: newAssignmentId, error } = await supabase.rpc("transfer_class_staff", {
      p_assignment_id: parsed.assignmentId,
      p_new_class_id: parsed.newClassId,
      p_new_capacity: parsed.capacity,
      p_effective_on: parsed.effectiveOn,
    });
    if (error) {
      throw new AppError(
        error.code === "42501" ? "FORBIDDEN" : error.code === "P0002" ? "RESOURCE_NOT_FOUND" : "VALIDATION_ERROR",
        assignmentErrorMessage(error, errorContext),
      );
    }

    // D-65 — chuyển lớp làm ĐỔI vai trò đăng nhập, nên phải vào nhật ký tài khoản
    // đúng như `assignPrimaryRole`. Chỉ ghi khi hồ sơ có tài khoản: không có tài
    // khoản thì RPC cũng không đụng tới vai trò nào.
    if (staffRow?.profile_id) {
      const admin = createAdminClient();
      const { data: targetProfile } = await admin
        .from("profiles")
        .select("username")
        .eq("id", staffRow.profile_id)
        .maybeSingle();
      const { error: auditError } = await admin.from("account_audit_events").insert({
        actor_profile_id: context.profileId,
        actor_username: context.username,
        target_profile_id: staffRow.profile_id,
        target_username: targetProfile?.username ?? staffRow.full_name,
        action: "assign_role",
        detail: `Chuyển lớp: ${errorContext.currentClassName ?? "?"} → ${errorContext.targetClassName ?? "?"} từ ${parsed.effectiveOn}`,
      });
      if (auditError) console.error("account_audit_insert_failed", { action: "assign_role", code: auditError.code });
    }

    revalidatePath("/staff", "layout");
    revalidatePath("/classes");
    return { ok: true, data: { assignmentId: String(newAssignmentId) } };
  } catch (error) {
    return fail(error);
  }
}

/**
 * Xóa hẳn một hồ sơ chưa từng dùng — D-106 (M04-F07, 5W-08), quyền D-109.
 *
 * Toàn bộ luật "chưa từng dùng" và phép so họ tên gõ lại nằm ở RPC
 * `delete_unused_staff_profile`; hàm này chỉ dịch mã lỗi sang tiếng Việt và ghi
 * nhật ký. Cố tình KHÔNG chép luật đó sang TypeScript: bảy bảng tham chiếu là
 * bảy chỗ có thể mọc thêm, và một bản sao ở tầng ứng dụng sẽ lệch đi sau vài
 * module nữa mà không ai biết.
 *
 * Guard NGOÀI `try` (D-96).
 */
export async function deleteStaffProfile(
  input: DeleteStaffInput,
): Promise<StaffActionResult<{ staffCode: string; fullName: string }>> {
  const context = await requireStaffAccess();
  try {
    assertStaffWrite(context);
    const parsed = deleteStaffSchema.parse(input);
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("delete_unused_staff_profile", {
      p_staff_id: parsed.id,
      p_confirm_name: parsed.confirmName,
    });
    if (error) {
      if (error.code === "42501") {
        throw new AppError("FORBIDDEN", "Bạn không có quyền xóa hồ sơ nhân sự.");
      }
      if (error.code === "P0002") {
        throw new AppError("RESOURCE_NOT_FOUND", "Không tìm thấy hồ sơ này. Có thể ai đó vừa xóa rồi.");
      }
      if (error.code === "22023") {
        throw new AppError(
          "VALIDATION_ERROR",
          "Họ tên gõ lại chưa khớp với hồ sơ. Hãy chép đúng họ tên hiển thị ở đầu trang.",
        );
      }
      if (error.code === "23503") {
        // Câu lỗi của DB đã là tiếng Việt và đã liệt kê đúng từng lý do — giữ
        // nguyên, chỉ bỏ tiền tố kỹ thuật. Viết lại thành một câu chung ("hồ sơ
        // đang được dùng") là ném đi đúng phần người dùng cần để biết làm gì tiếp.
        const detail = error.message.replace(/^.*?STAFF_PROFILE_IN_USE:\s*/s, "").trim();
        throw new AppError(
          "CONFLICT",
          detail ? `Không xóa được hồ sơ này. ${detail}` : "Không xóa được hồ sơ này.",
        );
      }
      throw new AppError("VALIDATION_ERROR", "Không xóa được hồ sơ này.");
    }

    const deleted = (data ?? {}) as { staffCode?: string; fullName?: string };
    const staffCode = deleted.staffCode ?? "";
    const fullName = deleted.fullName ?? parsed.confirmName;

    // D-65 — xóa hồ sơ nhân sự là thao tác nhạy cảm. Hồ sơ xóa được thì theo
    // định nghĩa không có tài khoản, nên `target_profile_id` để trống và danh
    // tính duy nhất còn lại là mã GLV + họ tên đã chụp lại.
    const admin = createAdminClient();
    const { error: auditError } = await admin.from("account_audit_events").insert({
      actor_profile_id: context.profileId,
      actor_username: context.username,
      target_profile_id: null,
      target_username: `${staffCode} · ${fullName}`.trim(),
      action: "delete_staff_profile",
      detail: "Xóa hồ sơ nhân sự chưa từng dùng (D-106)",
    });
    if (auditError) console.error("account_audit_insert_failed", { action: "delete_staff_profile", code: auditError.code });

    revalidatePath("/staff");
    return { ok: true, data: { staffCode, fullName } };
  } catch (error) {
    return fail(error);
  }
}

/**
 * TB-01.3 bước 1 — tạo hồ sơ ở `/staff` rồi ĐIỀU HƯỚNG THẲNG tới trang chi tiết
 * `/staff/[id]` (nơi cấp tài khoản).
 *
 * Chữ ký `(prevState, formData)` là để dùng với `useActionState`: nó vừa cho
 * phép pha hai của cảnh báo trùng (TB-M04-03) trả về danh sách nghi trùng KÈM
 * dữ liệu đã gõ, vừa **giữ được form chạy khi chưa có JavaScript** — React gửi
 * biểu mẫu tới chính Server Action này rồi dựng lại trang bằng state trả về.
 * Đây là lý do không dùng một Client Component tự gọi action: 09 §11 xếp
 * "form chạy không cần JS" vào danh sách không được đụng, và phòng học mạng yếu
 * là tình huống thật.
 */
export async function createStaffFormAction(
  _prevState: CreateStaffFormState,
  formData: FormData,
): Promise<CreateStaffFormState> {
  const values: CreateStaffFormValues = {
    title: String(formData.get("title") ?? "anh"),
    saintName: String(formData.get("saintName") ?? ""),
    fullName: String(formData.get("fullName") ?? ""),
    dateOfBirth: String(formData.get("dateOfBirth") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    address: String(formData.get("address") ?? ""),
    formationLevel: String(formData.get("formationLevel") ?? "none"),
    component: String(formData.get("component") ?? "khac"),
  };

  const result = await createStaff({
    title: values.title,
    saintName: values.saintName || null,
    fullName: values.fullName,
    dateOfBirth: values.dateOfBirth || null,
    phone: values.phone,
    email: values.email || null,
    address: values.address || null,
    formationLevel: values.formationLevel,
    component: values.component,
    serviceStatus: "active",
    confirmDuplicate: formData.get("confirmDuplicate") === "1",
  } as CreateStaffInput);

  if (result.ok) redirect(`/staff/${result.data.id}?created=1`);

  return {
    status: result.duplicates && result.duplicates.length > 0 ? "duplicate" : "error",
    message: result.message,
    duplicates: result.duplicates ?? [],
    values,
  };
}

export async function assignStaffFromForm(formData: FormData): Promise<void> {
  const result = await assignStaffToClass({
    staffProfileId: String(formData.get("staffProfileId") ?? ""),
    classId: String(formData.get("classId") ?? ""),
    capacity: String(formData.get("capacity")),
    startsOn: String(formData.get("startsOn") ?? ""),
  } as AssignStaffInput);
  if (!result.ok) redirect(`/staff?error=assign`);
  redirect(`/staff?ok=assign`);
}

export async function endStaffAssignmentFromForm(formData: FormData): Promise<void> {
  const result = await endClassStaffAssignment(String(formData.get("assignmentId") ?? ""), String(formData.get("endsOn") ?? ""));
  if (!result.ok) redirect(`/staff?error=end`);
  redirect(`/staff?ok=end`);
}

/**
 * Nửa sau của IMP-BULK-002 — **người dùng tự bổ sung hồ sơ của chính mình.**
 *
 * 🔴 Vì sao action này phải tồn tại. Nhập hàng loạt nay nhận cả người thiếu số
 * điện thoại, đổi lại chủ dự án chốt: *"khi họ có tài khoản cá nhân thì hệ thống
 * báo và họ tự nhập lại đầy đủ"*. Trước đợt này **không có đường nào** để làm
 * việc đó: `updateStaff` đòi `assertStaffWrite`, tức một Giáo lý viên lớp muốn
 * điền số của chính mình cũng phải đi nhờ Thư ký — đúng cái vòng mà việc nới
 * ràng buộc sinh ra để cắt.
 *
 * Ba hàng rào, không có cái nào thừa:
 *   1. `requireAuthContext` — phải đang đăng nhập (ngoài `try`, D-96);
 *   2. `eq("profile_id", context.profileId)` — chỉ chạm được hàng của chính
 *      mình, và id **không** đi qua biểu mẫu;
 *   3. `staff_profiles_update_self` + `app.guard_staff_self_update()` ở cơ sở
 *      dữ liệu — hàng rào thật cho đường gọi thẳng Data API, và là thứ chặn
 *      người dùng tự nâng `formation_level` hay `service_status` của mình.
 */
export async function updateOwnStaffContact(
  input: OwnStaffContactInput,
): Promise<StaffActionResult<{ missing: StaffContactField[] }>> {
  const context = await requireAuthContext("/account");
  try {
    const parsed = ownStaffContactSchema.parse(input);
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("staff_profiles")
      .update({
        phone: parsed.phone || null,
        date_of_birth: parsed.dateOfBirth || null,
        address: parsed.address || null,
        email: parsed.email || null,
        updated_by: context.profileId,
      })
      .eq("profile_id", context.profileId)
      .select("phone, date_of_birth, address, email")
      .maybeSingle();
    if (error) throw new AppError("VALIDATION_ERROR");
    // SW-04 — RLS từ chối bằng **0 dòng**, không bằng ngoại lệ. Tài khoản không
    // gắn hồ sơ nhân sự nào rơi vào đúng nhánh này.
    if (!data) {
      throw new AppError(
        "RESOURCE_NOT_FOUND",
        "Tài khoản của bạn chưa gắn với hồ sơ nhân sự nào nên chưa lưu được. Hãy báo Quản trị viên.",
      );
    }
    revalidatePath("/account");
    return {
      ok: true,
      data: {
        missing: missingStaffContactFields({
          phone: data.phone,
          dateOfBirth: data.date_of_birth,
          address: data.address,
          email: data.email,
        }),
      },
    };
  } catch (error) {
    return fail(error);
  }
}
