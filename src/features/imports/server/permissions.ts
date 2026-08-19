import "server-only";

import { AppError } from "@/lib/errors";
import { requireAuthContext, requireRouteAccess } from "@/lib/auth/guards";
import type { AppRole } from "@/lib/permissions/roles";
import { IMPORT_FORBIDDEN_TEXT } from "../import-feedback";

/**
 * 🔴 **M12-A — hai cổng, đặt ở hai chỗ khác nhau trong Server Action (D-96).**
 *
 * `importRouteContext()` có thể **chuyển hướng** (`redirect()` của Next báo hiệu
 * bằng cách ném lỗi) ⇒ phải gọi **ngoài `try`**. Trước đợt này cả năm action của
 * module gọi hàng rào **bên trong `try`**, mà `fail()` lại bắt mọi lỗi lạ, nên
 * người hết phiên đăng nhập bấm "Kiểm tra file" nhận câu *"Không xử lý được file
 * import. Vui lòng thử lại."* rồi thử lại mãi thay vì được đưa về `/login`.
 * Cùng hình dạng lỗi đã sửa cho `committees` · `equipment` · `auth` · `staff` ·
 * `academic-years` · `students`, nhưng module này **không lọt vào danh sách nợ
 * #14** vì nó gọi qua hàm bọc riêng chứ không gọi thẳng `requireAuthContext`.
 *
 * `assertImportAccess()` ném `AppError` ⇒ gọi **trong `try`** để thành một câu
 * tiếng Việt. Nó vẫn cần thiết dù `ROUTE_RULES` của `/imports` hiện trùng đúng
 * `IMPORT_ROLES`: hai danh sách nằm ở hai file, và cái ngày chúng lệch nhau thì
 * cổng thứ hai là thứ duy nhất còn đứng.
 */
export async function importRouteContext(nextPath = "/imports") {
  return requireRouteAccess(nextPath);
}

export function assertImportAccess(context: { role: AppRole | null }) {
  // Câu từ chối phải kể ĐÚNG vai trò được phép — người bị từ chối cần biết đi
  // nhờ ai, không phải đọc một câu chung chung rồi đi hỏi vòng quanh.
  if (!canImport(context.role)) throw new AppError("FORBIDDEN", IMPORT_FORBIDDEN_TEXT);
}

// IMP-BULK-002 (chủ dự án, 2026-08-19): một lượt nhập tạo hàng trăm hồ sơ,
// phụ huynh và ghi danh trong một cú bấm ⇒ quyền thu về đúng Super Admin.
// Danh sách này phải khớp ba chỗ khác, và cái ngày chúng lệch nhau là ngày mở
// lại một cánh cửa tưởng đã khoá: `ROUTE_RULES` của `/imports` + `/staff/bulk`
// (`route-map.ts`) và `app.is_super_admin()` trong policy của
// `import_batches`/`import_rows` (migration 20260819000100).
export const IMPORT_ROLES: readonly AppRole[] = ["super_admin"];

export function canImport(role: AppRole | null): boolean {
  return role !== null && IMPORT_ROLES.includes(role);
}

export async function requireImportAccess(nextPath = "/imports") {
  const context = await requireAuthContext(nextPath);
  if (!canImport(context.role)) throw new AppError("FORBIDDEN");
  return context;
}

/**
 * Guard cho Server Component của /imports. Khác {@link requireImportAccess} ở
 * chỗ sai vai trò thì chuyển hướng sang /access-denied giống mọi trang khác,
 * thay vì ném lỗi và rơi vào error boundary. Server Action vẫn dùng
 * requireImportAccess vì redirect trong action sẽ phá kiểu trả về của action.
 */
export async function requireImportPage(pathname = "/imports") {
  const context = await requireRouteAccess(pathname);
  if (!canImport(context.role)) throw new AppError("FORBIDDEN");
  return context;
}
