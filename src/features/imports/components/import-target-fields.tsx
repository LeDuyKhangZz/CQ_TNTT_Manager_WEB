"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { ClassOption, TargetYear } from "../server/queries";

export interface ImportTargetProps {
  /** Năm học ghi được, mới nhất trước. Luôn có ít nhất một phần tử khi hiện form. */
  years: readonly TargetYear[];
  /** Lớp của **từng** năm, tra theo id năm. Đủ nhỏ để gửi hết: 19 lớp/năm. */
  classOptionsByYear: Readonly<Record<string, readonly ClassOption[]>>;
  defaultYearId: string;
}

/**
 * Hai ô "Năm học đích" và "Lớp đích", dùng chung cho cả đường tải file lẫn
 * đường dán văn bản — IMP-BULK-001.
 *
 * 🔴 **Danh sách lớp đổi theo năm học.** Lớp thuộc về một năm học cụ thể
 * (`classes.academic_year_id`), nên một ô lớp đứng yên khi người dùng đổi năm sẽ
 * mời họ chọn một lớp của năm khác — mà `stageParsedRows` từ chối đúng lượt đó
 * với câu *"Lớp đích không thuộc năm học đã chọn"*. Lọc ngay trên trình duyệt
 * từ dữ liệu đã gửi sẵn: vài chục lớp thì rẻ hơn một lượt đi về máy chủ, và
 * **không có JavaScript thì ô lớp vẫn hiện lớp của năm mặc định** — vẫn nhập
 * được, đúng yêu cầu `09` §11.
 */
export function ImportTargetFields({
  years,
  classOptionsByYear,
  defaultYearId,
  idPrefix,
}: ImportTargetProps & { idPrefix: string }) {
  const [yearId, setYearId] = useState(defaultYearId);
  const classOptions = classOptionsByYear[yearId] ?? [];
  const yearFieldId = `${idPrefix}-year`;
  const classFieldId = `${idPrefix}-class`;

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={yearFieldId}>Năm học đích</Label>
        <Select
          id={yearFieldId}
          name="academicYearId"
          value={yearId}
          onChange={(event) => setYearId(event.target.value)}
        >
          {years.map((year) => (
            <option key={year.id} value={year.id}>
              {year.code} — {year.name}
              {year.status === "current" ? " (đang áp dụng)" : " (nháp)"}
            </option>
          ))}
        </Select>
        <p className="text-xs text-ink-muted">
          Dữ liệu sẽ được ghi danh vào năm học này. Chỉ chọn được năm đang áp dụng hoặc năm ở trạng
          thái nháp — năm đã đóng thì không nhập thêm được.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor={classFieldId}>Lớp đích (nếu dữ liệu không có cột lớp)</Label>
        <Select id={classFieldId} name="classId" defaultValue="">
          <option value="">— Lấy theo cột lớp trong dữ liệu —</option>
          {classOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.displayName}
            </option>
          ))}
        </Select>
        <p className="text-xs text-ink-muted">
          {classOptions.length === 0
            ? "Năm học này chưa có lớp nào. Hãy sinh cơ cấu lớp ở trang Quản trị trước khi nhập."
            : "Sổ lớp Chiên Con không có cột lớp — hãy chọn lớp ở đây. Dòng nào đã ghi lớp trong dữ liệu thì vẫn ưu tiên giá trị đó."}
        </p>
      </div>
    </>
  );
}
