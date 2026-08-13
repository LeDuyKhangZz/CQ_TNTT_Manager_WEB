import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthContext } from "@/lib/auth/types";
import type { AppRole } from "@/lib/permissions/roles";
import type { Database } from "@/types/database";

/**
 * 🔴 **D-144 (M06-B) — danh sách này rút từ BỐN vai trò xuống MỘT.**
 *
 * Trước đợt này nó là bản chép của `app.can_global_write()`: Xứ đoàn trưởng ·
 * Phó Xứ đoàn · Thư ký · Super Admin. Chủ dự án chốt theo `docs/03` WF-07 —
 * trách nhiệm giáo án thuộc về **đúng một người mỗi lớp**, là Giáo lý viên đại
 * diện — nên ba vai trò cấp xứ đoàn chỉ còn XEM.
 *
 * Super Admin ở lại (chủ dự án xác nhận 2026-08-05, cùng khuôn D-117): một lớp
 * chưa phân công đại diện thì đây là tài khoản duy nhất còn lập được giáo án.
 *
 * ⚠️ Đây chỉ là **hàng rào thứ hai**. Hàng rào thật là
 * `app.can_manage_teaching_plan` trong `20260805000100`; hai chỗ lệch nhau thì
 * hậu quả tối đa là một cái nút hiện ra rồi bị máy chủ từ chối.
 */
const SYSTEM_WIDE_WRITE_ROLES: readonly AppRole[] = ["super_admin"];

/**
 * Đúng danh sách của `app.can_global_read()`
 * (`20260715000100_identity_foundation.sql:157`). Chép lại ở đây là **có chủ ý
 * và có giới hạn**: hàm dưới chỉ dùng để **từ chối sớm** ở tầng ứng dụng, còn
 * quyết định cuối vẫn là RLS. Nếu hai danh sách lệch nhau thì hậu quả là một
 * lời từ chối thừa, không phải một lỗ hổng.
 *
 * 🔴 Thủ quỹ **không** có trong danh sách này — cùng phát hiện của M05-A: ô của
 * họ trong `docs/05` ghi "👁 báo cáo", tức đọc **báo cáo tổng hợp**, không phải
 * đọc mọi lớp.
 */
const GLOBAL_READ_ROLES: readonly AppRole[] = [
  "super_admin",
  "parish_priest",
  "chaplain",
  "group_leader",
  "deputy_group_leader",
  "secretary",
];

export function hasSystemWideTeachingPlanWrite(role: AppRole | null): boolean {
  return role !== null && SYSTEM_WIDE_WRITE_ROLES.includes(role);
}

export async function getManageableTeachingClassIds(
  context: AuthContext,
  supabase: SupabaseClient<Database>,
): Promise<Set<string> | null> {
  if (hasSystemWideTeachingPlanWrite(context.role)) return null;

  const classIds = new Set<string>();
  if (context.role === "class_representative" && context.classId) classIds.add(context.classId);

  const { data: staff } = await supabase
    .from("staff_profiles")
    .select("id")
    .eq("profile_id", context.profileId)
    .maybeSingle();
  if (!staff) return classIds;

  const { data } = await supabase
    .from("class_staff_assignments")
    .select("class_id")
    .eq("staff_profile_id", staff.id)
    .eq("capacity", "representative")
    .eq("is_active", true);
  for (const assignment of data ?? []) classIds.add(assignment.class_id);
  return classIds;
}

export async function canManageTeachingClass(
  context: AuthContext,
  supabase: SupabaseClient<Database>,
  classId: string,
): Promise<boolean> {
  const classIds = await getManageableTeachingClassIds(context, supabase);
  return classIds === null || classIds.has(classId);
}

/**
 * Có được **đọc** giáo án của lớp này không — M06-A, **TB-M06-04** (hạng mục #5).
 *
 * Vì sao cần: `createTeachingMaterialUrl` là action **duy nhất** của module
 * không kiểm quyền theo lớp, nó chỉ hỏi "đã đăng nhập chưa" rồi dựa hoàn toàn
 * vào RLS. Hiện vẫn an toàn nhờ **hai** lớp RLS (bảng + storage), nhưng
 * `docs/11` §7 đòi *"Action kiểm quyền tường minh TRƯỚC khi dựa vào RLS"*, và
 * một điểm gãy một-lớp trên đúng đường sinh link tải tệp là chỗ không nên để.
 *
 * 🔴 **Đây KHÔNG phải hàng rào duy nhất và không được coi là hàng rào duy nhất.**
 * Hai lớp RLS giữ nguyên; hàm này chỉ để **từ chối sớm**, trước khi chạm Storage
 * API — đúng chữ của **TB-06** trong `08_ACCEPTANCE_CRITERIA`.
 *
 * Bốn nhánh đúng bằng `docs/05` §6: đọc toàn cục · lớp ghi trên thẻ đăng nhập ·
 * ngành của mình · **có tên trong đội ngũ lớp**.
 *
 * ✅ **M06-B đã đóng chỗ lệch của đợt A.** Nhánh thứ tư ra đời ở M06-A trong khi
 * RLS chưa có nó, nên người thuộc nhánh ấy qua được hàng rào ứng dụng rồi vẫn bị
 * RLS chặn ở bước sau (lệch theo chiều **an toàn**). Từ `20260805000100` (D-145)
 * RLS có đúng nhánh ấy — cả policy đọc giáo án lẫn
 * `app.can_read_teaching_material` — nên hai tầng nay nói cùng một điều, và
 * người trong đội ngũ lớp tải được tệp thay vì đọc `FORBIDDEN`.
 */
export async function canReadTeachingClass(
  context: AuthContext,
  supabase: SupabaseClient<Database>,
  classId: string,
): Promise<boolean> {
  if (context.audience !== "staff") return false;
  if (context.role !== null && GLOBAL_READ_ROLES.includes(context.role)) return true;
  if (context.classId === classId) return true;

  if (context.sectorId) {
    const { data: classRow } = await supabase
      .from("classes")
      .select("grade_levels(sector_id)")
      .eq("id", classId)
      .maybeSingle();
    if (classRow?.grade_levels?.sector_id === context.sectorId) return true;
  }

  const { data: staff } = await supabase
    .from("staff_profiles")
    .select("id")
    .eq("profile_id", context.profileId)
    .maybeSingle();
  if (!staff) return false;

  const { data: assignment } = await supabase
    .from("class_staff_assignments")
    .select("id")
    .eq("staff_profile_id", staff.id)
    .eq("class_id", classId)
    .eq("is_active", true)
    .maybeSingle();
  return assignment !== null;
}

