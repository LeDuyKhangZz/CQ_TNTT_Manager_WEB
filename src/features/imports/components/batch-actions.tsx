"use client";

import { useActionState, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormMessage } from "@/components/ui/form-message";
import type { ImportFeedback } from "../import-feedback";
import {
  cancelFormAction,
  commitFormAction,
  purgeRawFormAction,
} from "../server/actions";
import { useGlobalPending } from "@/components/loading/loading-provider";

/**
 * Ba thao tác của một lần nhập — M12-A, **TO-BE 1 + TO-BE 3**, đóng lỗi
 * CRITICAL 4.1 và 4.2.
 *
 * 🔴 Nút nguy hiểm nhất của hệ thống cũ nằm ở đây: *"Xoá lần nhập này"* đứng
 * **ngay cạnh** nút "Ghi", **không hỏi lại**, và xoá được cả lần nhập đã ghi
 * dữ liệu — cuốn theo mối nối "dòng nào tạo ra em nào" (`on delete cascade`).
 * Nay nút đó tách làm hai theo trạng thái, và **không nút nào xoá hàng nữa**:
 *
 *   · lần nhập **chưa ghi** → "Huỷ lần nhập" (D-131: đánh dấu, vẫn giữ lại);
 *   · lần nhập **đã ghi/đã huỷ** → "Xoá dữ liệu thô" (D-132: chỉ dọn `raw_json`).
 *
 * Cả ba đều có `ConfirmDialog` nêu hậu quả **bằng tên riêng** — tên file và số
 * dòng — đúng tiêu chí nghiệm thu chung (`11` §5) và điều cấm thứ 8
 * (không `window.confirm`).
 *
 * **Vẫn chạy khi chưa có JavaScript**: ba `<form action={…}>` thật, hộp xác nhận
 * chỉ chặn khi JS đã chạy. Cờ "đã xác nhận" là `useRef` chứ không phải state vì
 * `requestSubmit()` chạy đồng bộ trong cùng lượt xử lý sự kiện (đo được ở M02-A).
 */
type FormAction = (
  previous: ImportFeedback | null,
  formData: FormData,
) => Promise<ImportFeedback>;

function useConfirmedForm(action: FormAction) {
  const [feedback, formAction, pending] = useActionState<ImportFeedback | null, FormData>(
    action,
    null,
  );
  useGlobalPending(pending);
  const formRef = useRef<HTMLFormElement>(null);
  const confirmedRef = useRef(false);
  const [open, setOpen] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (confirmedRef.current) {
      confirmedRef.current = false;
      return;
    }
    event.preventDefault();
    setOpen(true);
  }

  function handleConfirm() {
    confirmedRef.current = true;
    setOpen(false);
    formRef.current?.requestSubmit();
  }

  return { feedback, formAction, pending, formRef, open, setOpen, handleSubmit, handleConfirm };
}

