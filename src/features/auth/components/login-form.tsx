"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useGlobalPending } from "@/components/loading/loading-provider";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginValues } from "../schemas";
import { loginWithUsername } from "../server/actions";
import { PasswordField } from "./password-field";

/** `nextPath` đã đi qua `sanitizeNextPath` ở trang; action vẫn kiểm lại lần nữa. */
export function LoginForm({ nextPath }: { nextPath?: string }) {
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });
  // Đăng nhập gọi Server Action rồi tải lại cả trang bằng `location.assign` —
  // hai lượt chờ nối nhau và không lượt nào chạy `loading.tsx` (`17` §3.2).
  useGlobalPending(isSubmitting);

  async function onSubmit(values: LoginValues) {
    setSubmissionError(null);
    const result = await loginWithUsername(values, nextPath);
    if (!result.ok) {
      setSubmissionError(result.message);
      return;
    }
    window.location.assign(result.data.redirectTo);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="username">Tên đăng nhập</Label>
        <Input id="username" autoComplete="username" placeholder="Ví dụ: GLV023" aria-invalid={!!errors.username} aria-describedby={errors.username ? "username-error" : undefined} {...register("username")} />
        <FormMessage id="username-error">{errors.username?.message}</FormMessage>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Mật khẩu</Label>
        <PasswordField id="password" autoComplete="current-password" placeholder="Nhập mật khẩu" aria-invalid={!!errors.password} aria-describedby={errors.password ? "password-error" : undefined} {...register("password")} />
        <FormMessage id="password-error">{errors.password?.message}</FormMessage>
      </div>
      <FormMessage>{submissionError}</FormMessage>
      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Đang kiểm tra…" : "Đăng nhập"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">Tài khoản do Ban quản trị Giáo xứ cấp. Hệ thống không hỗ trợ đăng ký công khai.</p>
    </form>
  );
}
