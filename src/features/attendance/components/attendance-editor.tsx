"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/ui/search-input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  ATTENDANCE_STATUS_LABELS,
  STAFF_ATTENDANCE_STATUS_LABELS,
  STAFF_ATTENDANCE_STATUS_ORDER,
  isAbsent,
  type AttendanceStatus,
  type StaffAttendanceStatus,
} from "../constants";
import { buildFinalizePreview } from "../finalize-preview";
import { buildDraftHandoffText, leaseStatus } from "../lease";
import {
  ROSTER_FILTERS,
  ROSTER_FILTER_LABELS,
  countRosterFilters,
  emptyRosterMessage,
  filterRoster,
  type RosterFilter,
} from "../roster-filter";
import {
  heartbeatAttendanceSession,
  saveAttendance,
  takeoverAttendanceSession,
  type FinalizeSummary,
} from "../server/actions";
import type { AttendanceRosterEntry, AttendanceStaffEntry } from "../server/queries";
import { FinalizeConfirmDialog } from "./finalize-confirm-dialog";
import { RosterRow } from "./roster-row";
import { useGlobalPending } from "@/components/loading/loading-provider";

interface AttendanceEditorProps {
  sessionId: string;
  roster: readonly AttendanceRosterEntry[];
  /** D-140: số em tạm nghỉ đã bị loại khỏi `roster` ở tầng cơ sở dữ liệu. */
  pausedCount: number;
  staff: readonly AttendanceStaffEntry[];
  isEditor: boolean;
  canTakeover: boolean;
  editorName: string | null;
  leaseMinutes: number;
  /** TB-05: mốc hết hạn phiên chỉnh sửa **do máy chủ tính**, ISO. */
  leaseExpiresAt: string | null;
  isFinalized: boolean;
}

type StudentDraft = Record<string, { mass: AttendanceStatus; catechism: AttendanceStatus; note: string }>;
type StaffDraft = Record<string, { status: StaffAttendanceStatus; note: string }>;

const capacityLabels: Record<string, string> = {
  representative: "Đại diện",
  member: "GLV lớp",
  trainee: "Dự trưởng",
};

