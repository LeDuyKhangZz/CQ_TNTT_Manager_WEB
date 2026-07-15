import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { ChangePasswordForm } from "@/features/auth/components/change-password-form";
import { requireAuthContext } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Đổi mật khẩu" };

export default async function ChangePasswordPage() {
  await requireAuthContext("/change-password");
  return (
    <div className="mx-auto max-w-md">
      <Badge variant="warning">Bắt buộc</Badge>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">Tạo mật khẩu mới</h1>
      <p className="mb-7 mt-2 text-sm text-muted-foreground">Đây là lần đăng nhập đầu tiên. Vui lòng tạo mật khẩu riêng trước khi tiếp tục.</p>
      <ChangePasswordForm />
    </div>
  );
}
