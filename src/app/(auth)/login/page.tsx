import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { LoginForm } from "@/features/auth/components/login-form";
import {
  buildChangePasswordUrl,
  resolveLoginBanner,
  resolveNextPath,
  sanitizeNextPath,
} from "@/lib/auth/login-redirect";
import { getAuthContext } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Đăng nhập" };

type LoginSearchParams = {
  next?: string | string[];
  error?: string | string[];
  notice?: string | string[];
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<LoginSearchParams>;
}) {
  const params = await searchParams;
  const nextPath =
    sanitizeNextPath(Array.isArray(params.next) ? params.next[0] : params.next) ?? undefined;

  /**
   * NC-3 (chủ dự án duyệt 2026-07-23, D-87): đã có phiên hợp lệ thì vào thẳng.
   *
   * `manifest.start_url` là `/login`, nên bản cũ bắt người dùng nhìn màn hình
   * đăng nhập mỗi lần mở app đã cài, dù phiên vẫn còn. Việc hiện lại biểu mẫu
   * KHÔNG bảo vệ được gì: phiên vẫn hiệu lực, ai cầm máy cũng chỉ cần gõ
   * `/dashboard` là vào.
   *
   * 🔴 Tài khoản **bị khoá** cố ý không rơi vào nhánh này. Họ phải ở lại đúng
   * trang này để đọc tấm băng giải thích — đó chính là lỗi A-04 đang sửa, và
   * cho họ đi tiếp sẽ dựng lại vòng lặp cũ: `/dashboard` đá về `/login`, hết.
   */
  const context = await getAuthContext();
  if (context && context.accountStatus === "active") {
    redirect(
      context.mustChangePassword
        ? buildChangePasswordUrl(nextPath)
        : resolveNextPath(context, nextPath),
    );
  }

  const banner = resolveLoginBanner(params);

  return (
    <div className="mx-auto max-w-md">
      <Badge variant="secondary">Hệ thống nội bộ</Badge>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink">Chào mừng bạn trở lại</h1>
      <p className="mb-7 mt-2 text-sm text-ink-muted">Đăng nhập bằng tài khoản do Ban quản trị cấp để vào hệ thống.</p>
      {banner ? (
        <Alert
          tone={banner.tone}
          role={banner.role}
          title={banner.title}
          className="mb-6"
          data-testid="login-banner"
        >
          {banner.description}
        </Alert>
      ) : null}
      <LoginForm nextPath={nextPath} />
    </div>
  );
}
