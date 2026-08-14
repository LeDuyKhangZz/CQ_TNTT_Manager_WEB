"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { StudentFeedback } from "../student-feedback";
import { saveHealthProfileFormAction } from "../server/actions";
import { useGlobalPending } from "@/components/loading/loading-provider";

/**
 * Hồ sơ sức khỏe — M03-A, TB-F14.
 *
 * `maxLength={1000}` khớp đúng giới hạn của Zod (`healthProfileSchema`). Trước đợt
 * này bốn ô đều là `<textarea>` trần **không có `maxLength`**: gõ quá 1000 ký tự thì
 * Zod từ chối, lỗi bị nuốt, và người nhập mất trắng đoạn vừa gõ mà không hiểu vì sao
 * (điểm trừ của F07 trong biên bản audit — "mất dữ liệu im lặng").
 *
 * ⚠️ Đây là **dữ liệu nhạy cảm**: BR-M03-26 — phụ huynh và thiếu nhi không bao giờ
 * đọc được, và chốt chặn nằm ở RLS (`20260721000200:128-142`, pgTAP `006:98-99`),
 * không phải ở việc trang này có hiện hay không.
 */
export function HealthProfileForm({
  studentId,
  health,
}: {
  studentId: string;
  health: {
    allergies: string | null;
    medicalConditions: string | null;
    medications: string | null;
    emergencyNotes: string | null;
  } | null;
}) {
  const [feedback, formAction, pending] = useActionState<StudentFeedback | null, FormData>(
    saveHealthProfileFormAction,
    null,
  );
  useGlobalPending(pending);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="studentId" value={studentId} />
      <div className="space-y-2">
        <Label htmlFor="health-allergies">Dị ứng</Label>
        <Textarea
          id="health-allergies"
          name="allergies"
          rows={3}
          maxLength={1000}
          defaultValue={health?.allergies ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="health-conditions">Bệnh lý</Label>
        <Textarea
          id="health-conditions"
          name="medicalConditions"
          rows={3}
          maxLength={1000}
          defaultValue={health?.medicalConditions ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="health-medications">Thuốc đang dùng</Label>
        <Textarea
          id="health-medications"
          name="medications"
          rows={3}
          maxLength={1000}
          defaultValue={health?.medications ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="health-emergency">Ghi chú khẩn cấp</Label>
        <Textarea
          id="health-emergency"
          name="emergencyNotes"
          rows={3}
          maxLength={1000}
          defaultValue={health?.emergencyNotes ?? ""}
        />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Đang lưu…" : "Lưu thông tin sức khỏe"}
      </Button>
      {feedback ? <FormMessage tone={feedback.tone}>{feedback.text}</FormMessage> : null}
    </form>
  );
}
