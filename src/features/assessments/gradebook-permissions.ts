/**
 * M07-B — hai luật phân quyền **thuần** của module Bảng điểm, tách khỏi
 * `server/permissions.ts` để kiểm được bằng unit test.
 *
 * `server/permissions.ts` mang `import "server-only"` và ba hàm đọc cơ sở dữ
 * liệu, nên nó không nạp được trong vitest. Hai luật dưới đây thì **không cần
 * cơ sở dữ liệu**: chúng chỉ đọc vai trò và lớp trong phiên đăng nhập — đúng
 * khuôn `score-diff.ts` của M07-A và `review-window.ts` của M05-B.
 *
 * ⚠️ Cả hai chỉ quyết định **hiện nút hay không**. Hàng rào thật nằm ở
 * `app.can_lock_gradebook` và `app.can_moderate_student_comment` trong cơ sở dữ
 * liệu — ẩn nút không phải authorization (`AGENTS` §5), và pgTAP `044` kiểm
 * đúng điều đó bằng JWT thật của từng vai trò.
 */

import type { AuthContext } from "@/lib/auth/types";
import { hasGlobalWrite } from "@/lib/permissions/roles";

/**
 * Nhóm cấp xứ đoàn — gương soi của `app.can_global_write()`.
 *
 * 🔴 **M08-A dời định nghĩa sang `@/lib/permissions/roles`** (hạng mục 9 của
 * `07_IMPLEMENTATION_IMPACT` module Chuyển lớp): luật này không thuộc riêng bảng
 * điểm, mà module Chuyển lớp đang **mượn qua biên giới feature**. Tên cũ giữ
 * nguyên ở đây làm bí danh — mọi chỗ gọi và bài kiểm của M07 không phải sửa một
 * chữ, và `07` §1 hạng mục 9 nói rõ đây là thay đổi **chỉ đường import**.
 */
export const hasGlobalResultWrite = hasGlobalWrite;

/**
 * **D-74 + D-151 / AC-10-01** — ai được **khóa** bảng điểm.
 *
 * 🔴 Trước M07-B có **ba tầng nói ba điều khác nhau**, và `08_ACCEPTANCE_CRITERIA`
 * §5 gọi thẳng đó là *"mâu thuẫn chưa giải quyết"*:
 *
 *   `docs/05` §5           → chỉ Giáo lý viên đại diện
 *   RPC `lock_gradebook`   → `is_class_representative or can_global_write`
 *   `queries.ts` `canLock` → liệt kê tay năm vai trò và **không kiểm lớp**, nên
 *                            đại diện lớp A vẫn thấy nút "Khóa" trên lớp B
 *
 * Chủ dự án chốt: **đại diện lớp + Giáo lý viên lớp của chính lớp đó**, cộng
 * **Super Admin** làm đường thoát (D-151) — cuối năm mà cả lớp không thao tác
 * kịp thì phải còn một tài khoản khóa hộ được.
 *
 * 🔴 Đọc `context.classId` — lớp ghi trong **vai trò** đang hoạt động, đúng thứ
 * `app.is_class_staff` soi (`app.current_class_id()`) — chứ **không** đọc sổ
 * phân công đội ngũ `class_staff_assignments` mà `canGradeClass` dùng. Hai quyển
 * sổ này lệch nhau được (D-145 của M06-B sinh ra từ đúng chỗ lệch ấy), nên soi
 * nhầm quyển là nút lại hiện sai một lần nữa.
 */
export function canLockGradebook(context: AuthContext, classId: string): boolean {
  if (context.role === "super_admin") return true;
  if (context.role !== "class_representative" && context.role !== "class_teacher") return false;
  return context.classId === classId;
}

/**
 * **BR-M07-33 / D-152** — ai được **sửa hoặc xóa** một nhận xét.
 *
 * Trước M07-B: **bất kỳ ai nhận xét được lớp** đều xóa được bài của người khác,
 * kể cả Dự trưởng phụ tá khi năm học bật cờ — và bảng không có lịch sử nên xóa
 * là mất hẳn, không ai biết đã từng có gì.
 *
 * `04_TO_BE_FLOWS` đề nghị *"tác giả hoặc `can_global_write`"*, nhưng
 * `07_IMPLEMENTATION_IMPACT` §3.3 ghi rõ đây là **giảm quyền của người đang
 * dùng** và phải chốt nghiệp vụ trước. **D-152 (chủ dự án, 2026-08-05):** thêm
 * **Giáo lý viên đại diện của chính lớp đó** — người chịu trách nhiệm về bảng
 * điểm lớp (cũng là người được khóa nó ở D-74) xử lý được ngay tại lớp, thay vì
 * phải nhờ cấp xứ đoàn xóa hộ một câu viết sai về một em nhỏ.
 */
export function canModerateComment(
  context: AuthContext,
  classId: string,
  authorProfileId: string | null,
): boolean {
  if (authorProfileId !== null && authorProfileId === context.profileId) return true;
  if (hasGlobalResultWrite(context.role)) return true;
  return context.role === "class_representative" && context.classId === classId;
}
