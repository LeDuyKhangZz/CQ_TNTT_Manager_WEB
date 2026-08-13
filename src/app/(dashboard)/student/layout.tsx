import type { ReactNode } from "react";
import { requireRouteAccess } from "@/lib/auth/guards";

/**
 * M13-A / AC-01-03 — hàng rào theo cấu trúc cho toàn bộ `/student/*`.
 *
 * Trang điểm danh vẫn tự guard để phòng thủ hai lớp. Layout này bảo đảm một
 * trang thiếu nhi mới không thể vô tình chỉ kiểm "đã đăng nhập" như lỗi cũ.
 */
export default async function StudentPortalLayout({ children }: { children: ReactNode }) {
  await requireRouteAccess("/student");
  return <div data-density="comfortable">{children}</div>;
}
