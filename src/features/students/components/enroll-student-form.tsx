"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { StudentFeedback } from "../student-feedback";
import { enrollStudentFromProfileAction } from "../server/actions";
import { useGlobalPending } from "@/components/loading/loading-provider";

/**
 * "Ghi danh vào lớp" trên trang hồ sơ — BR-M03-N19 / TB-F09.
 *
 * Chỉ hiện khi em **chưa có ghi danh mở trong năm hiện hành**; ràng buộc "một
 * ghi danh mở mỗi em mỗi năm" nằm ở cơ sở dữ liệu
 * (`enrollments_one_open_per_student_year_idx`), nên hiện biểu mẫu khi em đã có
 * lớp là mời người dùng đi thẳng vào một lỗi `23505`.
 *
 * Trước M03-B, hồ sơ tạo xong mà chưa xếp lớp là một ngõ cụt: `docs/03` WF-03 mô
 * tả một luồng liền, còn thực tế phải rời trang hồ sơ, mở `/classes`, tìm đúng
 * lớp, rồi tìm lại em trong một ô chọn chứa toàn bộ ~900 em (F02 C3=3, F09
 * C11/C12=2).
 */
export function EnrollStudentForm({
  studentId,
  classes,
}: {
  studentId: string;
  classes: Array<{ id: string; displayName: string; sectorName: string | null }>;
}) {
  const [feedback, formAction, pending] = useActionState<StudentFeedback | null, FormData>(
    enrollStudentFromProfileAction,
    null,
  );
  useGlobalPending(pending);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="studentId" value={studentId} />
      <div className="space-y-2">
        <Label htmlFor="enroll-class">Lớp của năm học hiện hành</Label>
        <Select id="enroll-class" name="classId" required placeholder="Chọn lớp">
          {classes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.displayName}
              {item.sectorName ? ` · ${item.sectorName}` : ""}
            </option>
          ))}
        </Select>
      </div>
      <Button type="submit" pending={pending}>
        Ghi danh
      </Button>
      {feedback ? <FormMessage tone={feedback.tone}>{feedback.text}</FormMessage> : null}
    </form>
  );
}
