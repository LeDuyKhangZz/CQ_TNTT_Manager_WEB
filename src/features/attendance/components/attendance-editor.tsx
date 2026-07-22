"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import {
  ATTENDANCE_STATUS_LABELS,
  ATTENDANCE_STATUS_ORDER,
  STAFF_ATTENDANCE_STATUS_LABELS,
  STAFF_ATTENDANCE_STATUS_ORDER,
  isAbsent,
  type AttendanceStatus,
  type StaffAttendanceStatus,
} from "../constants";
import {
  heartbeatAttendanceSession,
  saveAttendance,
  takeoverAttendanceSession,
  type FinalizeSummary,
} from "../server/actions";
import type { AttendanceRosterEntry, AttendanceStaffEntry } from "../server/queries";

interface AttendanceEditorProps {
  sessionId: string;
  roster: readonly AttendanceRosterEntry[];
  staff: readonly AttendanceStaffEntry[];
  isEditor: boolean;
  canTakeover: boolean;
  editorName: string | null;
  leaseMinutes: number;
  isFinalized: boolean;
}

type StudentDraft = Record<string, { mass: AttendanceStatus; catechism: AttendanceStatus; note: string }>;
type StaffDraft = Record<string, { status: StaffAttendanceStatus; note: string }>;

const selectClassName =
  "h-11 min-h-11 w-full rounded-md border border-border bg-card px-2 text-sm";

const capacityLabels: Record<string, string> = {
  representative: "Đại diện",
  member: "GLV lớp",
  trainee: "Dự trưởng",
};

function buildStudentDraft(roster: readonly AttendanceRosterEntry[]): StudentDraft {
  return Object.fromEntries(
    roster.map((entry) => [
      entry.enrollmentId,
      { mass: entry.massStatus, catechism: entry.catechismStatus, note: entry.note ?? "" },
    ]),
  );
}

function buildStaffDraft(staff: readonly AttendanceStaffEntry[]): StaffDraft {
  return Object.fromEntries(
    staff.map((entry) => [entry.classStaffAssignmentId, { status: entry.status, note: entry.note ?? "" }]),
  );
}

