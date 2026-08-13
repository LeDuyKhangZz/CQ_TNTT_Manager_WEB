"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateAttendanceSettingsFormAction } from "@/features/academic-years/server/actions";
import type { AdminFeedback } from "@/features/academic-years/admin-feedback";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Đang lưu…" : "Lưu cấu hình"}
    </Button>
  );
}

export interface AttendanceSettingsFormProps {
  academicYearId: string;
  lockDays: number;
  leaseMinutes: number;
  consecutiveAbsences: number;
  consecutiveSundays: number;
  ratePercent: number;
}

/**
 * Cấu hình điểm danh của năm học hiện hành — TB-F12 / AC-M02-04.
 *
 * Trước đợt này, lưu bị RLS chặn và lưu thành công **trông giống hệt nhau**: câu
 * `update` không có `.select()` nên 0 dòng cũng trả `ok`, còn adapter thì khai
 * `Promise<void>` và vứt kết quả (5W-F01, SW-04). Nay cả hai đầu đều được vá:
 * action đếm số dòng thật, và biểu mẫu này hiện câu trả lời.
 */
export function AttendanceSettingsForm(props: AttendanceSettingsFormProps) {
  const [feedback, formAction] = useActionState<AdminFeedback | null, FormData>(
    updateAttendanceSettingsFormAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      {feedback ? <FormMessage tone={feedback.tone}>{feedback.text}</FormMessage> : null}
      <input type="hidden" name="academicYearId" value={props.academicYearId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="settings-lock-days">Khóa điểm danh sau (ngày)</Label>
          <Input id="settings-lock-days" name="attendanceLockDays" type="number" min="0" max="30" defaultValue={props.lockDays} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="settings-lease">Phiên chỉnh sửa (phút)</Label>
          <Input id="settings-lease" name="attendanceEditLeaseMinutes" type="number" min="1" max="60" defaultValue={props.leaseMinutes} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="settings-absences">Cảnh báo khi vắng liên tiếp (buổi)</Label>
          <Input id="settings-absences" name="warningConsecutiveAbsences" type="number" min="1" max="20" defaultValue={props.consecutiveAbsences} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="settings-sundays">Cảnh báo khi vắng lễ liên tiếp (Chúa nhật)</Label>
          <Input id="settings-sundays" name="warningConsecutiveSundays" type="number" min="1" max="20" defaultValue={props.consecutiveSundays} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="settings-rate">Cảnh báo khi tỷ lệ chuyên cần dưới (%)</Label>
        <Input id="settings-rate" name="warningRatePercent" type="number" min="1" max="100" defaultValue={props.ratePercent} required />
      </div>
      <SubmitButton />
    </form>
  );
}
