"use client";

import { useActionState, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { FormMessage } from "@/components/ui/form-message";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { ImportFeedback } from "../import-feedback";
import {
  checkUploadSize,
  formatRowCount,
  MAX_IMPORT_ROWS,
  MAX_UPLOAD_LABEL,
} from "../limits";
import type { ClassOption } from "../server/queries";
import { uploadFormAction } from "../server/actions";
import { useGlobalLoading, useGlobalPending } from "@/components/loading/loading-provider";

/**
 * Biểu mẫu tải file — M12-A, **TO-BE 1 / AC-13 · AC-14**, đóng lỗi CRITICAL 4.1.
 *
 * 🔴 Trước đợt này bấm "Kiểm tra file" xong **màn hình không đổi một chữ nào**:
 * adapter `uploadAction` gọi `createDryRunBatch` rồi vứt kết quả, nên file hỏng
 * và file tốt trông giống hệt nhau. Người dùng phải tự cuộn xuống danh sách
 * "Lần nhập gần đây" để đoán xem có gì mới không.
 *
 * Nay: hỏng thì đọc được **lý do cụ thể** (câu chữ đã có sẵn ở `parse.ts` từ
 * Phase 2), tốt thì vào thẳng trang của lần nhập vừa tạo.
 *
 * **Vẫn chạy khi chưa có JavaScript** (`09` §11 — máy yếu, mạng phòng học kém):
 * đây là `<form action={…}>` thật với `<input type="file">` thật; `useActionState`
 * chỉ thêm phần hiện thông điệp và trạng thái "đang chạy".
 *
 * 🔴 **M12-C thêm một phép kiểm chạy TRƯỚC khi gửi, và đó không phải trang trí**
 * (TO-BE 8 / NC-01 / D-137). Vercel chặn thân request nặng hơn ~4,5 MB **ở tầng
 * hạ tầng**, trước khi Server Action chạy — nên với file 4,5 MB trở lên, câu
 * tiếng Việt của `createDryRunBatch` **không có đường nào** hiện ra. Phép kiểm
 * phía trình duyệt là thứ duy nhất còn chặn được trang lỗi tiếng Anh ấy. Nó
 * **không** thay hàng rào máy chủ: người gọi thẳng Server Action không đi qua
 * biểu mẫu, nên cả hai phía cùng gọi `checkUploadSize` của `limits.ts`.
 */
export function ImportUploadForm({
  yearCode,
  classOptions,
}: {
  yearCode: string;
  classOptions: readonly ClassOption[];
}) {
  const router = useRouter();
  const [feedback, formAction, pending] = useActionState<ImportFeedback | null, FormData>(
    uploadFormAction,
    null,
  );
  useGlobalPending(pending);
  /** Câu chặn của phía trình duyệt. Tách khỏi `feedback` vì lượt gửi không xảy ra. */
  const [localError, setLocalError] = useState<string | null>(null);

  // File tốt thì đi thẳng vào trang của lần nhập vừa tạo. `pending` đã tắt lúc
  // Server Action trả về, nên lượt tải trang mới là một khoảng chờ KHÔNG có chủ
  // — phải tự khai báo (`17` §3.4).
  const { beginNavigation } = useGlobalLoading();

  useEffect(() => {
    if (!feedback?.navigateTo) return;
    beginNavigation();
    router.push(feedback.navigateTo);
  }, [feedback, router, beginNavigation]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const field = event.currentTarget.elements.namedItem("file");
    const file = field instanceof HTMLInputElement ? field.files?.[0] : undefined;
    const tooLarge = file ? checkUploadSize(file.size) : null;
    if (tooLarge) {
      event.preventDefault();
      setLocalError(tooLarge);
      return;
    }
    setLocalError(null);
  }

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      className="space-y-4"
      aria-label="Tải file Excel lên"
    >
      <p className="text-sm text-ink-muted">
        Dữ liệu sẽ được ghi danh vào năm học <strong>{yearCode}</strong>. Hệ thống đọc được file mẫu
        chuẩn, sheet <strong>SYLL</strong> hoặc sheet <strong>DS_dau_nam</strong> của sổ lớp. Bước
        tải lên chỉ kiểm tra, chưa ghi gì vào hệ thống.
      </p>

      {/*
        Đợt D (`17` §6) — `<input type="file">` trần cuối cùng của `src/` đi sang
        `FileUpload`, primitive đã có từ mục 0.8 mà đến nay mới **một** chỗ dùng.

        🔴 TO-BE 8 vẫn nguyên: **cả hai cái trần** nói ra NGAY TRÊN Ô CHỌN FILE,
        trước khi người dùng tải. Chỗ nói đổi từ **thân nhãn** sang dòng chú thích
        `aria-describedby` ngay dưới ô — đúng chỗ của nó: nhãn là TÊN của ô, giới
        hạn là MÔ TẢ. Trình đọc màn hình vẫn đọc đủ cả hai, và bài kiểm canh đúng
        vế ấy (`import-upload-form.test.tsx`).

        Cố ý **không** truyền `maxSizeMb`: phép kiểm dung lượng của biểu mẫu này
        là `checkUploadSize` ở `limits.ts` — cùng một hàm với máy chủ, và câu chữ
        của nó nói ra cả cỡ file thật lẫn việc phải làm. Bật thêm phép kiểm sẵn có
        của `FileUpload` là hiện **hai** câu từ chối cho cùng một lượt.

        `accept` chỉ mang phần đuôi, không mang MIME: `FileUpload` in chính chuỗi
        ấy ra màn hình, mà `application/vnd.openxmlformats-…sheet` thì đúng kỹ
        thuật và vô nghĩa với Giáo lý viên (cùng lý do đã ghi ở
        `teaching-plans/constants.ts`). Máy chủ vẫn tự kiểm lại định dạng.
      */}
      <FileUpload
        id="import-file"
        name="file"
        label="File Excel"
        accept=".xlsx"
        required
        // 🔴 Chữ "tối đa" viết THƯỜNG, và đó không phải chuyện thẩm mỹ: câu này
        // giữ nguyên từng ký tự của nửa sau nhãn cũ, nên `imports.spec.ts:530`
        // (`getByText` phân biệt hoa–thường) không phải đổi. Bản đầu viết hoa
        // "Tối đa" và **đo được**: 3 bài E2E đỏ ở cả ba viewport.
        hint={`tối đa ${MAX_UPLOAD_LABEL} và ${formatRowCount(MAX_IMPORT_ROWS)} dòng`}
      />

      <div className="space-y-2">
        <Label htmlFor="classId">Lớp đích (nếu file không có cột lớp)</Label>
        <Select id="classId" name="classId" defaultValue="">
          <option value="">— Lấy theo cột lớp trong file —</option>
          {classOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.displayName}
            </option>
          ))}
        </Select>
        <p className="text-xs text-ink-muted">
          Sổ lớp Chiên Con không có cột lớp — hãy chọn lớp ở đây. Dòng nào đã ghi lớp trong file thì
          vẫn ưu tiên giá trị trong file.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" pending={pending}>
          Kiểm tra file
        </Button>
        {/* This is a file download served by a route handler, not a page:
            next/link would client-navigate and break it. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/imports/template"
          download
          className="inline-flex h-control min-h-control items-center justify-center rounded-md border border-line-strong bg-surface px-4 text-sm font-medium text-ink transition-colors hover:bg-surface-muted"
        >
          Tải file mẫu
        </a>
      </div>

      {localError ? (
        <FormMessage tone="danger">{localError}</FormMessage>
      ) : feedback ? (
        <FormMessage tone={feedback.tone}>{feedback.text}</FormMessage>
      ) : null}
    </form>
  );
}
