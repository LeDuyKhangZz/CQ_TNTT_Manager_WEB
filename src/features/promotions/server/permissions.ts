import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthContext } from "@/lib/auth/types";
import type { Database } from "@/types/database";
import { hasGlobalWrite } from "@/lib/permissions/roles";

/**
 * Tập lớp mà người đang đăng nhập được **đề xuất** chuyển lớp — `null` nghĩa là
 * *"mọi lớp"* (cấp xứ đoàn ghi được).
 *
 * 🔴 **Đây là hạng mục 1 của `07_IMPLEMENTATION_IMPACT`, và là gốc rễ mà 5-Whys
 * §4.1 truy ra.** `canProposeForClass` bên dưới nhận **một** `classId` và chạy
 * hai truy vấn; `queries.ts` cũ gọi nó **trong một `Promise.all` trên từng ghi
 * danh**, nên mở `/promotions` với ~900 em là ~1.800 lượt đi về cơ sở dữ liệu.
 * Hàm dưới đây hỏi đúng câu người ta cần cho một **danh sách** — *"tôi là đại
 * diện của những lớp nào"* — bằng **hai truy vấn cố định**, không phụ thuộc số
 * dòng (AC-13).
 *
 * ⚠️ Vẫn chỉ dùng để **hiện nút**. Hàng rào thật là `app.can_manage_promotion`
 * bên trong RPC `propose_promotion`, và Server Action kiểm lại lần hai bằng
 * `canProposeForClass` — ẩn nút không phải authorization (`AGENTS` §5).
 */
export async function getRepresentativeClassIds(
  context: AuthContext,
  supabase: SupabaseClient<Database>,
): Promise<Set<string> | null> {
  if (hasGlobalWrite(context.role)) return null;
  const { data: staff } = await supabase
    .from("staff_profiles")
    .select("id")
    .eq("profile_id", context.profileId)
    .maybeSingle();
  if (!staff) return new Set();
  const { data } = await supabase
    .from("class_staff_assignments")
    .select("class_id")
    .eq("staff_profile_id", staff.id)
    .eq("capacity", "representative")
    .eq("is_active", true);
  return new Set((data ?? []).map((row) => row.class_id));
}

/**
 * Giữ nguyên cho **một thao tác đơn lẻ** — Server Action vẫn phải kiểm lại quyền
 * của đúng ghi danh người dùng gửi lên, không tin danh sách đã dựng cho màn hình.
 */
export async function canProposeForClass(
  context: AuthContext,
  supabase: SupabaseClient<Database>,
  classId: string,
): Promise<boolean> {
  const scope = await getRepresentativeClassIds(context, supabase);
  return scope === null || scope.has(classId);
}

export function canReviewSector(
  context: AuthContext,
  sourceSectorId: string | null,
): boolean {
  if (hasGlobalWrite(context.role)) return true;
  return ["sector_leader", "sector_deputy"].includes(context.role ?? "")
    && context.sectorId !== null
    && context.sectorId === sourceSectorId;
}
