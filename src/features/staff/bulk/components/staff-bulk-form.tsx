"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/ui/date-field";
import { FormMessage } from "@/components/ui/form-message";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  commitStaffBulk,
  previewStaffBulk,
  type StaffBulkCommitSummary,
  type StaffBulkPreview,
} from "../server/actions";

export interface StaffBulkYear {
  id: string;
  code: string;
  name: string;
  status: string;
}

const TITLE_LABELS: Record<string, string> = {
  anh: "Anh",
  chi: "Chị",
  di: "Dì",
  so: "Sơ",
  cha: "Cha",
  thay: "Thầy",
  other: "Khác",
};

const CAPACITY_LABELS: Record<string, string> = {
  representative: "GLV đại diện",
  member: "GLV lớp",
  trainee: "Dự trưởng",
};

const LEVEL_LABELS: Record<string, string> = {
  none: "—",
  i: "Cấp I",
  ii: "Cấp II",
  iii: "Cấp III",
  special: "Đặc cách",
};

/**
 * Nhập hàng loạt nhân sự — IMP-BULK-001.
 *
 * Hai pha **xem trước rồi ghi**, cả hai đều gửi lại chính khối văn bản đang hiện
 * trong ô: không có bảng tạm nào ở giữa, nên không có trạng thái nào lệch được
 * với thứ người dùng đang nhìn. Nút "Ghi" chỉ bật sau khi đã xem trước — và nếu
 * người dùng sửa lại ô văn bản thì bảng xem trước bị xoá, buộc xem lại.
 */
