import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = { title: "Đăng nhập" };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md">
      <Badge variant="secondary">Hệ thống nội bộ</Badge>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">Chào mừng bạn trở lại</h1>
      <p className="mb-7 mt-2 text-sm text-muted-foreground">Đăng nhập bằng tài khoản do Ban quản trị cấp để vào hệ thống.</p>
      <LoginForm />
    </div>
  );
}
