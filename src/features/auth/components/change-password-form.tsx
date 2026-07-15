"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Label } from "@/components/ui/label";
import { changePasswordSchema, type ChangePasswordValues } from "../schemas";
import { changeOwnPassword } from "../server/actions";
import { PasswordField } from "./password-field";

export function ChangePasswordForm() {
  const [foundationMessage, setFoundationMessage] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: ChangePasswordValues) {
    setFoundationMessage(null);
    const result = await changeOwnPassword(values);
    if (!result.ok) {
      setFoundationMessage(result.message);
      return;
    }
    window.location.assign(result.data.redirectTo);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="new-password">Mật khẩu mới</Label>
        <PasswordField id="new-password" autoComplete="new-password" placeholder="Tối thiểu 8 ký tự" aria-invalid={!!errors.password} aria-describedby="password-help new-password-error" {...register("password")} />
        <p id="password-help" className="text-xs text-muted-foreground">Có thể dùng chữ thường và số; tối thiểu 8 ký tự.</p>
        <FormMessage><span id="new-password-error">{errors.password?.message}</span></FormMessage>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password">Xác nhận mật khẩu mới</Label>
        <PasswordField id="confirm-password" autoComplete="new-password" placeholder="Nhập lại mật khẩu mới" aria-invalid={!!errors.confirmPassword} aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined} {...register("confirmPassword")} />
        <FormMessage><span id="confirm-password-error">{errors.confirmPassword?.message}</span></FormMessage>
      </div>
      <FormMessage tone="muted">{foundationMessage}</FormMessage>
      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Đang kiểm tra…" : "Lưu mật khẩu mới"}
      </Button>
    </form>
  );
}
