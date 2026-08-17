"use client";

import Link from "next/link";
import { useActionState, useRef, useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DateField } from "@/components/ui/date-field";
import { FormMessage } from "@/components/ui/form-message";
import { Select } from "@/components/ui/select";
import {
  CLOSE_ENROLLMENT_REASONS,
  closeReasonConsequence,
  enrollmentStatusBadgeVariant,
  enrollmentStatusLabel,
} from "../enrollment-status";
import type { EnrollmentFeedback } from "../enrollment-feedback";
import { enrollmentRowFormAction } from "../server/actions";
import { useGlobalPending } from "@/components/loading/loading-provider";
import { Panel } from "@/components/ui/card";

/**
 * Một dòng trong danh sách thiếu nhi của lớp — M03-A, TB-F10 / AC-F10-01…03.
 *
 * **Trước đợt này**, cả ba việc nằm chung trong *một* biểu mẫu tên "Kết thúc": ô
 * chọn lý do có lẫn "Tạm nghỉ", một ô ngày bắt buộc, và một nút. Ba hệ quả:
 *
 *   1. Chọn "Tạm nghỉ" **luôn thất bại im lặng** — biểu mẫu luôn gửi kèm ngày kết
 *      thúc, mà `paused` là trạng thái mở nên CHECK cấm có ngày (lỗi CRITICAL F10).
 *   2. Nút "Kết thúc" nằm ngay cạnh tên từng em, **không xác nhận** (C5 = 1 trong
 *      biên bản audit) — một cú bấm nhầm là em rời lớp.
 *   3. Trạng thái của em **không hiện ở đâu cả**, nên kể cả khi "Tạm nghỉ" chạy
 *      được thì cũng không ai nhìn ra em nào đang tạm nghỉ.
 *
 * Nay tách làm ba thao tác đúng như `docs/11` §3 yêu cầu từ đầu, mỗi thao tác một
 * biểu mẫu riêng: **Tạm nghỉ** · **Khôi phục** · **Kết thúc** (có hộp xác nhận nêu
 * tên em và tên lớp).
 *
 * **Vẫn chạy khi chưa có JavaScript** (09 §11): cả ba là `<form action={…}>` thật.
 * Hộp xác nhận chỉ chặn khi JS đã chạy — không có JS thì bấm là gửi ngay, mất hộp
 * xác nhận nhưng **không mất thao tác**. Cờ "đã xác nhận" là `useRef` chứ không phải
 * state, vì `requestSubmit()` chạy đồng bộ trong cùng lượt xử lý sự kiện nên
 * `setState` chưa kịp có hiệu lực (bài học đo được ở M02-A).
 */
