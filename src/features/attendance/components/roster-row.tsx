"use client";

import { MessageSquare, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TaskSheet } from "@/components/ui/task-sheet";
import { cn } from "@/lib/utils";
import { ATTENDANCE_STATUS_LABELS, isAbsent, type AttendanceStatus } from "../constants";
import type { AttendanceRosterEntry } from "../server/queries";

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

const choices: { value: AttendanceStatus; label: string }[] = [
  { value: "present", label: "Có mặt" },
  { value: "unexcused_absence", label: "Vắng KP" },
  { value: "excused_absence", label: "Vắng CP" },
  { value: "late", label: "Đi trễ" },
  { value: "left_early", label: "Về sớm" },
];

/** Both statuses are editable without expanding a row. Native selects use the
 * phone's own picker; reasons and internal notes live in a separate task sheet. */
export function RosterRow({ entry, draft, readOnly, expanded, onToggleExpanded, onChange, onApplySuggestion }: RosterRowProps) {
  return <div className="min-w-0 bg-surface" data-roster-row={entry.enrollmentId} data-student-label={entry.label}>
    <div className="grid grid-cols-[minmax(0,1fr)_84px_84px] items-center gap-2 border-b border-line px-2 py-2 sm:grid-cols-[minmax(0,1fr)_112px_112px] sm:px-3">
      <button type="button" onClick={onToggleExpanded} aria-haspopup="dialog" aria-expanded={expanded} data-roster-toggle=""
        className="min-h-11 min-w-0 rounded-md py-1 text-left text-sm font-medium text-ink hover:bg-surface-muted">
        <span className="break-words">{entry.label}</span>
        <span className="mt-1 flex flex-wrap items-center gap-1 text-xs font-normal text-ink-muted">
          {entry.pendingAbsenceReason ? <span className="text-info">Có đơn nghỉ</span> : null}
          {entry.warnings.length ? <TriangleAlert className="h-4 w-4 text-warning" aria-label={`Cảnh báo chuyên cần: ${entry.warnings.join(" · ")}`} /> : null}
          {draft.note ? <MessageSquare className="h-4 w-4" aria-label="Có ghi chú nội bộ" /> : null}
        </span>
      </button>
      {(["mass", "catechism"] as const).map((column) => <select key={column}
        aria-label={`${column === "mass" ? "Thánh lễ" : "Giáo lý"} của ${entry.label}`}
        value={draft[column]} disabled={readOnly} onChange={(event) => onChange({ [column]: event.target.value as AttendanceStatus })}
        className={cn("h-11 min-w-0 w-full rounded-lg border px-1 text-sm font-medium disabled:cursor-default disabled:opacity-80",
          isAbsent(draft[column]) ? "border-warning bg-warning-subtle text-ink" : "border-line bg-surface-muted text-ink")}>
        {choices.map(({ value, label }) => <option key={value} value={value} aria-label={ATTENDANCE_STATUS_LABELS[value]}>{label}</option>)}
      </select>)}
    </div>
    <TaskSheet open={expanded} onClose={onToggleExpanded} title={entry.label} description="Chi tiết điểm danh">
      <div className="space-y-4">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div><dt className="text-ink-muted">Thánh lễ</dt><dd className="mt-1 font-medium">{ATTENDANCE_STATUS_LABELS[draft.mass]}</dd></div>
          <div><dt className="text-ink-muted">Giáo lý</dt><dd className="mt-1 font-medium">{ATTENDANCE_STATUS_LABELS[draft.catechism]}</dd></div>
        </dl>
        {entry.warnings.length ? <p className="text-sm text-warning">{entry.warnings.join(" · ")}</p> : null}
        {entry.pendingAbsenceReason ? <div className="space-y-2 border-y border-line py-3">
          <p className="text-sm">Đơn xin nghỉ: {entry.pendingAbsenceReason}</p>
          {!readOnly ? <Button variant="outline" onClick={onApplySuggestion}>Áp dụng gợi ý: Vắng có phép</Button> : null}
        </div> : null}
        <label className="block space-y-2 text-sm">
          <span className="font-medium">Ghi chú nội bộ</span>
          <span className="block text-xs text-ink-muted">Phụ huynh không nhìn thấy.</span>
          <Textarea value={draft.note} disabled={readOnly} maxLength={500} rows={3} aria-label={`Ghi chú nội bộ của ${entry.label} — phụ huynh không nhìn thấy`}
            onChange={(event) => onChange({ note: event.target.value })} />
        </label>
        <Button onClick={onToggleExpanded} className="w-full">Xong</Button>
      </div>
    </TaskSheet>
  </div>;
}
