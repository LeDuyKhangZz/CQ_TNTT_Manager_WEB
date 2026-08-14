"use client";

import { useActionState, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { enrollmentStatusLabel } from "@/features/enrollments/enrollment-status";
import { STUDENT_STATUS_LABELS } from "../student-status";
import {
  isClosingStudentStatus,
  STUDENT_CLOSE_REASONS,
  STUDENT_STATUS_CHOICES,
  studentStatusConsequence,
} from "../student-lifecycle";
import type { StudentFeedback } from "../student-feedback";
import { setStudentStatusFormAction } from "../server/actions";
import { useGlobalPending } from "@/components/loading/loading-provider";

/**
 * Khối "Trạng thái hồ sơ" — M03-C, **TB-F06 / BR-M03-N12·N14 / D-130**.
 *
 * 🔴 **Đây là khối tách ra khỏi biểu mẫu "Cập nhật hồ sơ".** Trước đợt này ô
 * "Trạng thái" nằm ngay cạnh ô "Điện thoại", chung một nút "Lưu thay đổi" —
 * điểm trừ C5 = 2 của biên bản audit. Nghĩa là **lưu trữ một em là một cú chọn
 * nhầm trong `<select>`, không hỏi gì**, và điều duy nhất xảy ra sau đó là
 * `students.status` đổi giá trị: em vẫn nằm trong sĩ số, vẫn có tên trong danh
 * sách điểm danh, Giáo lý viên vẫn đọc được hồ sơ sức khoẻ của em (5W-F06).
 *
 * Nay là một thao tác riêng, có hộp xác nhận nêu **tên em và tên lớp**, và
 * đằng sau nó là một RPC đổi **cả hai trục trong một giao dịch**.
 *
 * **Vẫn chạy khi chưa có JavaScript** (`09` §11): đây là `<form action={…}>`
 * thật, ô "Đồng thời kết thúc ghi danh" là `<input type="checkbox">` thật. Hộp
 * xác nhận chỉ chặn khi JS đã chạy; cờ "đã xác nhận" là `useRef` chứ không phải
 * state vì `requestSubmit()` chạy đồng bộ trong cùng lượt xử lý sự kiện
 * (bài học đo được ở M02-A).
 */
export function StudentStatusPanel({
  studentId,
  studentName,
  currentStatus,
  openClassName,
  canArchive,
  today,
}: {
  studentId: string;
  studentName: string;
  currentStatus: string;
  /** Tên lớp của ghi danh đang mở; `null` khi em không có ghi danh nào mở. */
  openClassName: string | null;
  /** `docs/05` §5 — chỉ bốn vai trò xứ đoàn mới đặt được "Đã rút"/"Lưu trữ". */
  canArchive: boolean;
  today: string;
}) {
  const [feedback, formAction, pending] = useActionState<StudentFeedback | null, FormData>(
    setStudentStatusFormAction,
    null,
  );
  useGlobalPending(pending);

  const formRef = useRef<HTMLFormElement>(null);
  const confirmedRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [nextStatus, setNextStatus] = useState(currentStatus);
  const [pendingReason, setPendingReason] = useState<string>(STUDENT_CLOSE_REASONS[0]);

  const closing = isClosingStudentStatus(nextStatus);
  const choices = canArchive
    ? STUDENT_STATUS_CHOICES
    : STUDENT_STATUS_CHOICES.filter((value) => !isClosingStudentStatus(value));

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (confirmedRef.current) {
      confirmedRef.current = false;
      return;
    }
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setNextStatus(String(data.get("status") ?? currentStatus));
    setPendingReason(String(data.get("reason") ?? STUDENT_CLOSE_REASONS[0]));
    setOpen(true);
  }

  function handleConfirm() {
    confirmedRef.current = true;
    setOpen(false);
    formRef.current?.requestSubmit();
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={handleSubmit}
      aria-label={`Trạng thái hồ sơ của ${studentName}`}
      className="space-y-3"
    >
      <input type="hidden" name="studentId" value={studentId} />

      <div className="space-y-2">
        <Label htmlFor="status-next">Trạng thái hồ sơ</Label>
        <Select
          id="status-next"
          name="status"
          defaultValue={currentStatus}
          onChange={(event) => setNextStatus(event.target.value)}
        >
          {choices.map((value) => (
            <option key={value} value={value}>
              {STUDENT_STATUS_LABELS[value]}
            </option>
          ))}
        </Select>
      </div>

      {/*
        BR-M03-N12 / AC-F06-01 — cảnh báo nêu **tên lớp** và ô chọn "Đồng thời
        kết thúc ghi danh". Chỉ hiện khi thật sự có ghi danh đang mở: hiện luôn
        là mời người dùng tick một ô không có tác dụng, rồi lần sau họ tick nó
        theo phản xạ.
      */}
      {closing && openClassName ? (
        <div className="space-y-3 rounded-md border border-line-strong bg-surface-muted p-3">
          <p className="text-sm">
            {studentName} vẫn đang ghi danh ở lớp <strong>{openClassName}</strong>. Hồ sơ chỉ
            chuyển sang &quot;{STUDENT_STATUS_LABELS[nextStatus]}&quot; khi ghi danh này được kết
            thúc.
          </p>
          <label
            className="flex min-h-11 items-center gap-2 text-sm"
            htmlFor="status-close-enrollment"
          >
            <input
              id="status-close-enrollment"
              name="closeEnrollment"
              type="checkbox"
              className="h-4 w-4"
            />
            Đồng thời kết thúc ghi danh ở lớp {openClassName}
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="status-reason">Lý do kết thúc</Label>
              <Select id="status-reason" name="reason" defaultValue={STUDENT_CLOSE_REASONS[0]}>
                {STUDENT_CLOSE_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {enrollmentStatusLabel(reason)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status-ended-on">Ngày kết thúc</Label>
              <Input id="status-ended-on" name="endedOn" type="date" defaultValue={today} />
            </div>
          </div>
        </div>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Đang lưu…" : "Đổi trạng thái hồ sơ"}
      </Button>
      {feedback ? <FormMessage tone={feedback.tone}>{feedback.text}</FormMessage> : null}

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
        pending={pending}
        title={`Đổi trạng thái hồ sơ của ${studentName}?`}
        confirmLabel="Đổi trạng thái"
        tone={closing ? "danger" : "primary"}
        consequence={
          <p>{studentStatusConsequence(nextStatus, studentName, openClassName, pendingReason)}</p>
        }
      />
    </form>
  );
}
