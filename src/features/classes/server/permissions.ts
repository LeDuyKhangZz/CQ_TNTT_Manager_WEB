import "server-only";

import { AppError } from "@/lib/errors";
import { requireRouteAccess } from "@/lib/auth/guards";
import type { AuthContext } from "@/lib/auth/types";
import type { AppRole } from "@/lib/permissions/roles";

/**
 * Guard hai phần theo **D-96** (bài học của M09-A):
 *
 *   · `classRouteContext()` có thể **chuyển hướng** (hết phiên → `/login`, sai vai
 *     trò → `/access-denied`). `redirect()` của Next báo hiệu bằng cách ném lỗi,
 *     nên phải gọi **NGOÀI `try`** — trong `try` là `catch` nuốt mất chuyển hướng
 *     và người hết phiên bấm mãi một nút không chạy.
 *   · `assertClassWrite()` ném `AppError` để `catch` biến thành câu tiếng Việt, nên
 *     chỗ của nó là **TRONG `try`**.
 *
 * Chuyển nguyên văn từ `academic-years/server/permissions.ts` sang đây (M02-B / I6)
 * cùng với `updateClass`.
 */
export async function classRouteContext() {
  return requireRouteAccess("/classes");
}

/**
 * Ghi vào bảng **lớp** — bốn vai trò ghi toàn xứ đoàn, khớp `app.can_global_write()`
 * và dòng "Ngành/lớp" của `docs/05` §3.
 *
 * 🔴 Cố ý KHÔNG gộp với năm học. **D-112** siết vòng đời *năm học* về một mình Super
 * Admin; nó **không** nói gì về lớp, và gộp hai thứ lại sẽ âm thầm cắt quyền của ba
 * vai trò trên một màn hình chủ dự án chưa hề bàn tới. Danh sách này chỉ là chốt
 * chặn ở cửa vào — quyết định cuối vẫn ở RLS `classes_update_global_write`, và
 * `updateClass` đọc **số dòng thay đổi** để biết RLS có chặn hay không (SW-04).
 */
const CLASS_WRITE_ROLES: readonly AppRole[] = [
  "super_admin",
  "group_leader",
  "deputy_group_leader",
  "secretary",
];

export function canWriteClass(role: AppRole | null): boolean {
  return role !== null && CLASS_WRITE_ROLES.includes(role);
}

export function assertClassWrite(context: Pick<AuthContext, "role">) {
  if (!canWriteClass(context.role ?? null)) throw new AppError("FORBIDDEN");
}
