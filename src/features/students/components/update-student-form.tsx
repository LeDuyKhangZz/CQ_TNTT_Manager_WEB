"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { GENDER_LABELS } from "../student-status";
import type { StudentFeedback } from "../student-feedback";
import { updateStudentFormAction } from "../server/actions";
import { useGlobalPending } from "@/components/loading/loading-provider";

/**
 * Biểu mẫu "Cập nhật hồ sơ" — M03-A (TB-F14 / BR-M03-N11), **sửa lại ở M03-C**.
 *
 * 🔴 Đây là chỗ lỗi F05 (C9 = 2) nằm: `updateStudent` không kèm `.select()`, nên
 * **RLS chặn cũng trả `ok:true`** — người không đủ quyền bấm "Lưu thay đổi" và nhận
 * đúng thứ người đủ quyền nhận. Nay 0 dòng là một câu lỗi nói rõ hai khả năng.
 *
 * 🔴 **M03-C gỡ ô "Trạng thái" khỏi biểu mẫu này** (TB-F06 bước 1) — đó là điểm
 * trừ C5 = 2 của biên bản audit: một cú chọn nhầm trong `<select>` là lưu trữ
 * một em, không hỏi gì. Nay việc ấy là `StudentStatusPanel`, có hộp xác nhận và
 * một RPC đổi cả hai trục trạng thái trong một giao dịch.
 *
 * ⚠️ Gỡ ô khỏi giao diện mà quên gỡ khỏi adapter là **nguy hiểm hơn để nguyên**:
 * `formData.get("status") ?? "active"` sẽ âm thầm đặt mọi em về "Đang sinh hoạt"
 * mỗi lần ai đó sửa số điện thoại. Vì thế `status` bị loại khỏi cả
 * `updateStudentSchema` lẫn `updateStudentFormAction`, không chỉ khỏi JSX.
 */
export function UpdateStudentForm({
  student,
}: {
  student: {
    id: string;
    saintName: string;
    fullName: string;
    gender: string;
    dateOfBirth: string;
    patronFeastDate: string | null;
    phone: string | null;
    address: string | null;
    generalNotes: string | null;
    hardshipFlag: boolean;
    status: string;
  };
}) {
  const [feedback, formAction, pending] = useActionState<StudentFeedback | null, FormData>(
    updateStudentFormAction,
    null,
  );
  useGlobalPending(pending);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="id" value={student.id} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="edit-saint">Tên thánh</Label>
          <Input id="edit-saint" name="saintName" defaultValue={student.saintName} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-gender">Giới tính</Label>
          <Select id="edit-gender" name="gender" defaultValue={student.gender}>
            {Object.entries(GENDER_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-name">Họ tên</Label>
        <Input id="edit-name" name="fullName" defaultValue={student.fullName} required />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="edit-dob">Ngày sinh</Label>
          <Input
            id="edit-dob"
            name="dateOfBirth"
            type="date"
            defaultValue={student.dateOfBirth}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-feast">Bổn mạng</Label>
          <Input
            id="edit-feast"
            name="patronFeastDate"
            type="date"
            defaultValue={student.patronFeastDate ?? ""}
          />
        </div>
      </div>
      {/*
        🔴 Ô "Trạng thái" ĐÃ RỜI khỏi đây (M03-C, TB-F06 bước 1). Xem chú thích
        đầu file: để lại nó là để người dùng bấm một ô không còn tác dụng gì.
      */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="edit-phone">Điện thoại</Label>
          <Input id="edit-phone" name="phone" defaultValue={student.phone ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-address">Địa chỉ</Label>
          <Input id="edit-address" name="address" defaultValue={student.address ?? ""} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-notes">Ghi chú</Label>
        <Textarea
          id="edit-notes"
          name="generalNotes"
          rows={3}
          maxLength={1000}
          defaultValue={student.generalNotes ?? ""}
        />
      </div>
      <label className="flex min-h-11 items-center gap-2 text-sm" htmlFor="edit-hardship">
        <input
          id="edit-hardship"
          name="hardshipFlag"
          type="checkbox"
          defaultChecked={student.hardshipFlag}
          className="h-4 w-4"
        />
        Hoàn cảnh khó khăn
      </label>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Đang lưu…" : "Lưu thay đổi"}
      </Button>
      {feedback ? <FormMessage tone={feedback.tone}>{feedback.text}</FormMessage> : null}
    </form>
  );
}
