"use client";

import { useActionState, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { closeAcademicYearFormAction } from "@/features/academic-years/server/actions";
import type { AdminFeedback } from "@/features/academic-years/admin-feedback";
import { openWorkPhrases, type AcademicYearOpenWork } from "@/features/academic-years/year-lifecycle";

export interface CloseYearPanelProps {
  academicYearId: string;
  /** Mã năm học THẬT — chuỗi người dùng phải gõ lại (BR-M02-N08). */
  code: string;
  name: string;
  /** Bảng kiểm do cơ sở dữ liệu đếm. `null` = không đọc được, KHÔNG phải "đã xong". */
  openWork: AcademicYearOpenWork | null;
}

/**
 * Khối "Đóng năm học" — **I7 / TB-F09 / D-73**, quy trình WF-16.
 *
 * Trước đợt này việc chốt sổ cuối năm **không có màn hình nào**: năm học chỉ rơi
 * sang "Đã đóng" như tác dụng phụ của thao tác đặt năm mới thành hiện hành. Nghĩa là
 * người phụ trách không bao giờ được hỏi *"còn 37 em đang ghi danh, chốt sổ luôn
 * chứ?"*, và sáu tháng sau không ai biết năm học bị chốt lúc nào, vì sao.
 *
 * Ba lớp ma sát, tương xứng với một thao tác **một chiều** (hệ thống không có luồng
 * mở lại năm học):
 *   1. Bảng kiểm nêu **con số thật** do cơ sở dữ liệu đếm, không phải trang tự đếm.
 *   2. Phải **gõ lại đúng mã năm học** — cùng luật so ở cả hai phía.
 *   3. `ConfirmDialog` nêu hậu quả **bằng tên riêng** (`11` §5), gồm cả điều dễ bị
 *      bỏ qua nhất: sau khi đóng, hệ thống **không còn năm học hiện hành nào**.
 *
 * Nút bị khoá KHÔNG phải biện pháp bảo vệ (09: "ẩn nút không phải authorization") —
 * chốt chặn thật là `public.close_academic_year`, nơi kiểm quyền Super Admin, mã gõ
 * lại, trạng thái năm, bảng kiểm và lý do, trong một giao dịch có khoá dòng.
 *
 * 🔴 Vẫn là `<form action={…}>` thật + `useActionState`, **không** `redirect()`:
 * D-114 / nợ #16 — chuyển hướng về chính route đang đứng làm Next 15.5 bỏ luôn lượt
 * dựng lại trang. Không có JavaScript thì bấm là gửi ngay: mất hộp xác nhận nhưng
 * **không mất thao tác**, và hai lớp ma sát còn lại (gõ mã, lý do) đều được cơ sở dữ
 * liệu kiểm nên vẫn còn nguyên hiệu lực.
 */
export function CloseYearPanel({ academicYearId, code, name, openWork }: CloseYearPanelProps) {
  const [feedback, formAction, pending] = useActionState<AdminFeedback | null, FormData>(
    closeAcademicYearFormAction,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const confirmedRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [confirmCode, setConfirmCode] = useState("");
  const [reason, setReason] = useState("");

  const phrases = openWork ? openWorkPhrases(openWork) : [];
  const hasOpenWork = phrases.length > 0;
  const codeMatches = confirmCode.trim() === code.trim();
  // Còn việc tồn đọng ⇒ phải có lý do. Luật này được cơ sở dữ liệu kiểm
  // (`CLOSE_REASON_REQUIRED`); ở đây chỉ để nút không mời người dùng bấm một lượt
  // chắc chắn bị từ chối.
  const reasonReady = !hasOpenWork || reason.trim().length > 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (confirmedRef.current) {
      confirmedRef.current = false;
      return;
    }
    event.preventDefault();
    setOpen(true);
  }

  // `useRef`, không phải state: `requestSubmit()` chạy đồng bộ ngay trong cùng lượt
  // xử lý sự kiện nên `setState` chưa kịp có hiệu lực (bài học M02-A).
  function handleConfirm() {
    confirmedRef.current = true;
    setOpen(false);
    formRef.current?.requestSubmit();
  }

  return (
    <form ref={formRef} action={formAction} onSubmit={handleSubmit} className="space-y-3">
      <input type="hidden" name="academicYearId" value={academicYearId} />

      <div className="space-y-1 text-sm">
        {openWork === null ? (
          <p className="text-ink-muted">
            Chưa đọc được bảng kiểm việc tồn đọng. Hãy tải lại trang trước khi chốt sổ.
          </p>
        ) : hasOpenWork ? (
          <>
            <p className="text-ink">Năm học còn việc tồn đọng:</p>
            <ul className="list-disc space-y-1 pl-5 text-ink-muted">
              {phrases.map((phrase) => (
                <li key={phrase}>{phrase}</li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-ink-muted">
            Không còn việc tồn đọng: mọi ghi danh đã kết thúc, bảng điểm đã khoá, buổi
            điểm danh đã chốt.
          </p>
        )}
      </div>

      {hasOpenWork ? (
        <div className="space-y-1">
          <Label htmlFor="close-reason">Lý do chốt sổ khi còn việc tồn đọng</Label>
          <Textarea
            id="close-reason"
            name="reason"
            rows={2}
            maxLength={500}
            value={reason}
            placeholder="Ví dụ: đã hết năm học; 1 em chuyển giáo xứ chưa kịp kết thúc ghi danh."
            onChange={(event) => setReason(event.target.value)}
          />
        </div>
      ) : (
        <input type="hidden" name="reason" value="" />
      )}

      <div className="space-y-1">
        <Label htmlFor="close-confirm-code">
          Gõ lại mã năm học để mở nút chốt sổ: <strong>{code}</strong>
        </Label>
        <Input
          id="close-confirm-code"
          name="confirmCode"
          autoComplete="off"
          inputMode="numeric"
          value={confirmCode}
          placeholder={code}
          onChange={(event) => setConfirmCode(event.target.value)}
        />
      </div>

      <Button
        type="submit"
        variant="danger"
        size="sm"
        disabled={!codeMatches || !reasonReady || openWork === null || pending}
      >
        {pending ? "Đang chốt sổ…" : "Đóng năm học"}
      </Button>

      {feedback ? <FormMessage tone={feedback.tone}>{feedback.text}</FormMessage> : null}

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
        pending={pending}
        title="Chốt sổ năm học này?"
        confirmLabel="Chốt sổ năm học"
        tone="danger"
        consequence={
          <>
            <p>
              <strong>{name}</strong> sẽ chuyển sang <strong>Đã đóng</strong>. Từ đó chỉ{" "}
              <strong>Quản trị viên hệ thống</strong> còn ghi danh và sửa cài đặt lớp được
              trong năm này; mọi vai trò khác chỉ đọc.
            </p>
            {hasOpenWork ? (
              <p className="mt-2 font-medium text-danger">
                Năm học còn {phrases.join(" · ")}. Chốt sổ bây giờ là khoá luôn những việc
                đó lại.
              </p>
            ) : null}
            <p className="mt-2">
              Sau khi chốt sổ, hệ thống <strong>không còn năm học hiện hành nào</strong> —
              chưa ghi danh hay điểm danh được cho tới khi bạn đặt một năm học khác thành
              hiện hành.
            </p>
          </>
        }
      />
    </form>
  );
}
