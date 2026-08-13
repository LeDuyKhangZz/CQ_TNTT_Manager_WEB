import "server-only";

import { redirect } from "next/navigation";
import { canAccessRoute } from "@/lib/permissions/route-map";
import {
  buildChangePasswordUrl,
  buildLoginUrl,
  CHANGE_PASSWORD_PATH,
  DEFAULT_AFTER_LOGIN_PATH,
  pathnameOfNext,
} from "./login-redirect";
import { getAuthContext } from "./session";

/**
 * 🔴 Guard KHÔNG tự gõ chuỗi query — mọi URL đi ra đều qua `buildLoginUrl` /
 * `buildChangePasswordUrl` (M14 A-04). Bản cũ viết thẳng
 * `redirect("/login?error=account_unavailable")` và không có phía nào bị bắt
 * buộc đọc mã đó, nên người bị khoá tài khoản rơi vào màn hình đăng nhập trắng
 * trơn. Nay mã phải nằm trong danh sách ở `login-redirect.ts`, mà mỗi mã trong
 * đó đều đã có sẵn câu chữ hiển thị.
 */
export async function requireAuthContext(nextPath = DEFAULT_AFTER_LOGIN_PATH) {
  const context = await getAuthContext();
  if (!context) redirect(buildLoginUrl({ next: nextPath }));
  if (context.accountStatus !== "active") {
    redirect(buildLoginUrl({ error: "account_unavailable" }));
  }
  if (context.mustChangePassword && pathnameOfNext(nextPath) !== CHANGE_PASSWORD_PATH) {
    // `next` đi xuyên qua trạm đổi mật khẩu bắt buộc, nếu không người dùng gõ
    // deep-link ở lần đăng nhập đầu tiên sẽ mất đích đến ngay tại đây.
    redirect(buildChangePasswordUrl(nextPath));
  }
  return context;
}

export async function requireRouteAccess(pathname: string) {
  const context = await requireAuthContext(pathname);
  if (!canAccessRoute(context, pathnameOfNext(pathname))) redirect("/access-denied");
  return context;
}
