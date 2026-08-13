"use client";

import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SegmentedControl, type SegmentedOption } from "@/components/ui/segmented-control";
import { cn } from "@/lib/utils";
import {
  ATTENDANCE_STATUS_LABELS,
  ATTENDANCE_STATUS_PRIMARY,
  ATTENDANCE_STATUS_SECONDARY,
  ATTENDANCE_STATUS_SHORT_LABELS,
  isAbsent,
  type AttendanceStatus,
} from "../constants";
import type { AttendanceRosterEntry } from "../server/queries";

/**
 * Một em trong danh sách điểm danh — M05-C / U-10 · U-21 · TB-09.
 *
 * **D-143 (chủ dự án chốt 2026-08-03): mặc định GẤP LẠI một dòng, chạm để mở.**
 * Ở 360px thẻ cũ cao ~180px, nên lớp 50 em dài ~9.000px và việc *"soát lại mình
 * đã đánh vắng ai"* trước khi chốt là cuộn hết cả trang. Gấp lại còn ~1.800px.
 * Chi phí phải nói thẳng: sửa một em mất **thêm một cú chạm** — chấp nhận được
 * vì mô hình của module là *"mặc định có mặt, chỉ sửa ngoại lệ"*, tức phần lớn
 * hàng không bao giờ cần mở ra.
 *
 * 🔴 Hàng gấp lại vẫn phải NÓI ĐỦ trạng thái của cả hai cột. Gấp mà giấu luôn
 * kết quả thì người dùng buộc phải mở từng em để kiểm — tệ hơn hẳn bản cũ.
 */

/** `enrollmentId` + tên trường ⇒ tên nhóm radio không đụng nhau trên cả trang. */
function groupName(enrollmentId: string, column: "mass" | "catechism"): string {
  return `attendance-${column}-${enrollmentId}`;
}

function statusOptions(current: AttendanceStatus, showAll: boolean): SegmentedOption[] {
  // 🔴 Trạng thái ĐANG CHỌN luôn có mặt trong danh sách, kể cả khi nó thuộc
  // nhóm sau nút "…". Thiếu điều này thì một em đang "Đi trễ" mở ra sẽ thấy
  // hàng nút KHÔNG ô nào được chọn — trông hệt như dữ liệu bị mất.
  const values = showAll || ATTENDANCE_STATUS_PRIMARY.includes(current)
    ? [...ATTENDANCE_STATUS_PRIMARY, ...(showAll ? ATTENDANCE_STATUS_SECONDARY : [])]
    : [...ATTENDANCE_STATUS_PRIMARY, current];

  return values.map((status) => ({
    value: status,
    label: ATTENDANCE_STATUS_SHORT_LABELS[status],
    ariaLabel: ATTENDANCE_STATUS_LABELS[status],
  }));
}

function statusTone(status: AttendanceStatus): "success" | "warning" | "secondary" {
  if (status === "present") return "success";
  if (isAbsent(status)) return "warning";
  return "secondary";
}

export interface RosterRowProps {
  entry: AttendanceRosterEntry;
  draft: { mass: AttendanceStatus; catechism: AttendanceStatus; note: string };
  readOnly: boolean;
  expanded: boolean;
  showAllStatuses: boolean;
  onToggleExpanded: () => void;
  onToggleAllStatuses: () => void;
  onChange: (patch: Partial<{ mass: AttendanceStatus; catechism: AttendanceStatus; note: string }>) => void;
  onApplySuggestion: () => void;
}