export function BatchActions({
  batchId,
  filename,
  status,
  pendingRows,
  totalRows,
  rawPurged,
}: {
  batchId: string;
  filename: string;
  status: string;
  /** Số dòng còn chờ ghi (`valid` + `warning`). */
  pendingRows: number;
  totalRows: number;
  rawPurged: boolean;
}) {
  const commit = useConfirmedForm(commitFormAction);
  const cancel = useConfirmedForm(cancelFormAction);
  const purge = useConfirmedForm(purgeRawFormAction);

  const isDryRun = status === "dry_run";
  const isCancelled = status === "cancelled";
  // 🔴 Lần nhập đã huỷ **vẫn còn dòng ở trạng thái chờ** — huỷ là đánh dấu, không
  // xoá (D-131). Nhưng `commit_import_rows` ném `BATCH_CANCELLED` ngay dòng đầu,
  // nên để nút "Ghi" ở đó là mời người dùng bấm một nút không bao giờ chạy —
  // đúng loại lỗi mà cả module này sinh ra để diệt.
  const canCommit = pendingRows > 0 && !isCancelled;

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-muted">
        {isCancelled
          ? `Lần nhập này đã huỷ nên ${pendingRows} dòng của nó sẽ không được ghi. Muốn nhập lại thì tải file lên lần nữa.`
          : pendingRows > 0
            ? `${pendingRows} dòng sẽ được ghi. Dòng lỗi không được ghi; hãy sửa file rồi tải lại.`
            : "Không còn dòng nào chờ ghi."}
      </p>

      <div className="flex flex-wrap gap-2">
        {canCommit ? (
          <form ref={commit.formRef} action={commit.formAction} onSubmit={commit.handleSubmit}>
            <input type="hidden" name="batchId" value={batchId} />
            <Button type="submit" pending={commit.pending}>
              {`Ghi ${pendingRows} dòng vào hệ thống`}
            </Button>
          </form>
        ) : null}

        {isDryRun ? (
          <form ref={cancel.formRef} action={cancel.formAction} onSubmit={cancel.handleSubmit}>
            <input type="hidden" name="batchId" value={batchId} />
            <Button type="submit" variant="outline" pending={cancel.pending}>
              Huỷ lần nhập
            </Button>
          </form>
        ) : null}

        {!isDryRun && !rawPurged ? (
          <form ref={purge.formRef} action={purge.formAction} onSubmit={purge.handleSubmit}>
            <input type="hidden" name="batchId" value={batchId} />
            <Button type="submit" variant="outline" pending={purge.pending}>
              Xoá dữ liệu thô
            </Button>
          </form>
        ) : null}
      </div>

      {/* AC-15 — kết quả ghi phải hiện ra, kèm TỪNG dòng lỗi chứ không chỉ con số. */}
      {commit.feedback ? (
        <div className="space-y-2">
          <FormMessage tone={commit.feedback.tone}>{commit.feedback.text}</FormMessage>
          {commit.feedback.failures && commit.feedback.failures.length > 0 ? (
            <ul className="list-disc space-y-1 pl-5 text-sm text-ink">
              {commit.feedback.failures.map((failure) => (
                <li key={failure.rowNumber}>
                  <strong>#{failure.rowNumber}</strong> — {failure.message}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      {cancel.feedback ? (
        <FormMessage tone={cancel.feedback.tone}>{cancel.feedback.text}</FormMessage>
      ) : null}
      {purge.feedback ? (
        <FormMessage tone={purge.feedback.tone}>{purge.feedback.text}</FormMessage>
      ) : null}

      {rawPurged ? (
        <p className="text-sm text-ink-muted">
          Dữ liệu thô của lần nhập này đã được xoá. Hồ sơ đã tạo và mối nối &quot;dòng nào tạo ra em
          nào&quot; vẫn còn.
        </p>
      ) : null}

      <ConfirmDialog
        open={commit.open}
        onClose={() => commit.setOpen(false)}
        onConfirm={commit.handleConfirm}
        pending={commit.pending}
        tone="primary"
        title={`Ghi ${pendingRows} dòng vào hệ thống?`}
        confirmLabel={`Ghi ${pendingRows} dòng`}
        consequence={
          <p>
            Hệ thống sẽ tạo hoặc ghép <strong>{pendingRows}</strong> hồ sơ thiếu nhi từ file{" "}
            <strong>{filename}</strong> và ghi danh các em vào lớp tương ứng. Hồ sơ đã tạo{" "}
            <strong>không xoá được</strong>; muốn sửa phải sửa từng hồ sơ ở trang Thiếu nhi.
          </p>
        }
      />

      <ConfirmDialog
        open={cancel.open}
        onClose={() => cancel.setOpen(false)}
        onConfirm={cancel.handleConfirm}
        pending={cancel.pending}
        title="Huỷ lần nhập này?"
        // Nhãn khác nút mở: hai nút cùng tên trong một trang là hai thứ trình
        // đọc màn hình đọc lên giống hệt nhau.
        confirmLabel="Xác nhận huỷ"
        consequence={
          <p>
            <strong>{totalRows}</strong> dòng đã kiểm tra của file <strong>{filename}</strong> sẽ
            không được ghi vào hệ thống. Lần nhập vẫn được giữ lại trong danh sách với nhãn
            &quot;Đã huỷ&quot; để tra cứu; muốn nhập lại thì tải file lên lần nữa.
          </p>
        }
      />

      <ConfirmDialog
        open={purge.open}
        onClose={() => purge.setOpen(false)}
        onConfirm={purge.handleConfirm}
        pending={purge.pending}
        title="Xoá dữ liệu thô của lần nhập này?"
        confirmLabel="Xác nhận xoá"
        consequence={
          <p>
            Bản chép nguyên văn các ô Excel của file <strong>{filename}</strong> — họ tên, ngày
            sinh, địa chỉ, số điện thoại, ghi chú sức khoẻ — sẽ bị xoá khỏi hệ thống và{" "}
            <strong>không khôi phục được</strong>. Hồ sơ đã tạo và mối nối &quot;dòng nào tạo ra em
            nào&quot; vẫn được giữ nguyên.
          </p>
        }
      />
    </div>
  );
}
