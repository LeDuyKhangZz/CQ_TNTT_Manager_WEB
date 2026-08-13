"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSemesterMilestoneFormAction } from "@/features/academic-years/server/actions";
import type { AdminFeedback } from "@/features/academic-years/admin-feedback";

/**
 * Mốc kết thúc học kỳ 1 của một năm học — **D-71**, **D-116**.
 *
 * Chủ dự án chốt 2026-07-25: **không bắt buộc, và sửa được sau**. Vế thứ hai là lý
 * do biểu mẫu này tồn tại: năm học `2026-2027` đang chạy được tạo ra **trước** khi
 * có trường này, nên nếu chỉ cho nhập lúc tạo năm thì năm đang chạy vĩnh viễn không
 * có mốc — và câu nghiệp vụ "lớp Dự trưởng chỉ học kỳ 1" (D-9) vẫn là dữ liệu chết
 * đúng ở năm duy nhất đang dùng.
 *
 * Một biểu mẫu cho **mỗi năm học**, đặt ngay trong thẻ của năm đó, thay vì một biểu
 * mẫu dùng chung có ô chọn năm: mốc này là thuộc tính của một bản ghi cụ thể, và ô
 * chọn năm sẽ cần trạng thái phía client để nạp lại giá trị mỗi lần đổi năm — tức
 * mất khả năng chạy-không-JS (09 §11).
 *
 * `min`/`max` của ô ngày lấy từ chính năm học, khớp CHECK constraint
 * `academic_years_semester_1_range`: trình duyệt chặn trước, Zod chặn sau, cơ sở dữ
 * liệu chặn cuối. Ô để trống là **xoá mốc**, không phải lỗi.
 */
export function SemesterMilestoneForm({
  academicYearId,
  startDate,
  endDate,
  semester1EndDate,
}: {
  academicYearId: string;
  startDate: string;
  endDate: string;
  semester1EndDate: string | null;
}) {
  const [feedback, formAction, pending] = useActionState<AdminFeedback | null, FormData>(
    updateSemesterMilestoneFormAction,
    null,
  );
  const inputId = `semester-1-end-${academicYearId}`;

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="academicYearId" value={academicYearId} />
      <input type="hidden" name="startDate" value={startDate} />
      <input type="hidden" name="endDate" value={endDate} />
      <Label htmlFor={inputId}>Ngày kết thúc học kỳ 1</Label>
      <div className="flex flex-wrap items-end gap-2">
        <Input
          id={inputId}
          name="semester1EndDate"
          type="date"
          className="w-44"
          min={startDate}
          max={endDate}
          defaultValue={semester1EndDate ?? ""}
        />
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          {pending ? "Đang lưu…" : "Lưu mốc"}
        </Button>
      </div>
      <p className="text-sm text-ink-muted">
        Để trống nếu chưa xác định. Qua mốc này, lớp Dự trưởng hiện cảnh báo — hệ thống không tự
        đóng lớp.
      </p>
      {feedback ? <FormMessage tone={feedback.tone}>{feedback.text}</FormMessage> : null}
    </form>
  );
}