export function RosterRow({
  entry,
  draft,
  readOnly,
  expanded,
  showAllStatuses,
  onToggleExpanded,
  onToggleAllStatuses,
  onChange,
  onApplySuggestion,
}: RosterRowProps) {
  const panelId = `roster-panel-${entry.enrollmentId}`;
  const showNote = isAbsent(draft.mass) || isAbsent(draft.catechism) || draft.note !== "";
  const warningText = entry.warnings.join(" · ");

  return (
    <div
      className="rounded-md border border-border"
      // Móc kiểm thử ổn định cho E2E. Bài test cũ bám vào `select[aria-label^=…]`
      // và gãy hết khi ô chọn thành hàng nút (D-142) — `07_IMPLEMENTATION_IMPACT`
      // §2.6 gọi đúng đó là "chi phí ẩn lớn nhất của U-10". Neo vào một thuộc
      // tính do chính component đặt thì lần đổi giao diện sau không gãy nữa.
      data-roster-row={entry.enrollmentId}
      data-student-label={entry.label}
    >
      <button
        type="button"
        onClick={onToggleExpanded}
        aria-expanded={expanded}
        aria-controls={panelId}
        data-roster-toggle=""
        className="flex min-h-11 w-full flex-wrap items-center justify-between gap-2 p-3 text-left hover:bg-surface-muted"
      >
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{entry.label}</span>
        <span className="flex flex-wrap items-center gap-1">
          {/* Hai chip nói đủ cả hai cột ngay ở hàng gấp lại. `aria-label` mang
              tên cột đầy đủ vì "Lễ"/"GL" là chữ tắt cho mắt, không cho tai. */}
          <Badge variant={statusTone(draft.mass)} icon={false} aria-label={`Thánh lễ: ${ATTENDANCE_STATUS_LABELS[draft.mass]}`}>
            Lễ: {ATTENDANCE_STATUS_SHORT_LABELS[draft.mass]}
          </Badge>
          <Badge
            variant={statusTone(draft.catechism)}
            icon={false}
            aria-label={`Giáo lý: ${ATTENDANCE_STATUS_LABELS[draft.catechism]}`}
          >
            GL: {ATTENDANCE_STATUS_SHORT_LABELS[draft.catechism]}
          </Badge>
          {entry.pendingAbsenceReason ? (
            <Badge variant="info" aria-label={`Có đơn xin nghỉ: ${entry.pendingAbsenceReason}`}>
              Có đơn
            </Badge>
          ) : null}
          {/* TB-09 — badge cảnh báo chuyên cần. Chữ "Cảnh báo" đứng một mình là
              vô nghĩa với người đọc, nên lý do đầy đủ đi kèm ở `aria-label` và
              hiện thành chữ khi mở hàng ra. */}
          {entry.warnings.length > 0 ? (
            <Badge variant="warning" aria-label={`Cảnh báo chuyên cần: ${warningText}`}>
              Cảnh báo
            </Badge>
          ) : null}
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 text-ink-muted transition-transform", expanded && "rotate-180")}
            strokeWidth={1.75}
            aria-hidden="true"
          />
        </span>
      </button>

      {expanded ? (
        <div id={panelId} className="space-y-3 border-t border-border p-3">
          {entry.warnings.length > 0 ? (
            <p className="text-xs text-warning">Cảnh báo chuyên cần: {warningText}</p>
          ) : null}

          {entry.pendingAbsenceReason ? (
            <div className="space-y-2">
              <p className="text-xs text-ink-muted">Có đơn xin nghỉ: {entry.pendingAbsenceReason}</p>
              {readOnly ? null : (
                <Button variant="outline" size="sm" onClick={onApplySuggestion}>
                  Áp dụng gợi ý: Vắng có phép
                </Button>
              )}
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <SegmentedControl
              name={groupName(entry.enrollmentId, "mass")}
              legend={`Thánh lễ của ${entry.label}`}
              options={statusOptions(draft.mass, showAllStatuses)}
              value={draft.mass}
              disabled={readOnly}
              onChange={(value) => onChange({ mass: value as AttendanceStatus })}
            />
            <SegmentedControl
              name={groupName(entry.enrollmentId, "catechism")}
              legend={`Giáo lý của ${entry.label}`}
              options={statusOptions(draft.catechism, showAllStatuses)}
              value={draft.catechism}
              disabled={readOnly}
              onChange={(value) => onChange({ catechism: value as AttendanceStatus })}
            />
          </div>

          {readOnly ? null : (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleAllStatuses}
              aria-expanded={showAllStatuses}
            >
              {showAllStatuses ? "Bớt lựa chọn" : "… Thêm Đi trễ, Về sớm"}
            </Button>
          )}

          {showNote ? (
            <Input
              // D-75: nhãn nói thẳng ở NGAY Ô NHẬP. Câu ở đầu thẻ nói một lần
              // cho cả trang, nhưng người ta gõ ghi chú lúc đang cuộn giữa danh
              // sách 50 em và không nhìn lên đó.
              placeholder="Ghi chú nội bộ — phụ huynh không nhìn thấy"
              value={draft.note}
              disabled={readOnly}
              maxLength={500}
              aria-label={`Ghi chú nội bộ của ${entry.label} — phụ huynh không nhìn thấy`}
              onChange={(event) => onChange({ note: event.target.value })}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