export function RosterRow({
  enrollmentId,
  studentId,
  studentName,
  className,
  status,
  today,
  canManage,
  pendingPromotion,
}: {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  /** Tên lớp — hộp xác nhận phải nêu hậu quả **bằng tên riêng** (`11` §5). */
  className: string;
  status: string;
  today: string;
  canManage: boolean;
  /**
   * **BR-M08-20 / D-158 (M08-B)** — em đang có đề xuất chuyển lớp chờ duyệt.
   *
   * `04_TO_BE_FLOWS` TO-BE 5 đòi *"hiển thị badge và **ẩn form kết thúc**"*. Ẩn
   * chứ không phải để nút đó bấm rồi báo lỗi: đây là một tình huống **đọc được
   * trước khi bấm**, và một nút chỉ dẫn tới câu từ chối là một nút nói dối. Hai
   * hàng rào thật vẫn nằm ở Server Action và ở trigger cơ sở dữ liệu — ẩn biểu
   * mẫu không phải authorization (`AGENTS` §5).
   */
  pendingPromotion: boolean;
}) {
  /*
    🔴 MỘT `useActionState` cho cả ba nút, không phải ba cái riêng.

    Bản đầu của đợt này dùng ba, rồi hiển thị câu đầu tiên khác `null`. Nhưng
    `useActionState` GIỮ LẠI kết quả của lượt trước, nên sau khi bấm "Tạm nghỉ" rồi
    "Khôi phục", dòng thông báo vẫn đứng ở câu "Đã chuyển … sang Tạm nghỉ" — nói sai
    trạng thái hiện tại của em. E2E bắt được ở cả ba viewport. Một trạng thái duy
    nhất thì câu chữ luôn là kết quả của thao tác vừa làm.
  */
  const [feedback, formAction, pending] = useActionState<EnrollmentFeedback | null, FormData>(
    enrollmentRowFormAction,
    null,
  );
  useGlobalPending(pending);

  const closeFormRef = useRef<HTMLFormElement>(null);
  const confirmedRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [pendingReason, setPendingReason] = useState<string>(CLOSE_ENROLLMENT_REASONS[0]);

  const paused = status === "paused";

  function handleCloseSubmit(event: FormEvent<HTMLFormElement>) {
    if (confirmedRef.current) {
      confirmedRef.current = false;
      return;
    }
    event.preventDefault();
    setPendingReason(String(new FormData(event.currentTarget).get("status") ?? "withdrawn"));
    setOpen(true);
  }

  function handleConfirm() {
    confirmedRef.current = true;
    setOpen(false);
    closeFormRef.current?.requestSubmit();
  }

  return (
    /*
      `<li>` chứ không phải `<div>`: danh sách thiếu nhi của lớp **là** một danh
      sách, và trình đọc màn hình nên nghe được "danh sách 28 mục" trước khi đọc
      từng em. Bản cũ là một chồng `<div>` nên người dùng bàn phím không biết mình
      đang ở đâu trong danh sách.
    */
    <Panel as="li">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/students/${studentId}`} className="text-sm font-medium hover:underline">
            {studentName}
          </Link>
          {/*
            Điều cấm thứ 5 — không dùng màu làm tín hiệu duy nhất: huy hiệu mang
            **chữ** "Tạm nghỉ". Em đang học là chuyện thường ngày nên không gắn huy
            hiệu, cùng lý do đã ghi ở `needsStatusBadge` của M02-B: gắn lên tất cả
            thì huy hiệu mất giá trị báo hiệu đúng lúc cần nó nhất.
          */}
          {status !== "active" ? (
            <Badge variant={enrollmentStatusBadgeVariant(status)}>
              {enrollmentStatusLabel(status)}
            </Badge>
          ) : null}
          {/* Huy hiệu mang **chữ**, không chỉ màu (điều cấm thứ 5 của `11` §5) —
              và nó là thứ giải thích vì sao nút "Kết thúc" biến mất ở dòng này. */}
          {pendingPromotion ? (
            <Badge variant="warning">Chờ duyệt chuyển lớp</Badge>
          ) : null}
        </div>

        {canManage ? (
          <div className="flex flex-wrap items-end gap-2">
            {paused ? (
              <form action={formAction}>
                <input type="hidden" name="enrollmentId" value={enrollmentId} />
                <input type="hidden" name="intent" value="resume" />
                <Button type="submit" variant="outline" size="sm" pending={pending}>
                  Khôi phục
                </Button>
              </form>
            ) : (
              <form action={formAction}>
                <input type="hidden" name="enrollmentId" value={enrollmentId} />
                <input type="hidden" name="intent" value="pause" />
                <Button type="submit" variant="outline" size="sm" pending={pending}>
                  Tạm nghỉ
                </Button>
              </form>
            )}

            {pendingPromotion ? (
              // Nói ra **việc phải làm**, không im lặng bỏ nút đi: một biểu mẫu
              // biến mất mà không giải thích cũng khó hiểu ngang một nút không ăn.
              <p className="text-xs text-ink-muted">
                Kết thúc ghi danh sau khi xử lý đề xuất chuyển lớp.
              </p>
            ) : (
            <form
              ref={closeFormRef}
              action={formAction}
              onSubmit={handleCloseSubmit}
              className="flex flex-wrap items-end gap-2"
            >
              <input type="hidden" name="enrollmentId" value={enrollmentId} />
              <input type="hidden" name="intent" value="close" />
              <Select
                name="status"
                defaultValue="withdrawn"
                className="w-36 text-xs"
                aria-label={`Lý do kết thúc ghi danh của ${studentName}`}
              >
                {CLOSE_ENROLLMENT_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {enrollmentStatusLabel(reason)}
                  </option>
                ))}
              </Select>
              <DateField
                name="endedOn"
                defaultValue={today}
                className="w-40"
                aria-label={`Ngày kết thúc ghi danh của ${studentName}`}
                required
              />
              <Button type="submit" variant="outline" size="sm" pending={pending}>
                Kết thúc
              </Button>
            </form>
            )}
          </div>
        ) : null}
      </div>

      {feedback ? (
        <FormMessage tone={feedback.tone} className="mt-2">
          {feedback.text}
        </FormMessage>
      ) : null}

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
        pending={pending}
        title={`Kết thúc ghi danh của ${studentName}?`}
        confirmLabel="Kết thúc ghi danh"
        tone="danger"
        consequence={<p>{closeReasonConsequence(pendingReason, studentName, className)}</p>}
      />
    </Panel>
  );
}