export function StaffBulkForm({
  years,
  defaultYearId,
  defaultStartsOn,
}: {
  years: readonly StaffBulkYear[];
  defaultYearId: string;
  defaultStartsOn: string;
}) {
  const [text, setText] = useState("");
  const [yearId, setYearId] = useState(defaultYearId);
  const [startsOn, setStartsOn] = useState(defaultStartsOn);
  const [preview, setPreview] = useState<StaffBulkPreview | null>(null);
  const [summary, setSummary] = useState<StaffBulkCommitSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function runPreview() {
    setError(null);
    setSummary(null);
    startTransition(async () => {
      const result = await previewStaffBulk(text, yearId);
      if (result.ok) setPreview(result.data);
      else {
        setPreview(null);
        setError(result.message);
      }
    });
  }

  function runCommit() {
    setError(null);
    startTransition(async () => {
      const result = await commitStaffBulk(text, yearId, startsOn);
      if (result.ok) {
        setSummary(result.data);
        setPreview(null);
      } else setError(result.message);
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="bulk-year">Năm học phân công</Label>
        <Select
          id="bulk-year"
          value={yearId}
          onChange={(event) => {
            setYearId(event.target.value);
            setPreview(null);
          }}
        >
          {years.map((year) => (
            <option key={year.id} value={year.id}>
              {year.code} — {year.name}
              {year.status === "current" ? " (đang áp dụng)" : " (nháp)"}
            </option>
          ))}
        </Select>
        <p className="text-xs text-ink-muted">
          Cột “Lớp” trong dữ liệu được tra theo lớp của năm học này. Hồ sơ nhân sự thì dùng chung cho
          mọi năm — chỉ phân công lớp mới thuộc về một năm.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bulk-starts-on">Ngày bắt đầu phân công</Label>
        <DateField
          id="bulk-starts-on"
          value={startsOn}
          onChange={(event) => setStartsOn(event.target.value)}
          required
        />
        <p className="text-xs text-ink-muted">Thường là ngày khai giảng của năm học.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bulk-text">Danh sách nhân sự</Label>
        <Textarea
          id="bulk-text"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setPreview(null);
          }}
          rows={12}
          spellCheck={false}
          className="font-mono text-xs"
          placeholder={
            "Danh xưng | Tên Thánh | Họ và tên | SĐT | Ngày sinh | Cấp | Lớp | Vai trò\n" +
            "Chị | Maria | Trần Bình An | 0931342624 | 07/10/2004 | 2 | Chiên Con 1 | GLV đại diện"
          }
        />
        <p className="text-xs text-ink-muted">
          Dòng đầu là tiêu đề cột. Cột <strong>Họ và tên</strong> và <strong>SĐT</strong> là bắt buộc.
          Vai trò nhận: <em>GLV đại diện · GLV lớp · Dự trưởng</em> — mỗi lớp chỉ được một GLV đại
          diện, nên hệ thống không bao giờ tự đoán vai trò này.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={runPreview} pending={pending} disabled={text.trim() === ""}>
          Kiểm tra dữ liệu
        </Button>
        {preview && preview.validCount > 0 ? (
          <Button type="button" variant="primary" onClick={runCommit} pending={pending}>
            Ghi {preview.validCount} dòng vào hệ thống
          </Button>
        ) : null}
      </div>

      {error ? <FormMessage tone="danger">{error}</FormMessage> : null}

      {summary ? (
        <FormMessage tone={summary.failures.length > 0 ? "danger" : "success"}>
          {`Đã tạo ${summary.created} hồ sơ mới · dùng lại ${summary.reused} hồ sơ đã có · phân công ${summary.assigned} lượt vào lớp` +
            (summary.skipped > 0 ? ` · bỏ qua ${summary.skipped} dòng lỗi` : "") +
            "."}
          {summary.assignFailures.length > 0 ? (
            <>
              {" "}
              ⚠️ {summary.assignFailures.length} người đã có hồ sơ nhưng{" "}
              <strong>chưa phân công được lớp</strong>: {summary.assignFailures
                .slice(0, 5)
                .map((item) => `#${item.rowNumber} ${item.fullName} — ${item.message}`)
                .join(" · ")}
              {summary.assignFailures.length > 5 ? "…" : ""} Hồ sơ vẫn đúng; phân công lại ở trang
              Nhân sự.
            </>
          ) : null}
          {summary.failures.length > 0 ? (
            <>
              {" "}
              {summary.failures.length} dòng không tạo được hồ sơ:{" "}
              {summary.failures
                .slice(0, 5)
                .map((item) => `#${item.rowNumber} ${item.fullName}`)
                .join(", ")}
              {summary.failures.length > 5 ? "…" : ""}
            </>
          ) : null}
        </FormMessage>
      ) : null}

      {preview ? (
        <div className="space-y-2">
          <p className="text-sm text-ink-muted">
            {preview.rows.length} dòng · hợp lệ {preview.validCount} · lỗi {preview.errorCount}
            {preview.matchedCount > 0
              ? ` · ${preview.matchedCount} người đã có hồ sơ (sẽ dùng lại, không tạo thêm)`
              : ""}
            . Năm học đích: {preview.yearCode}. Chưa có gì được ghi vào hệ thống.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line-strong text-left">
                  <th className="p-2 font-medium">#</th>
                  <th className="p-2 font-medium">Họ và tên</th>
                  <th className="p-2 font-medium">SĐT</th>
                  <th className="p-2 font-medium">Cấp</th>
                  <th className="p-2 font-medium">Lớp</th>
                  <th className="p-2 font-medium">Vai trò</th>
                  <th className="p-2 font-medium">Ghi nhận</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr key={row.rowNumber} className="border-b border-line align-top">
                    <td className="p-2 tabular-nums">{row.rowNumber}</td>
                    <td className="p-2">
                      {TITLE_LABELS[row.title] ?? row.title}{" "}
                      {row.saintName ? `${row.saintName} ` : ""}
                      <strong>{row.fullName}</strong>
                    </td>
                    <td className="p-2 tabular-nums">{row.phone ?? "—"}</td>
                    <td className="p-2">{LEVEL_LABELS[row.formationLevel] ?? row.formationLevel}</td>
                    <td className="p-2">{row.className ?? "—"}</td>
                    <td className="p-2">{CAPACITY_LABELS[row.capacity] ?? row.capacity}</td>
                    <td className="p-2">
                      {row.errors.length > 0 ? (
                        <Badge variant="danger">{row.errors.map((issue) => issue.message).join(" ")}</Badge>
                      ) : row.existingStaffCode ? (
                        <Badge variant="outline">Đã có hồ sơ {row.existingStaffCode} — dùng lại</Badge>
                      ) : row.warnings.length > 0 ? (
                        <Badge variant="warning">
                          {row.warnings.map((issue) => issue.message).join(" ")}
                        </Badge>
                      ) : (
                        <Badge variant="success">Tạo mới</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
