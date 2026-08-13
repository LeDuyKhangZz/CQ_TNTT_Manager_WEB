"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Label } from "@/components/ui/label";
import {
  changePasswordSchema,
  changePasswordWithCurrentSchema,
  type ChangeOwnPasswordInput,
} from "../schemas";
import { changeOwnPassword } from "../server/actions";
import { PasswordField } from "./password-field";

/**
 * `nextPath` là đích người dùng đang muốn tới trước khi bị chặn lại ở đây.
 *
 * `requireCurrentPassword` (TB-04): bật khi đây là lần đổi TỰ NGUYỆN
 * (`mustChangePassword = false`). Lúc đó form thêm ô "Mật khẩu hiện tại" và
 * dùng schema chặt hơn — mật khẩu mới phải khác mật khẩu cũ. Lần đăng nhập đầu
 * (bắt buộc) giữ nguyên form hai ô.
 */
export function ChangePasswordForm({
  nextPath,
  requireCurrentPassword = false,
}: {
  nextPath?: string;
  requireCurrentPassword?: boolean;
}) {
  const [foundationMessage, setFoundationMessage] = useState<string | null>(null);
  const resolver = zodResolver(
    requireCurrentPassword ? changePasswordWithCurrentSchema : changePasswordSchema,
  ) as Resolver<ChangeOwnPasswordInput>;
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ChangeOwnPasswordInput>({
    resolver,
    defaultValues: requireCurrentPassword
      ? { currentPassword: "", password: "", confirmPassword: "" }
      : { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: ChangeOwnPasswordInput) {
    setFoundationMessage(null);
    const result = await changeOwnPassword(values, nextPath);
    if (!result.ok) {
      setFoundationMessage(result.message);
      return;
    }
    window.location.assign(result.data.redirectTo);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {requireCurrentPassword ? (
        <div className="space-y-2">
          <Label htmlFor="current-password">Mật khẩu hiện tại</Label>
          <PasswordField
            id="current-password"
            autoComplete="current-password"
            placeholder="Mật khẩu đang dùng"
            aria-invalid={!!errors.currentPassword}
            aria-describedby={errors.currentPassword ? "current-password-error" : undefined}
            {...register("currentPassword")}
          />
          <FormMessage id="current-password-error">{errors.currentPassword?.message}</FormMessage>
        </div>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="new-password">Mật khẩu mới</Label>
        <PasswordField id="new-password" autoComplete="new-password" placeholder="Tối thiểu 8 ký tự" aria-invalid={!!errors.password} aria-describedby={errors.password ? "password-help new-password-error" : "password-help"} {...register("password")} />
        <p id="password-help" className="text-xs text-muted-foreground">Có thể dùng chữ thường và số; tối thiểu 8 ký tự.</p>
        <FormMessage id="new-password-error">{errors.password?.message}</FormMessage>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password">Xác nhận mật khẩu mới</Label>
        <PasswordField id="confirm-password" autoComplete="new-password" placeholder="Nhập lại mật khẩu mới" aria-invalid={!!errors.confirmPassword} aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined} {...register("confirmPassword")} />
        <FormMessage id="confirm-password-error">{errors.confirmPassword?.message}</FormMessage>
      </div>
      <FormMessage tone="muted">{foundationMessage}</FormMessage>
      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Đang kiểm tra…" : "Lưu mật khẩu mới"}
      </Button>
    </form>
  );
}