export function AttendanceEditor({
  sessionId,
  roster,
  staff,
  isEditor,
  canTakeover,
  editorName,
  leaseMinutes,
  isFinalized,
}: AttendanceEditorProps) {
  const router = useRouter();
  const [students, setStudents] = useState<StudentDraft>(() => buildStudentDraft(roster));
  const [staffDraft, setStaffDraft] = useState<StaffDraft>(() => buildStaffDraft(staff));
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [summary, setSummary] = useState<FinalizeSummary | null>(null);
  const [pending, startTransition] = useTransition();

  // Gia hạn lease trong lúc người dùng còn mở trang. Nhịp bằng nửa thời gian
  // lease để một lần lỡ nhịp vẫn chưa mất quyền (D-32).
  useEffect(() => {
    if (!isEditor) return;
    const intervalMs = Math.max(30_000, (leaseMinutes * 60_000) / 2);
    const timer = setInterval(() => {
      void heartbeatAttendanceSession(sessionId).then((result) => {
        if (!result.ok) {
          setMessage({ tone: "error", text: result.message });
          router.refresh();
        }
      });
    }, intervalMs);
    return () => clearInterval(timer);
  }, [isEditor, leaseMinutes, router, sessionId]);

  const counters = useMemo(() => {
    const values = Object.values(students);
    return {
      total: values.length,
      massAbsent: values.filter((entry) => isAbsent(entry.mass)).length,
      catechismAbsent: values.filter((entry) => isAbsent(entry.catechism)).length,
    };
  }, [students]);

  const submit = useCallback(
    (finalize: boolean) => {
      setMessage(null);
      startTransition(async () => {
        const result = await saveAttendance({
          sessionId,
          students: Object.entries(students).map(([enrollmentId, entry]) => ({
            enrollmentId,
            massStatus: entry.mass,
            catechismStatus: entry.catechism,
            note: entry.note.trim() || null,
          })),
          staff: Object.entries(staffDraft).map(([classStaffAssignmentId, entry]) => ({
            classStaffAssignmentId,
            status: entry.status,
            note: entry.note.trim() || null,
          })),
          finalize,
        });
        if (!result.ok) {
          setMessage({ tone: "error", text: result.message });
          return;
        }
        setSummary(finalize ? result.data : null);
        setMessage({
          tone: "success",
          text: finalize ? "Đã chốt buổi điểm danh." : "Đã lưu nháp.",
        });
        router.refresh();
      });
    },
    [router, sessionId, staffDraft, students],
  );

  const takeover = useCallback(() => {
    setMessage(null);
    startTransition(async () => {
      const result = await takeoverAttendanceSession(sessionId);
      if (!result.ok) {
        setMessage({ tone: "error", text: result.message });
        return;
      }
      setMessage({ tone: "success", text: "Bạn đã tiếp quản buổi điểm danh." });
      router.refresh();
    });
  }, [router, sessionId]);

  const readOnly = !isEditor;

  return (
    <div className="space-y-5">
      {readOnly ? (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
            <p className="text-sm text-muted-foreground">
              {editorName
                ? `${editorName} đang phụ trách buổi này. Bạn chỉ xem.`
                : "Bạn không giữ quyền chỉnh sửa buổi này."}
            </p>
            {canTakeover ? (
              <Button variant="outline" onClick={takeover} disabled={pending}>
                Tiếp quản
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {message ? (
        <FormMessage tone={message.tone === "error" ? "danger" : "success"}>{message.text}</FormMessage>
      ) : null}

      {summary ? (
        <Card>
          <CardHeader>
            <CardTitle>Tổng kết buổi</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div><span className="text-muted-foreground">Sĩ số</span><p className="text-lg font-semibold">{summary.studentTotal}</p></div>
            <div><span className="text-muted-foreground">Đủ hai buổi</span><p className="text-lg font-semibold">{summary.studentPresent}</p></div>
            <div><span className="text-muted-foreground">Có vắng</span><p className="text-lg font-semibold">{summary.studentAbsent}</p></div>
            <div><span className="text-muted-foreground">GLV có mặt</span><p className="text-lg font-semibold">{summary.staffPresent}/{summary.staffTotal}</p></div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Thiếu nhi</CardTitle>
          <CardDescription>
            Mặc định tất cả có mặt — chỉ sửa những em vắng. Thánh lễ và Giáo lý ghi nhận riêng.
            Đang vắng: Lễ {counters.massAbsent}, Giáo lý {counters.catechismAbsent} trên {counters.total} em.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {roster.length === 0 ? (
            <p className="text-sm text-muted-foreground">Lớp chưa có thiếu nhi ghi danh.</p>
          ) : (
            roster.map((entry) => {
              const draft = students[entry.enrollmentId];
              if (!draft) return null;
              const showNote = isAbsent(draft.mass) || isAbsent(draft.catechism) || draft.note !== "";
              return (
                <div key={entry.enrollmentId} className="rounded-md border border-border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium">{entry.label}</span>
                    {entry.pendingAbsenceReason ? (
                      <Badge variant="warning">Có đơn xin nghỉ: {entry.pendingAbsenceReason}</Badge>
                    ) : null}
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <label className="space-y-1">
                      <span className="text-xs text-muted-foreground">Thánh lễ</span>
                      <select
                        className={selectClassName}
                        value={draft.mass}
                        disabled={readOnly}
                        aria-label={`Thánh lễ của ${entry.label}`}
                        onChange={(event) =>
                          setStudents((current) => ({
                            ...current,
                            [entry.enrollmentId]: {
                              ...current[entry.enrollmentId],
                              mass: event.target.value as AttendanceStatus,
                            },
                          }))
                        }
                      >
                        {ATTENDANCE_STATUS_ORDER.map((status) => (
                          <option key={status} value={status}>{ATTENDANCE_STATUS_LABELS[status]}</option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs text-muted-foreground">Giáo lý</span>
                      <select
                        className={selectClassName}
                        value={draft.catechism}
                        disabled={readOnly}
                        aria-label={`Giáo lý của ${entry.label}`}
                        onChange={(event) =>
                          setStudents((current) => ({
                            ...current,
                            [entry.enrollmentId]: {
                              ...current[entry.enrollmentId],
                              catechism: event.target.value as AttendanceStatus,
                            },
                          }))
                        }
                      >
                        {ATTENDANCE_STATUS_ORDER.map((status) => (
                          <option key={status} value={status}>{ATTENDANCE_STATUS_LABELS[status]}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  {showNote ? (
                    <Input
                      className="mt-2"
                      placeholder="Ghi chú"
                      value={draft.note}
                      disabled={readOnly}
                      maxLength={500}
                      aria-label={`Ghi chú của ${entry.label}`}
                      onChange={(event) =>
                        setStudents((current) => ({
                          ...current,
                          [entry.enrollmentId]: {
                            ...current[entry.enrollmentId],
                            note: event.target.value,
                          },
                        }))
                      }
                    />
                  ) : null}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Giáo lý viên</CardTitle>
          <CardDescription>Điểm danh đội ngũ lớp trong cùng buổi.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {staff.length === 0 ? (
            <p className="text-sm text-muted-foreground">Lớp chưa phân công nhân sự.</p>
          ) : (
            staff.map((entry) => {
              const draft = staffDraft[entry.classStaffAssignmentId];
              if (!draft) return null;
              return (
                <div key={entry.classStaffAssignmentId} className="rounded-md border border-border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium">{entry.label}</span>
                    <Badge variant="secondary">{capacityLabels[entry.capacity] ?? entry.capacity}</Badge>
                  </div>
                  <select
                    className={`${selectClassName} mt-3`}
                    value={draft.status}
                    disabled={readOnly}
                    aria-label={`Điểm danh ${entry.label}`}
                    onChange={(event) =>
                      setStaffDraft((current) => ({
                        ...current,
                        [entry.classStaffAssignmentId]: {
                          ...current[entry.classStaffAssignmentId],
                          status: event.target.value as StaffAttendanceStatus,
                        },
                      }))
                    }
                  >
                    {STAFF_ATTENDANCE_STATUS_ORDER.map((status) => (
                      <option key={status} value={status}>{STAFF_ATTENDANCE_STATUS_LABELS[status]}</option>
                    ))}
                  </select>
                  {draft.status !== "present" || draft.note !== "" ? (
                    <Input
                      className="mt-2"
                      placeholder="Ghi chú"
                      value={draft.note}
                      disabled={readOnly}
                      maxLength={500}
                      aria-label={`Ghi chú của ${entry.label}`}
                      onChange={(event) =>
                        setStaffDraft((current) => ({
                          ...current,
                          [entry.classStaffAssignmentId]: {
                            ...current[entry.classStaffAssignmentId],
                            note: event.target.value,
                          },
                        }))
                      }
                    />
                  ) : null}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {readOnly ? null : (
        <div className="sticky bottom-4 flex flex-col gap-2 rounded-md border border-border bg-card p-3 shadow-sm sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => submit(false)} disabled={pending}>
            Lưu nháp
          </Button>
          <Button onClick={() => submit(true)} disabled={pending}>
            {isFinalized ? "Chốt lại" : "Hoàn tất điểm danh"}
          </Button>
        </div>
      )}
    </div>
  );
}
