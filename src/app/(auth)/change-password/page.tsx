import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { ChangePasswordForm } from "@/features/auth/components/change-password-form";
import { requireAuthContext } from "@/lib/auth/guards";
import { sanitizeNextPath } from "@/lib/auth/login-redirect";

export const metadata: Metadata = { title: "Đổi mật khẩu" };

export default async function ChangePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const context = await requireAuthContext("/change-password");
  const params = await searchParams;
  // Trạm dừng giữa đường: đích ban đầu đi kèm qua đây rồi mới được dùng lại,
  // nếu không deep-link mất ngay ở lần đăng nhập đầu tiên (F01 TO-BE §4).
  const nextPath =
    sanitizeNextPath(Array.isArray(params.next) ? params.next[0] : params.next) ?? undefined;

  // 🔴 Trang này có HAI lối vào và trước M14 đợt C chỉ nói đúng cho một.
  // Bị hệ thống ép đổi ở lần đăng nhập đầu là một chuyện; tự bấm "Đổi mật khẩu"
  // từ trang Tài khoản (A-10) lại đọc được câu "Đây là lần đăng nhập đầu tiên"
  // kèm nhãn "Bắt buộc" là chuyện khác — nói sai với người dùng ở đúng chỗ họ
  // đang cẩn thận nhất.
  const forced = context.mustChangePassword;

  return (
    <div className="mx-auto max-w-md">
      {forced ? <Badge variant="warning">Bắt buộc</Badge> : null}
      <h1 className={`${forced ? "mt-4" : ""} text-3xl font-semibold tracking-tight text-ink`}>
        {forced ? "Tạo mật khẩu mới" : "Đổi mật khẩu"}
      </h1>
      <p className="mb-7 mt-2 text-sm text-ink-muted">
        {forced
          ? "Đây là lần đăng nhập đầu tiên. Vui lòng tạo mật khẩu riêng trước khi tiếp tục."
          : "Nhập mật khẩu hiện tại để xác nhận là bạn, rồi đặt mật khẩu mới. Lần đăng nhập sau sẽ dùng mật khẩu này."}
      </p>
      <ChangePasswordForm nextPath={nextPath} requireCurrentPassword={!forced} />
    </div>
  );
}