/** Nhịp cập nhật đồng hồ lease. Đủ dày để con số không nói dối quá một phút. */
const CLOCK_TICK_MS = 20_000;

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
  pausedCount,
  staff,
  isEditor,
  canTakeover,
  editorName,
  leaseMinutes,
  leaseExpiresAt,
  isFinalized,
}: AttendanceEditorProps) {
  const router = useRouter();
  const [students, setStudents] = useState<StudentDraft>(() => buildStudentDraft(roster));
  const [staffDraft, setStaffDraft] = useState<StaffDraft>(() => buildStaffDraft(staff));
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [summary, setSummary] = useState<FinalizeSummary | null>(null);
  const [pending, startTransition] = useTransition();
  useGlobalPending(pending);

  // U-11 / TB-09 — bộ lọc và ô tìm tên, thuần client.
  const [filter, setFilter] = useState<RosterFilter>("all");
  const [query, setQuery] = useState("");
  // U-21 / D-143 — hàng nào đang mở ra để sửa.
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set());
  // U-10 / D-142 — "…" mở thêm Đi trễ / Về sớm cho MỌI hàng đang mở. Một người
  // cần đến hai trạng thái ấy thường cần cho nhiều em, không cho đúng một em.
  const [showAllStatuses, setShowAllStatuses] = useState(false);

  // TB-03
  const [confirming, setConfirming] = useState(false);

  // TB-05 — đồng hồ phiên chỉnh sửa và chuyện bị tiếp quản.
  const [leaseExpiry, setLeaseExpiry] = useState<string | null>(leaseExpiresAt);
  const [lostLease, setLostLease] = useState<string | null>(null);
  // 🔴 `null` cho tới khi trang gắn xong: `Date.now()` lúc dựng ở máy chủ khác
  // với lúc dựng ở trình duyệt, và một con số phút chênh nhau là hydration
  // mismatch. Trước khi gắn xong thì không hiện đồng hồ — đúng hơn là hiện sai.
  const [now, setNow] = useState<number | null>(null);

  // U-25 — chỗ trả focus về sau mỗi lượt ghi (xem `submit`).
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isEditor) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), CLOCK_TICK_MS);
    return () => clearInterval(timer);
  }, [isEditor]);

  // Gia hạn lease trong lúc người dùng còn mở trang. Nhịp bằng nửa thời gian
  // lease để một lần lỡ nhịp vẫn chưa mất quyền (D-32).
  useEffect(() => {
    if (!isEditor || lostLease !== null) return;
    const intervalMs = Math.max(30_000, (leaseMinutes * 60_000) / 2);
    const timer = setInterval(() => {
      void heartbeatAttendanceSession(sessionId).then((result) => {
        if (result.ok) {
          setLeaseExpiry(result.data.leaseExpiresAt);
          return;
        }
        // 🔴 TB-05 bước 4 — KHÔNG `router.refresh()` ở đây nữa.
        //
        // Bản cũ làm đúng vậy: heartbeat hỏng thì làm mới trang, và trang lặng
        // lẽ chuyển sang chỉ-đọc. Người đang gõ dở nhìn thấy các ô mờ đi mà
        // không một chữ nào giải thích, và phần vừa sửa biến mất. Nay dừng lại,
        // nói ra, và để chính họ quyết định lúc nào tải lại.
        setLostLease(result.message);
      });
    }, intervalMs);
    return () => clearInterval(timer);
  }, [isEditor, leaseMinutes, lostLease, sessionId]);

  const counters = useMemo(() => {
    const values = Object.values(students);
    return {
      total: values.length,
      massAbsent: values.filter((entry) => isAbsent(entry.mass)).length,
      catechismAbsent: values.filter((entry) => isAbsent(entry.catechism)).length,
    };
  }, [students]);

  const filterCounts = useMemo(() => countRosterFilters(roster, students), [roster, students]);
  const visibleRoster = useMemo(
    () => filterRoster(roster, students, filter, query),
    [filter, query, roster, students],
  );

  const preview = useMemo(
    () =>
      buildFinalizePreview(
        Object.entries(students).map(([enrollmentId, entry]) => ({
          enrollmentId,
          mass: entry.mass,
          catechism: entry.catechism,
        })),
        Object.values(staffDraft),
        roster,
      ),
    [roster, staffDraft, students],
  );

  const lease = isEditor && now !== null ? leaseStatus(leaseExpiry, now) : null;

  const handoffText = useMemo(
    () =>
      buildDraftHandoffText(
        roster.map((entry) => {
          const draft = students[entry.enrollmentId];
          return {
            label: entry.label,
            massLabel: ATTENDANCE_STATUS_LABELS[draft?.mass ?? entry.massStatus],
            catechismLabel: ATTENDANCE_STATUS_LABELS[draft?.catechism ?? entry.catechismStatus],
            note: draft?.note ?? "",
            isException:
              (draft?.mass ?? entry.massStatus) !== "present"
              || (draft?.catechism ?? entry.catechismStatus) !== "present"
              || (draft?.note ?? "") !== "",
          };
        }),
      ),
    [roster, students],
  );

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
          // U-25 — sau một lượt ghi, focus của bàn phím rơi về `<body>` nếu
          // không ai đặt lại, và người dùng phải Tab qua ~150 điều khiển mới
          // quay lại được chỗ mình vừa bấm. Đưa focus về đúng dòng thông báo,
          // vốn nằm ngay trên hai cái nút trong thanh dính đáy.
          statusRef.current?.focus();
          return;
        }
        setSummary(finalize ? result.data : null);
        setMessage({
          tone: "success",
          text: finalize ? "Đã chốt buổi điểm danh." : "Đã lưu nháp.",
        });
        statusRef.current?.focus();
        router.refresh();
      });
    },
    [router, sessionId, staffDraft, students],
  );

  /**
   * TB-06 bước 2 / AC-F13-3 — nút gợi ý chỉ đổi **bản nháp phía client**.
   *
   * Không có trigger nào từ `absence_requests` ghi vào điểm danh (D-36, và
   * migration `20260721000400` ghi rõ "đừng tối ưu thêm"), nên đây là cách duy
   * nhất đơn xin nghỉ được phép ảnh hưởng tới màn hình: bằng một cú bấm của
   * người điểm danh. Đặt **cả hai** cột vì đơn xin nghỉ khai theo *buổi* —
   * nghỉ Chúa nhật là nghỉ cả Thánh lễ lẫn Giáo lý — và người điểm danh vẫn
   * sửa lại được từng cột nếu em có đi một phần.
   */
  const applyAbsenceSuggestion = useCallback((enrollmentId: string) => {
    setStudents((current) => ({
      ...current,
      [enrollmentId]: {
        ...current[enrollmentId],
        mass: "excused_absence",
        catechism: "excused_absence",
      },
    }));
  }, []);

  const patchStudent = useCallback(
    (
      enrollmentId: string,
      patch: Partial<{ mass: AttendanceStatus; catechism: AttendanceStatus; note: string }>,
    ) => {
      setStudents((current) => ({
        ...current,
        [enrollmentId]: { ...current[enrollmentId], ...patch },
      }));
    },
    [],
  );

  const toggleExpanded = useCallback((enrollmentId: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(enrollmentId)) next.delete(enrollmentId);
      else next.add(enrollmentId);
      return next;
    });
  }, []);

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
          <CardContent className="space-y-3 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
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
            </div>
            {message ? (
              <FormMessage tone={message.tone === "error" ? "danger" : "success"}>
                {message.text}
              </FormMessage>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {/* TB-05 bước 4 / AC-F05-3 — bị tiếp quản thì phải được NÓI, và phần vừa
          gõ phải mang đi được. `role="alert"` để trình đọc màn hình ngắt lời
          ngay: đây đúng là loại tin không được đợi người dùng tự phát hiện. */}
      {lostLease ? (
        <Card>
          <CardContent className="space-y-3 pt-6" role="alert">
            <p className="text-sm font-medium text-danger">{lostLease}</p>
            <p className="text-sm text-muted-foreground">
              Phần bạn vừa sửa <strong>chưa được lưu</strong> và trang này không tự gửi nó đi — gửi
              lúc này sẽ ghi đè lên dữ liệu của người đang phụ trách. Chép lại phần dưới đây rồi tải
              lại trang.
            </p>
            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">Thay đổi chưa lưu của bạn</span>
              <textarea
                readOnly
                rows={4}
                value={handoffText}
                aria-label="Thay đổi chưa lưu của bạn"
                className="w-full rounded-md border border-border bg-card p-2 text-sm"
              />
            </label>
            <Button variant="outline" onClick={() => router.refresh()}>
              Tải lại trang
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* AC-F05-4 / U-24 — hạn phiên chỉnh sửa, lấy từ giá trị máy chủ trả về. */}
      {lease ? (
        <p
          aria-live="polite"
          className={`text-sm ${lease.tone === "info" ? "text-muted-foreground" : "text-warning"}`}
        >
          {lease.text}
        </p>
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
            {/* D-75: nói một lần cho cả thẻ, ngay chỗ người dùng đọc trước khi
                bắt đầu gõ. Ô nhập nhắc lại lần nữa bằng placeholder. */}
            {" "}Ghi chú là ghi chú nội bộ — phụ huynh không nhìn thấy.
            Đang vắng: Lễ {counters.massAbsent}, Giáo lý {counters.catechismAbsent} trên {counters.total} em.
            {/* D-140: nói ra con số, vì một danh sách ngắn hơn sĩ số mà không
                giải thích thì trông y như hệ thống làm mất em. */}
            {pausedCount > 0
              ? ` ${pausedCount} em đang tạm nghỉ, không có trong danh sách này.`
              : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {roster.length === 0 ? (
            <p className="text-sm text-muted-foreground">Lớp chưa có thiếu nhi ghi danh.</p>
          ) : (
            <>
              {/* U-11 — bộ lọc dính đầu danh sách. Con số trên nhãn là con số
                  của cả buổi, không phải của trang đang xem. */}
              <div className="sticky top-16 z-10 space-y-2 rounded-md border border-border bg-card p-2">
                <SegmentedControl
                  name="roster-filter"
                  legend="Lọc danh sách thiếu nhi"
                  hideLegend
                  value={filter}
                  onChange={(value) => setFilter(value as RosterFilter)}
                  options={ROSTER_FILTERS.map((key) => ({
                    value: key,
                    label: `${ROSTER_FILTER_LABELS[key]} (${filterCounts[key]})`,
                  }))}
                />
                <SearchInput
                  label="Tìm thiếu nhi theo tên"
                  placeholder="Tìm tên em…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  hint="Gõ không dấu cũng tìm được."
                />
              </div>

              {visibleRoster.length === 0 ? (
                <p className="text-sm text-muted-foreground">{emptyRosterMessage(filter, query)}</p>
              ) : (
                visibleRoster.map((entry) => {
                  const draft = students[entry.enrollmentId];
                  if (!draft) return null;
                  return (
                    <RosterRow
                      key={entry.enrollmentId}
                      entry={entry}
                      draft={draft}
                      readOnly={readOnly}
                      expanded={expanded.has(entry.enrollmentId)}
                      showAllStatuses={showAllStatuses}
                      onToggleExpanded={() => toggleExpanded(entry.enrollmentId)}
                      onToggleAllStatuses={() => setShowAllStatuses((current) => !current)}
                      onChange={(patch) => patchStudent(entry.enrollmentId, patch)}
                      onApplySuggestion={() => applyAbsenceSuggestion(entry.enrollmentId)}
                    />
                  );
                })
              )}
            </>
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
                  {/* Đội ngũ lớp chỉ 2–4 người và chỉ có ba trạng thái, nên hàng
                      nút hiện đủ cả ba, không cần nút "…" như danh sách em. */}
                  <SegmentedControl
                    className="mt-3"
                    name={`staff-attendance-${entry.classStaffAssignmentId}`}
                    legend={`Điểm danh ${entry.label}`}
                    value={draft.status}
                    disabled={readOnly}
                    onChange={(value) =>
                      setStaffDraft((current) => ({
                        ...current,
                        [entry.classStaffAssignmentId]: {
                          ...current[entry.classStaffAssignmentId],
                          status: value as StaffAttendanceStatus,
                        },
                      }))
                    }
                    options={STAFF_ATTENDANCE_STATUS_ORDER.map((status) => ({
                      value: status,
                      label: STAFF_ATTENDANCE_STATUS_LABELS[status],
                    }))}
                  />
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
        <div className="sticky bottom-4 space-y-2 rounded-md border border-border bg-card p-3 shadow-sm">
          {/* 🔴 U-17 — thông báo nằm TRONG thanh hành động, cạnh đúng cái nút
              vừa bấm. Bản cũ đặt nó ở đầu editor trong khi hai nút ở đáy màn
              hình: trên máy 360px với 50 em, hai chỗ ấy cách nhau hàng nghìn
              pixel, nên bấm Lưu mà thấy màn hình không đổi gì được hiểu là
              "bấm không ăn" — và người ta bấm lại. U-18: `FormMessage` tự đặt
              `role="alert"` cho lỗi, `role="status"` cho thành công. */}
          <div ref={statusRef} tabIndex={-1} className="outline-none">
            {message ? (
              <FormMessage tone={message.tone === "error" ? "danger" : "success"}>
                {message.text}
              </FormMessage>
            ) : null}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => submit(false)} disabled={pending}>
              Lưu nháp
            </Button>
            <Button onClick={() => setConfirming(true)} disabled={pending}>
              {isFinalized ? "Chốt lại" : "Hoàn tất điểm danh"}
            </Button>
          </div>
        </div>
      )}

      <FinalizeConfirmDialog
        open={confirming}
        preview={preview}
        pending={pending}
        isRefinalize={isFinalized}
        onClose={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          submit(true);
        }}
      />
    </div>
  );
}
