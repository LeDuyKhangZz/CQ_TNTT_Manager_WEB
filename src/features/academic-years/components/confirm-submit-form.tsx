"use client";

import { useActionState, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormMessage } from "@/components/ui/form-message";
import type { AdminFeedback } from "@/features/academic-years/admin-feedback";
import { useGlobalPending } from "@/components/loading/loading-provider";

/**
 * Một biểu mẫu-một-nút có hộp xác nhận và có nói kết quả, **vẫn chạy khi chưa có
 * JavaScript**.
 *
 * 🔴 Ở đây hai ràng buộc đã duyệt kéo ngược nhau, nên cách dựng quan trọng hơn
 * giao diện:
 *   · `11` §5 đòi thao tác nguy hiểm phải có `ConfirmDialog` nêu hậu quả bằng
 *     tên riêng — mà hộp thoại thì cần JS.
 *   · `09` §11 xếp "biểu mẫu chạy được không cần JS" vào danh sách KHÔNG ĐƯỢC
 *     ĐỤNG (máy yếu, mạng phòng học kém).
 *
 * Cách giải: giữ nguyên `<form action={…}>` thật — tức đường đi mặc định của
 * trình duyệt không hề bị thay — rồi **chỉ chặn lại khi JS đã chạy**. Không có
 * JS: bấm là gửi ngay, không có hộp xác nhận nhưng thao tác vẫn làm được. Có JS:
 * `onSubmit` chặn lần bấm đầu, mở hộp thoại, và lần gửi thứ hai đi qua
 * `requestSubmit()` của chính form đó.
 *
 * `confirmedRef` là **ref chứ không phải state**: `requestSubmit()` chạy đồng bộ
 * ngay trong cùng lượt xử lý sự kiện, còn `setState` thì chưa kịp có hiệu lực —
 * dùng state ở đây là hộp thoại mở lại lần thứ hai.
 *
 * Kết quả đi về qua `useActionState` chứ **không** qua `redirect()`: xem ghi chú
 * dài ở cuối `server/actions.ts` — chuyển hướng về chính route đang đứng làm
 * Next 15.5 bỏ luôn lượt dựng lại trang.
 */
export function ConfirmSubmitForm({
  action,
  fields,
  label,
  title,
  consequence,
  confirmLabel,
  tone = "primary",
  variant = "outline",
}: {
  action: (previous: AdminFeedback | null, formData: FormData) => Promise<AdminFeedback>;
  /** Cặp tên/giá trị đi kèm dưới dạng `<input type="hidden">`. */
  fields: Record<string, string>;
  label: string;
  title: string;
  consequence: ReactNode;
  confirmLabel: string;
  tone?: "danger" | "primary";
  variant?: "primary" | "outline" | "danger";
}) {
  const [feedback, formAction, pending] = useActionState<AdminFeedback | null, FormData>(
    action,
    null,
  );
  useGlobalPending(pending);
  const formRef = useRef<HTMLFormElement>(null);
  const confirmedRef = useRef(false);
  const [open, setOpen] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (confirmedRef.current) {
      confirmedRef.current = false;
      return;
    }
    event.preventDefault();
    setOpen(true);
  }

  function handleConfirm() {
    confirmedRef.current = true;
    setOpen(false);
    formRef.current?.requestSubmit();
  }

  return (
    <form ref={formRef} action={formAction} onSubmit={handleSubmit} className="space-y-2">
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <Button type="submit" variant={variant} size="sm" pending={pending}>
        {label}
      </Button>
      {feedback ? <FormMessage tone={feedback.tone}>{feedback.text}</FormMessage> : null}
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
        pending={pending}
        title={title}
        confirmLabel={confirmLabel}
        tone={tone}
        consequence={consequence}
      />
    </form>
  );
}
