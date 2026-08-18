"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useGlobalLoading, useGlobalPending } from "@/components/loading/loading-provider";
import type { ImportFeedback } from "../import-feedback";
import { pasteFormAction } from "../server/actions";
import { ImportTargetFields, type ImportTargetProps } from "./import-target-fields";

/**
 * Nhập bằng **dán văn bản** — IMP-BULK-001.
 *
 * 🔴 Vì sao cần đường này khi đã có đường tải file: sổ của giáo xứ nằm rải ở
 * ~40 file Excel với bố cục khác nhau, và danh sách lên lớp năm mới **chỉ có
 * tên** — không file nào trong số đó tải thẳng lên được. Dữ liệu đã trích và gộp
 * sẵn thành các khối văn bản (`NH_2025-2026/NHAP_LIEU_HANG_LOAT.md`); bắt người
 * nhập chép ngược từng khối vào một file `.xlsx` chỉ để tải lên là thêm một bước
 * sai chính tả không cần thiết.
 *
 * Sau khi bấm, khối dán đi qua **đúng** màn hình duyệt của đường file: vẫn
 * dry-run, vẫn chọn giới tính hàng loạt, vẫn xác nhận từng dòng trùng (D-133).
 */
export function ImportPasteForm({ years, classOptionsByYear, defaultYearId }: ImportTargetProps) {
  const router = useRouter();
  const [feedback, formAction, pending] = useActionState<ImportFeedback | null, FormData>(
    pasteFormAction,
    null,
  );
  useGlobalPending(pending);
  const { beginNavigation } = useGlobalLoading();

  useEffect(() => {
    if (!feedback?.navigateTo) return;
    beginNavigation();
    router.push(feedback.navigateTo);
  }, [feedback, router, beginNavigation]);

  return (
    <form action={formAction} className="space-y-4" aria-label="Dán dữ liệu để nhập">
      <p className="text-sm text-ink-muted">
        Dán một bảng có <strong>dòng tiêu đề cột</strong> rồi mỗi em một dòng. Các cột cách nhau bằng
        phím Tab (khi chép từ Excel) hoặc dấu <code>|</code>. Tên cột dùng đúng chữ như trong file
        mẫu: <em>Tên Thánh · Họ và tên · Giới tính · Ngày tháng năm sinh · Lớp · SĐT cha · SĐT mẹ</em>
        … Bước này chỉ kiểm tra, chưa ghi gì vào hệ thống.
      </p>

      <div className="space-y-2">
        <Label htmlFor="paste-label">Tên gọi của lần nhập</Label>
        <Input
          id="paste-label"
          name="label"
          placeholder="Ví dụ: Ấu 1A — năm 2025-2026"
          maxLength={200}
        />
        <p className="text-xs text-ink-muted">
          Dùng để tìm lại lần nhập này trong danh sách bên dưới. Để trống thì ghi là “Dán văn bản”.
        </p>
      </div>

      <ImportTargetFields
        idPrefix="paste"
        years={years}
        classOptionsByYear={classOptionsByYear}
        defaultYearId={defaultYearId}
      />

      <div className="space-y-2">
        <Label htmlFor="paste-text">Dữ liệu</Label>
        <Textarea
          id="paste-text"
          name="pastedText"
          required
          rows={12}
          spellCheck={false}
          className="font-mono text-xs"
          placeholder={
            "Tên Thánh | Họ và tên | Giới tính | Ngày tháng năm sinh | SĐT mẹ | Lớp\n" +
            "Maria | Nguyễn Trúc Anh | Nữ | 04/12/2019 | 0909123456 | Ấu 1A"
          }
        />
      </div>

      <Button type="submit" pending={pending}>
        Kiểm tra dữ liệu
      </Button>

      {feedback ? <FormMessage tone={feedback.tone}>{feedback.text}</FormMessage> : null}
    </form>
  );
}
