"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAcademicYearFormAction } from "@/features/academic-years/server/actions";
import { CREATE_YEAR_INITIAL_STATE } from "@/features/academic-years/create-year-form-state";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Đang tạo…" : "Tạo năm học nháp"}
    </Button>
  );
}

/**
 * Biểu mẫu "Tạo năm học" — TB-F12 / AC-M02-04, D-61 (loại **biểu mẫu dài**).
 *
 * Trước đợt này, gửi biểu mẫu 7 ô rồi trùng mã năm học là màn hình **không nói
 * một chữ nào** (5W-F01): adapter khai `Promise<void>` và vứt luôn kết quả. Nay
 * lỗi hiện tại chỗ và dữ liệu đã gõ được giữ nguyên.
 *
 * Dùng `useActionState` chứ không phải `useState` + gọi action bằng tay: chỉ cách
 * này mới giữ được biểu mẫu **chạy khi chưa có JavaScript** (09 §11) — React gửi
 * thẳng tới Server Action rồi dựng lại trang bằng state trả về.
 */
export function CreateYearForm() {
  const [state, formAction] = useActionState(
    createAcademicYearFormAction,
    CREATE_YEAR_INITIAL_STATE,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state.message ? (
        <FormMessage tone={state.status === "success" ? "success" : "danger"}>
          {state.message}
        </FormMessage>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="academic-code">Mã năm học</Label>
        {/* `key` theo giá trị: sau lượt THÀNH CÔNG, state trả về ô rỗng — mà
            `defaultValue` chỉ có tác dụng lúc gắn vào DOM nên nếu không đổi `key`
            thì mã năm vừa tạo còn nguyên trên biểu mẫu và người dùng bấm tiếp là
            gặp ngay lỗi trùng mã. */}
        <Input
          id="academic-code"
          name="code"
          key={`code-${state.values.code}`}
          placeholder="2026-2027"
          required
          pattern="[0-9]{4}-[0-9]{4}"
          defaultValue={state.values.code}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="academic-name">Tên hiển thị</Label>
        <Input
          id="academic-name"
          name="name"
          key={`name-${state.values.name}`}
          placeholder="Năm học 2026–2027"
          required
          defaultValue={state.values.name}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="academic-start">Ngày bắt đầu</Label>
          <Input id="academic-start" name="startDate" type="date" required key={`start-${state.values.startDate}`} defaultValue={state.values.startDate} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="academic-end">Ngày kết thúc</Label>
          <Input id="academic-end" name="endDate" type="date" required key={`end-${state.values.endDate}`} defaultValue={state.values.endDate} />
        </div>
      </div>
      {/* D-71 / D-116 — mốc kết thúc học kỳ 1, KHÔNG bắt buộc. Đặt cạnh hai ô ngày
          kia vì nó là ngày thứ ba của cùng một khung thời gian; nói rõ "không bắt
          buộc" ngay trên nhãn để người dùng không đi tìm giá trị mình chưa biết. */}
      <div className="space-y-2">
        <Label htmlFor="academic-semester-1-end">
          Ngày kết thúc học kỳ 1 <span className="text-ink-muted">(không bắt buộc)</span>
        </Label>
        <Input
          id="academic-semester-1-end"
          name="semester1EndDate"
          type="date"
          key={`semester1-${state.values.semester1EndDate}`}
          defaultValue={state.values.semester1EndDate}
        />
        <p className="text-sm text-ink-muted">
          Mốc để cảnh báo lớp Dự trưởng đã hết học kỳ 1. Bỏ trống thì sửa sau cũng được.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="lock-days">Khóa điểm danh (ngày)</Label>
          <Input
            id="lock-days"
            name="attendanceLockDays"
            key={`lock-${state.values.attendanceLockDays}`}
            type="number"
            min="0"
            max="30"
            required
            defaultValue={state.values.attendanceLockDays}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lease-minutes">Phiên chỉnh sửa (phút)</Label>
          <Input
            id="lease-minutes"
            name="attendanceEditLeaseMinutes"
            key={`lease-${state.values.attendanceEditLeaseMinutes}`}
            type="number"
            min="1"
            max="60"
            required
            defaultValue={state.values.attendanceEditLeaseMinutes}
          />
        </div>
      </div>
      {/* `key` theo chính giá trị: ô đánh dấu cũng không tự nhận `defaultChecked`
          mới khi React dựng lại biểu mẫu ở pha lỗi — đúng cái bẫy đã làm hai ô
          CHỌN ở biểu mẫu "Thêm nhân sự" âm thầm quay về mặc định (M04-B). */}
      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input
          key={`top5-${state.values.top5Enabled}`}
          name="top5Enabled"
          type="checkbox"
          defaultChecked={state.values.top5Enabled}
          className="h-5 w-5 rounded border-border"
        />
        Bật tính năng Top 5 cho năm học
      </label>
      <SubmitButton />
    </form>
  );
}
