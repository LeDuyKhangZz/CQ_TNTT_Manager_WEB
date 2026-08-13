import "server-only";

import { AppError } from "@/lib/errors";
import { requireRouteAccess } from "@/lib/auth/guards";
import type { AuthContext } from "@/lib/auth/types";

/**
 * Guard hai phần, theo **D-96** (bài học của M09-A):
 *
 *   · `*RouteContext()` có thể **chuyển hướng** (hết phiên → `/login`, sai vai
 *     trò → `/access-denied`). `redirect()` của Next báo hiệu bằng cách ném lỗi,
 *     nên hàm này phải được gọi **NGOÀI `try`** — nằm trong `try` là `catch`
 *     nuốt mất chuyển hướng và người hết phiên bấm mãi một nút không chạy.
 *   · `assert*()` là kiểm quyền hẹp, ném `AppError` để `catch` biến thành câu
 *     tiếng Việt — chỗ của nó là **TRONG `try`**.
 *
 * Dùng `requireRouteAccess` chứ không phải `requireAuthContext`: luật `ROUTE_RULES`
 * phải được thi hành ở cả tầng action, không chỉ tầng trang.
 */
export async function academicYearRouteContext() {
  return requireRouteAccess("/admin");
}

/**
 * 🔴 **D-112** (chủ dự án chốt 2026-07-25) — vòng đời NĂM HỌC chỉ còn Super Admin.
 *
 * Trước đợt M02-A, ba tầng nói ba kiểu về cùng một việc: bảng phân quyền cho 4
 * vai trò, cửa vào `/admin` chỉ cho Super Admin, còn RLS thì chặn Thư ký/Phó Xứ
 * đoàn ngay trên năm đang chạy. Ba tầng lệch nhau vừa là chỗ lỗ hổng sinh ra,
 * vừa là chỗ người dùng mất niềm tin ("bảng phân quyền nói tôi được mà bấm vào
 * lại bị đuổi"). Nay cả ba nói cùng một câu; `docs/05` §3 đã sửa theo.
 */
export function assertAcademicYearAdmin(context: Pick<AuthContext, "role">) {
  if (context.role !== "super_admin") throw new AppError("FORBIDDEN");
}

// `classRouteContext` và `assertClassWrite` đã chuyển sang
// `features/classes/server/permissions.ts` ở M02-B (I6), đi cùng `updateClass`.
// Để chúng ở lại đây là mời gọi trộn hai nhóm quyền khác nhau trong cùng một file:
// năm học từ D-112 chỉ còn Super Admin, còn lớp vẫn là bốn vai trò ghi toàn xứ đoàn.
