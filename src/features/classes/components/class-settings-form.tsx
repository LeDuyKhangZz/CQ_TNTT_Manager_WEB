"use client";

import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CLASS_STATUS_LABELS, classStatusLabel } from "@/features/classes/class-status";
import { refreshClassPage, updateClassFormAction } from "@/features/classes/server/actions";
import type { ClassFeedback } from "@/features/classes/class-feedback";
import { useGlobalPending } from "@/components/loading/loading-provider";

/**
 * Màn hình "Cài đặt lớp" — TB-F08 / AC-M02-10, I6.
 *
 * `updateClass` viết xong từ Phase 1 mà **không màn hình nào gọi** (5W-F08). Đây là
 * call site thật đầu tiên: đóng lớp, tạm ngưng lớp, ghi phòng sinh hoạt và ghi chú.
 *
 * Ba điều quan trọng hơn hình thức:
 *
 * 1. 🔴 **Hộp xác nhận chỉ mở khi cần** — BR-M02-N11: chuyển lớp sang trạng thái
 *    khác `active` **không** tự kết thúc ghi danh đang mở (`enrollments_validate`
 *    chỉ chặn ghi danh MỚI). Nên nếu lớp còn em đang sinh hoạt, phải nói ra **số
 *    em và tên lớp** rồi mới cho lưu. Đổi phòng sinh hoạt thì không cần hỏi gì —
 *    hộp xác nhận cho mọi lượt lưu là cách nhanh nhất để người dùng bấm "Xác nhận"
 *    theo phản xạ, và lúc đó nó thành đồ trang trí.
 *
 * 2. **Vẫn chạy khi chưa có JavaScript** (09 §11): `<form action={…}>` là thật,
 *    `onSubmit` chỉ chặn khi JS đã chạy. Không có JS thì bấm là lưu ngay — mất hộp
 *    xác nhận nhưng **không mất thao tác**. Cùng khuôn `ConfirmSubmitForm` của M02-A.
 *
 * 3. **Cờ "đã xác nhận" là `useRef`, không phải state**: `requestSubmit()` chạy đồng
 *    bộ ngay trong cùng lượt xử lý sự kiện, `setState` chưa kịp có hiệu lực — dùng
 *    state ở đây là hộp thoại mở lại lần thứ hai (bài học đo được ở M02-A).
 */
export function ClassSettingsForm({
  classId,
  className,
  status,
  meetingLocation,
  notes,
  openEnrollmentCount,
}: {
  classId: string;
  className: string;
  status: string;
  meetingLocation: string | null;
  notes: string | null;
  openEnrollmentCount: number;
}) {
  const router = useRouter();
  const [feedback, formAction, pending] = useActionState<ClassFeedback | null, FormData>(
    updateClassFormAction,
    null,
  );
  useGlobalPending(pending);
  const formRef = useRef<HTMLFormElement>(null);
  const confirmedRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(status);
  // Trạng thái đang chọn trên ô, để biết có phải hỏi xác nhận hay không. Đây là
  // trạng thái giao diện thuần, không phải nguồn dữ liệu — giá trị gửi đi vẫn là giá
  // trị của chính thẻ `<select>` trong `FormData`.
  const [selected, setSelected] = useState(status);

  useEffect(() => {
    if (!feedback || feedback.tone !== "success") return;
    const timer = window.setTimeout(() => {
      void refreshClassPage(classId).then(
        () => router.refresh(),
        () => router.refresh(),
      );
    }, 100);
    return () => window.clearTimeout(timer);
  }, [classId, feedback, router]);

  const needsConfirm = selected !== "active" && openEnrollmentCount > 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (confirmedRef.current) {
      confirmedRef.current = false;
      return;
    }
    if (!needsConfirm) return;
    event.preventDefault();
    setPendingStatus(new FormData(event.currentTarget).get("status") as string);
    setOpen(true);
  }

  function handleConfirm() {
    confirmedRef.current = true;
    setOpen(false);
    formRef.current?.requestSubmit();
  }

  return (
    <form ref={formRef} action={formAction} onSubmit={handleSubmit} className="space-y-3">
      <input type="hidden" name="classId" value={classId} />

      <div className="space-y-2">
        <Label htmlFor="class-status">Trạng thái lớp</Label>
        <Select
          id="class-status"
          name="status"
          defaultValue={status}
          onChange={(event) => setSelected(event.target.value)}
        >
          {Object.entries(CLASS_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="class-location">Phòng sinh hoạt</Label>
        <Input
          id="class-location"
          name="meetingLocation"
          maxLength={200}
          defaultValue={meetingLocation ?? ""}
          placeholder="Ví dụ: Phòng 3, tầng 2"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="class-notes">Ghi chú</Label>
        <Textarea
          id="class-notes"
          name="notes"
          rows={3}
          maxLength={1000}
          defaultValue={notes ?? ""}
          placeholder="Ghi chú nội bộ về lớp này."
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Đang lưu…" : "Lưu cài đặt lớp"}
      </Button>
      {feedback ? <FormMessage tone={feedback.tone}>{feedback.text}</FormMessage> : null}

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
        pending={pending}
        title={`Chuyển lớp sang "${classStatusLabel(pendingStatus)}"?`}
        confirmLabel="Lưu cài đặt lớp"
        tone="danger"
        consequence={
          <>
            <p>
              Lớp <strong>{className}</strong> còn{" "}
              <strong>{openEnrollmentCount} em đang sinh hoạt</strong>. Chuyển sang{" "}
              <strong>{classStatusLabel(pendingStatus)}</strong> <strong>không</strong> kết thúc ghi
              danh của các em — các em vẫn nằm trong lớp và vẫn tính vào sĩ số báo cáo.
            </p>
            <p className="mt-2">
              Lớp sẽ không nhận ghi danh mới. Nếu muốn chuyển các em sang lớp khác, hãy làm việc đó
              trước.
            </p>
          </>
        }
      />
    </form>
  );
}
