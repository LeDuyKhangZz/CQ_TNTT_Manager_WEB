import "server-only";

import { AppError } from "@/lib/errors";
import { requireRouteAccess } from "@/lib/auth/guards";
import type { AppRole } from "@/lib/permissions/roles";
import { canDeleteSacrament, canWriteSensitive, canWriteStudents } from "../permissions";

/**
 * Cổng quyền phía máy chủ cho hồ sơ thiếu nhi và người giám hộ.
 *
 * Danh sách vai trò nằm ở `../permissions.ts` (file thuần, kiểm được bằng unit
 * test); ở đây chỉ còn phần chạm vào phiên đăng nhập. Xuất lại để mọi chỗ gọi
 * cũ giữ nguyên đường `import`.
 */
export {
  canArchiveStudent,
  canDeleteSacrament,
  canViewSensitive,
  canWriteSensitive,
  canWriteStudents,
  mustPickClassOnCreate,
  readsFeeDirectory,
  SACRAMENT_DELETE_ROLES,
  SENSITIVE_READ_ROLES,
  STUDENT_ARCHIVE_ROLES,
  STUDENT_SENSITIVE_WRITE_ROLES,
  STUDENT_WRITE_ROLES,
} from "../permissions";

/**
 * **D-96 / nợ #14** — cửa vào của mọi thao tác ghi hồ sơ thiếu nhi và giám hộ, tách
 * làm hai nửa có chủ đích:
 *
 *   · `studentRouteContext()` có thể **chuyển hướng** (`redirect()` của Next báo
 *     hiệu bằng cách ném lỗi) ⇒ phải gọi **ngoài `try`**, nếu không `catch` nuốt mất
 *     chuyển hướng và người hết phiên bấm mãi một nút không chạy.
 *   · `assertStudentWrite()` ném `AppError` ⇒ gọi **trong `try`** để thành một câu
 *     phản hồi tiếng Việt.
 *
 * `requireRouteAccess` thay `requireAuthContext`: bản cũ chỉ hỏi "đã đăng nhập chưa",
 * nên luật `ROUTE_RULES` của `/students` chưa từng được thi hành ở tầng action.
 */
export async function studentRouteContext(nextPath = "/students") {
  return requireRouteAccess(nextPath);
}

export function assertStudentWrite(context: { role: AppRole | null }) {
  if (!canWriteStudents(context.role)) throw new AppError("FORBIDDEN");
}

/**
 * 🔴 Cổng RIÊNG cho sức khoẻ và bí tích — **D-127** (Q-M03-02 chốt 2026-07-28).
 *
 * Vẫn tách khỏi `assertStudentWrite` sau khi đã nới, vì hai nhóm khác nhau ở
 * **hai đầu ngược nhau**: Giáo lý viên ghi được sức khoẻ nhưng không sửa được
 * ngày sinh của em; Trưởng ngành làm được cả hai. Gộp làm một là hoặc mở quyền
 * sửa hồ sơ cho Giáo lý viên (chưa ai duyệt), hoặc cắt mất quyền ghi sức khoẻ
 * vừa được duyệt của họ.
 */
export function assertSensitiveWrite(context: { role: AppRole | null }) {
  if (!canWriteSensitive(context.role)) throw new AppError("FORBIDDEN");
}

/**
 * **D-128** — xoá bản ghi bí tích. Hẹp hơn `assertSensitiveWrite` một bậc: cả
 * bốn vai trò vừa được trao quyền ghi ở D-127 đều **không** xoá được.
 */
export function assertSacramentDelete(context: { role: AppRole | null }) {
  if (!canDeleteSacrament(context.role)) throw new AppError("FORBIDDEN");
}
