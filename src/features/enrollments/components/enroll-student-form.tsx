"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/ui/date-field";
import { FormMessage } from "@/components/ui/form-message";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { EnrollmentFeedback } from "../enrollment-feedback";
import { enrollStudentFormAction } from "../server/actions";
import { useGlobalPending } from "@/components/loading/loading-provider";

/**
 * Biểu mẫu ghi danh — M03-A, TB-F14 / BR-M03-N10.
 *
 * Trước đợt này thao tác này im lặng hoàn toàn: `enrollStudentFromForm` trả
 * `Promise<void>`, nên **cả bốn** kết cục — thành công, trùng ghi danh (`23505`),
 * hết quyền, năm học đã đóng — đều cho ra đúng một trải nghiệm: trang tải lại,
 * không nói gì. Người dùng không có cách nào biết em đã vào lớp hay chưa.
 *
 * ⚠️ Ô chọn em **vẫn là danh sách đổ hết** — tìm kiếm trong ô này là BR-M03-N20,
 * thuộc **đợt M03-B** (`availableStudents` hiện kéo cả bảng `students` về Node rồi
 * lọc, `classes/server/queries.ts:162-173`).
 */
export function EnrollStudentForm({
  classId,
  today,
  students,
}: {
  classId: string;
  today: string;
  students: Array<{ id: string; label: string }>;
}) {
  const [feedback, formAction, pending] = useActionState<EnrollmentFeedback | null, FormData>(
    enrollStudentFormAction,
    null,
  );
  useGlobalPending(pending);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="classId" value={classId} />
      <div className="space-y-2">
        <Label htmlFor="enroll-student">Thiếu nhi</Label>
        <Select id="enroll-student" name="studentId" required placeholder="Chọn thiếu nhi" defaultValue="">
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="enroll-date">Ngày ghi danh</Label>
        <DateField id="enroll-date" name="enrolledOn" defaultValue={today} required />
      </div>
      <Button type="submit" className="w-full" pending={pending}>
        Ghi danh
      </Button>
      {feedback ? <FormMessage tone={feedback.tone}>{feedback.text}</FormMessage> : null}
    </form>
  );
}
