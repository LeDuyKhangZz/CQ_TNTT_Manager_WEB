"use client";

import * as React from "react";
import { Button } from "./button";
import { Dialog } from "./dialog";

/**
 * Xác nhận thao tác — 05 §3.3 #3 và §5.1, SW-06.
 *
 * 🔴 `consequence` là BẮT BUỘC và phải nêu hậu quả BẰNG TÊN RIÊNG:
 * tên em, tên lớp, số người nhận, số dòng — không phải "Bạn có chắc không?".
 * Tiêu chí nghiệm thu chung (11 §5): "thao tác nguy hiểm có ConfirmDialog nêu
 * hậu quả bằng tên riêng".
 *
 * Bắt buộc dùng thay `window.confirm` (điều cấm thứ 8) khi thao tác:
 * không hoàn tác được · ảnh hưởng người khác · đổi quyền.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  consequence,
  confirmLabel = "Xác nhận",
  cancelLabel = "Huỷ",
  tone = "danger",
  pending = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  /** Hậu quả cụ thể, nêu bằng tên riêng. Ví dụ: "Kết thúc ghi danh của **Maria
   *  Nguyễn Thị A** ở lớp **Ấu 2A**. Thao tác này không hoàn tác được." */
  consequence: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  pending?: boolean;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={consequence}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
            pending={pending}
          >
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
