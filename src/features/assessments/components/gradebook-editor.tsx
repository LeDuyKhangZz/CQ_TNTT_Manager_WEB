"use client";

import { useCallback, useEffect, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDateVi } from "@/lib/dates";
import { cn } from "@/lib/utils";
import {
  ASSESSMENT_KIND_LABELS,
  ASSESSMENT_KINDS,
  ATTENDANCE_COMPONENT_LABELS,
  COMMENT_VISIBILITY_LABELS,
  LEADERBOARD_SOURCE_LABELS,
  LEADERBOARD_SOURCE_TYPES,
  type AssessmentKind,
  type CommentVisibility,
  type LeaderboardSourceType,
} from "../constants";
import {
  archiveAssessment,
  createAssessment,
  createStudentComment,
  createLeaderboard,
  deleteAssessment,
  deleteLeaderboard,
  deleteStudentComment,
  lockGradebook,
  previewLeaderboard,
  publishLeaderboard,
  refreshGradebookPage,
  refreshAttendanceScores,
  republishLeaderboard,
  resetAttendanceScoreOverride,
  restoreAssessment,
  saveAssessmentScores,
  setAssessmentPublished,
  unlockGradebook,
  unpublishLeaderboard,
  updateAssessment,
  updateStudentComment,
} from "../server/actions";
import type { LeaderboardPreviewEntry } from "../server/actions";
import type {
  GradebookAssessment,
  GradebookDetail,
  GradebookLeaderboard,
  GradebookStudent,
} from "../server/queries";
import { changedScoreCells, readNoteInput, readScoreInput } from "../score-diff";
import { useGlobalPending } from "@/components/loading/loading-provider";

const selectClassName = "h-11 min-h-11 w-full rounded-md border border-border bg-card px-3 text-sm";
type Message = { tone: "success" | "error" | "info"; text: string } | null;

/**
 * M07-A — thêm sắc thái **"info"**: có những câu trả lời không phải thành công
 * cũng không phải lỗi (*"Chưa có ô nào thay đổi"*). Tô xanh lá cho nó là nói với
 * người vừa bấm Lưu rằng đã lưu xong, trong khi không một dòng nào được ghi.
 */
const MESSAGE_TONES = { success: "success", error: "danger", info: "info" } as const;

/**
 * M07-A · **TB-M07-09** — chỉ còn là **lưới an toàn** khi năm học chưa có cấu
 * hình cho một loại cột (`assessment_type_settings.is_active = false`, hoặc dòng
 * bị xóa tay). Giá trị thật đến từ `detail.defaultWeights` — xem `queries.ts`.
 */
const FALLBACK_WEIGHTS: Record<AssessmentKind, number> = {
  quiz_15m: 1,
  midterm: 2,
  final: 3,
  attendance: 1,
  custom: 1,
};

function defaultWeightOf(detail: GradebookDetail, kind: AssessmentKind): number {
  return detail.defaultWeights[kind] ?? FALLBACK_WEIGHTS[kind];
}

/**
 * Schedule the RSC refresh after the Server Action transition has resolved.
 * Keeping the refresh inside the transition can leave the UI pending even
 * though the mutation already committed successfully.
 */
function useDeferredRefresh(classId: string) {
  const router = useRouter();
  return useCallback(() => {
    window.setTimeout(() => {
      void refreshGradebookPage(classId).then(
        () => router.refresh(),
        () => router.refresh(),
      );
    }, 100);
  }, [classId, router]);
}

function NewAssessmentForm({ detail }: { detail: GradebookDetail }) {
  const refreshAfterAction = useDeferredRefresh(detail.classId);
  const [kind, setKind] = useState<AssessmentKind>("quiz_15m");
  const [pending, startTransition] = useTransition();
  useGlobalPending(pending);
  const [message, setMessage] = useState<Message>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setMessage(null);
    startTransition(async () => {
      const result = await createAssessment({
        classId: detail.classId,
        kind,
        title: String(data.get("title") ?? ""),
        assessmentDate: String(data.get("assessmentDate") ?? "") || null,
        weight: Number(data.get("weight")),
        attendanceComponent: kind === "attendance"
          ? String(data.get("attendanceComponent") ?? "mass") as "mass" | "catechism"
          : null,
      });
      if (!result.ok) {
        setMessage({ tone: "error", text: result.message });
        return;
      }
      setMessage({ tone: "success", text: "Đã thêm cột điểm." });
      form.reset();
      setKind("quiz_15m");
      refreshAfterAction();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thêm cột điểm</CardTitle>
        <CardDescription>Số cột và loại cột do lớp tự chọn; có thể lặp cùng loại hoặc không dùng kiểm tra 15 phút.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <label className="space-y-2">
            <span className="text-sm font-medium">Loại</span>
            <select name="kind" value={kind} onChange={(event) => setKind(event.target.value as AssessmentKind)} className={selectClassName}>
              {ASSESSMENT_KINDS.map((value) => <option key={value} value={value}>{ASSESSMENT_KIND_LABELS[value]}</option>)}
            </select>
          </label>
          <div className="space-y-2 xl:col-span-2">
            <Label htmlFor="new-assessment-title">Tên cột điểm</Label>
            <Input id="new-assessment-title" name="title" maxLength={120} required placeholder="Ví dụ: Giữa kỳ HK1" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-assessment-date">Ngày kiểm tra</Label>
            <Input id="new-assessment-date" name="assessmentDate" type="date" min={detail.yearStart} max={detail.yearEnd} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`new-assessment-weight-${kind}`}>Hệ số</Label>
            <Input key={kind} id={`new-assessment-weight-${kind}`} name="weight" type="number" min="0.01" max="100" step="0.01" defaultValue={defaultWeightOf(detail, kind)} required />
          </div>
          {kind === "attendance" ? (
            <label className="space-y-2">
              <span className="text-sm font-medium">Thành phần</span>
              <select name="attendanceComponent" className={selectClassName} defaultValue="mass">
                <option value="mass">Thánh lễ</option>
                <option value="catechism">Giáo lý</option>
              </select>
            </label>
          ) : null}
          <div className="flex items-end xl:col-span-5">
            <Button type="submit" disabled={pending}>{pending ? "Đang thêm…" : "Thêm cột"}</Button>
          </div>
          {message ? <FormMessage className="md:col-span-2 xl:col-span-5" tone={MESSAGE_TONES[message.tone]}>{message.text}</FormMessage> : null}
        </form>
      </CardContent>
    </Card>
  );
}

function AssessmentSettings({
  detail,
  assessment,
  onRemoved,
}: {
  detail: GradebookDetail;
  assessment: GradebookAssessment;
  /**
   * M07-B · **D-61, và đây là cái bẫy M05-B/M06-C đã trả giá hai lần.**
   *
   * Xóa hoặc ẩn một cột thành công là **thẻ này biến mất** ngay ở lượt
   * `router.refresh()` kế tiếp. Đặt câu xác nhận vào state của chính thẻ nghĩa
   * là câu ấy chết cùng thẻ, và người vừa bấm không đọc được một chữ nào —
   * đúng hình dạng lỗi *"ghi nhận đơn cuối cùng thì thông báo bị chính lượt làm
   * mới nó kích hoạt xóa mất"* của M05-B.
   *
   * Nên câu này do **trang** giữ, không phải thẻ. Bản cũ còn tệ hơn: nó đặt
   * `setMessage(null)` khi thành công, tức xóa cột xong **cố ý** không nói gì.
   */
  onRemoved: (text: string) => void;
}) {
  const refreshAfterAction = useDeferredRefresh(detail.classId);
  const [pending, startTransition] = useTransition();
  useGlobalPending(pending);
  const [publishPending, setPublishPending] = useState(false);
  useGlobalPending(publishPending);
  const [published, setPublished] = useState(assessment.isPublished);
  const [message, setMessage] = useState<Message>(null);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const canHardDelete = assessment.scoredCount === 0;

  useEffect(() => setPublished(assessment.isPublished), [assessment.isPublished]);

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await updateAssessment({
        assessmentId: assessment.id,
        classId: detail.classId,
        kind: assessment.kind,
        title: String(data.get("title") ?? ""),
        assessmentDate: String(data.get("assessmentDate") ?? "") || null,
        weight: Number(data.get("weight")),
        attendanceComponent: assessment.attendanceComponent,
      });
      setMessage(result.ok ? { tone: "success", text: "Đã cập nhật cột điểm." } : { tone: "error", text: result.message });
      if (result.ok) refreshAfterAction();
    });
  }

  /**
   * M07-C · **TB-M07-02 / D-154** — thao tác này nay chạy được **cả khi bảng
   * điểm đã khóa**, nên nút của nó không còn tắt theo `detail.isLocked`.
   *
   * `changed = false` nghĩa là cột đã ở sẵn trạng thái ấy vì người khác vừa bấm
   * — không phải lỗi, nhưng cũng không được báo "Đã công bố" cho một lượt không
   * đổi gì.
   */
  async function togglePublish() {
    const nextPublished = !published;
    setPublishPending(true);
    try {
      const result = await setAssessmentPublished({ assessmentId: assessment.id, published: nextPublished });
      if (!result.ok) {
        setMessage({ tone: "error", text: result.message });
        return;
      }
      setPublished(nextPublished);
      setMessage(result.data.changed
        ? {
          tone: "success",
          text: published
            ? "Đã ẩn kết quả khỏi cổng phụ huynh."
            : "Đã công bố kết quả cho phụ huynh và thiếu nhi trong lớp.",
        }
        : { tone: "info", text: "Người khác vừa đổi trạng thái công bố của cột này. Màn hình đã được cập nhật." });
      refreshAfterAction();
    } finally {
      setPublishPending(false);
    }
  }

  /**
   * M07-B · **TB-M07-01 bước 1** — hai nút, chọn theo **dữ liệu thật**, vì hai
   * hậu quả khác hẳn nhau: một bên mất hẳn, một bên giữ nguyên điểm.
   *
   * M07-C · **nợ #1** — chỗ `window.confirm` đầu trong bốn chỗ cuối cùng của
   * toàn hệ thống. Đợt A và B cố ý hoãn vì `11` §4 bước 3 buộc sửa nghiệp vụ
   * trước, mà **nội dung câu hỏi đổi hẳn** sau TB-M07-01 — làm sớm là làm hai
   * lần. Nay câu hỏi đã ổn định thì mới bọc vào `ConfirmDialog`.
   */
  function remove() {
    setConfirmingRemove(false);
    startTransition(async () => {
      const result = canHardDelete
        ? await deleteAssessment(assessment.id)
        : await archiveAssessment(assessment.id);
      if (!result.ok) {
        setMessage({ tone: "error", text: result.message });
        return;
      }
      onRemoved(
        canHardDelete
          ? `Đã xóa cột “${assessment.title}”.`
          : `Đã ẩn cột “${assessment.title}”. Điểm vẫn còn nguyên; hiện lại được ở mục “Cột đã ẩn”.`,
      );
      refreshAfterAction();
    });
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={save} className="grid gap-3 md:grid-cols-[minmax(12rem,1fr)_10rem_7rem_auto] md:items-end">
          <div className="space-y-2"><Label htmlFor={`title-${assessment.id}`}>Tên cột</Label><Input id={`title-${assessment.id}`} name="title" defaultValue={assessment.title} maxLength={120} required disabled={detail.isLocked} /></div>
          <div className="space-y-2"><Label htmlFor={`date-${assessment.id}`}>Ngày</Label><Input id={`date-${assessment.id}`} name="assessmentDate" type="date" min={detail.yearStart} max={detail.yearEnd} defaultValue={assessment.assessmentDate ?? ""} disabled={detail.isLocked} /></div>
          <div className="space-y-2"><Label htmlFor={`weight-${assessment.id}`}>Hệ số</Label><Input id={`weight-${assessment.id}`} name="weight" type="number" min="0.01" max="100" step="0.01" defaultValue={assessment.weight} required disabled={detail.isLocked} /></div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" variant="outline" disabled={pending || publishPending || detail.isLocked}>Lưu</Button>
            {/*
              M07-C · TB-M07-02 / D-154 — **nút duy nhất của thẻ này còn sống
              sau khi khóa**, và nó đổi từ `ghost` sang `outline`: `06_UI_UX` §3
              ghi thẳng rằng thao tác *"có tác động ra ngoài tổ chức"* đang là
              thứ **nhẹ nhất về thị giác** trong hàng.
            */}
            <Button size="sm" variant="outline" disabled={pending || publishPending} onClick={togglePublish}>{published ? "Ẩn khỏi cổng" : "Công bố"}</Button>
            {/*
              M07-B · TB-M07-01 bước 1 — **một nút, hai nhãn**, chọn theo dữ liệu
              thật. Hai nhãn khác nhau vì hai hậu quả khác nhau; để một chữ "Xóa"
              cho cả hai ca là đúng cái đã sinh ra F04.
              🔴 Nhãn "Ẩn khỏi cổng" ở nút bên cạnh cũng đổi theo: trước đợt này
              nó là "Ẩn", cạnh một nút "Xóa" mà nay có thể đọc là "Ẩn cột" —
              hai chữ "ẩn" cạnh nhau, hai nghĩa khác hẳn.
            */}
            <Button size="sm" variant="danger" disabled={pending || publishPending || detail.isLocked} onClick={() => setConfirmingRemove(true)}>
              {canHardDelete ? "Xóa cột" : "Ẩn cột"}
            </Button>
          </div>
        </form>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant="secondary">{ASSESSMENT_KIND_LABELS[assessment.kind]}</Badge>
          {assessment.attendanceComponent ? <Badge variant="outline">{ATTENDANCE_COMPONENT_LABELS[assessment.attendanceComponent]}</Badge> : null}
          <Badge variant={published ? "success" : "outline"}>{published ? "Đã công bố" : "Nội bộ"}</Badge>
          {/*
            TB-M07-01 — nói ra con số quyết định nút nào hiện ra. Không có nó,
            hai người nhìn cùng một cột lại thấy hai nút khác nhau mà không ai
            hiểu vì sao.
          */}
          <Badge variant="outline">{canHardDelete ? "Chưa có điểm" : `${assessment.scoredCount} điểm đã nhập`}</Badge>
        </div>
        {message ? <FormMessage className="mt-3" tone={MESSAGE_TONES[message.tone]}>{message.text}</FormMessage> : null}
        <ConfirmDialog
          open={confirmingRemove}
          onClose={() => setConfirmingRemove(false)}
          onConfirm={remove}
          pending={pending}
          title={canHardDelete ? "Xóa cột điểm" : "Ẩn cột điểm khỏi bảng điểm"}
          confirmLabel={canHardDelete ? "Xóa cột" : "Ẩn cột"}
          consequence={canHardDelete ? (
            <>
              Xóa hẳn cột <strong>{assessment.title}</strong> của lớp <strong>{detail.className}</strong>.
              Cột này chưa có điểm nào nên sẽ mất luôn, không lấy lại được.
            </>
          ) : (
            <>
              Ẩn cột <strong>{assessment.title}</strong> của lớp <strong>{detail.className}</strong>.
              Cột đang có <strong>{assessment.scoredCount} điểm</strong> — điểm được giữ nguyên, nhưng
              cột sẽ biến khỏi bảng điểm, bản xuất, điểm trung bình, Top 5 và cổng phụ huynh.
              {" "}Hiện lại được bất cứ lúc nào ở mục “Cột đã ẩn”.
            </>
          )}
        />
      </CardContent>
    </Card>
  );
}

/**
 * M07-C · **nợ #21** — đường quay lại cho một cột đã ẩn.
 *
 * 🔴 Món nợ này do chính M07-B mở ra: đợt ấy biến `is_active` thành cột nghiệp
 * vụ nhưng chỉ mở **một chiều**. Điểm chưa bao giờ mất, mà mọi truy vấn của
 * module lọc `is_active` nên cột vừa ẩn không còn bề mặt nào để bấm — ẩn nhầm
 * là phải nhờ Quản trị viên hệ thống can thiệp thẳng vào cơ sở dữ liệu. Câu xác
 * nhận của đợt B đã phải nói ra điều đó; nay nó không còn đúng nữa.
 *
 * Vẫn dùng `ConfirmDialog` dù hiện lại **không** phá hủy gì: với một cột đang ở
 * trạng thái *"Đã công bố"*, hiện lại là **phụ huynh thấy lại ngay** — một hậu
 * quả ra ngoài tổ chức, và câu xác nhận nói thẳng điều đó.
 */
function HiddenAssessmentsPanel({ detail }: { detail: GradebookDetail }) {
  const refreshAfterAction = useDeferredRefresh(detail.classId);
  const [pending, startTransition] = useTransition();
  useGlobalPending(pending);
  const [message, setMessage] = useState<Message>(null);
  const [confirming, setConfirming] = useState<GradebookAssessment | null>(null);
  const [expanded, setExpanded] = useState(false);

  if (detail.hiddenAssessments.length === 0) return null;

  function restore(assessment: GradebookAssessment) {
    setConfirming(null);
    startTransition(async () => {
      const result = await restoreAssessment(assessment.id);
      setMessage(result.ok
        ? { tone: "success", text: `Đã hiện lại cột “${assessment.title}”.` }
        : { tone: "error", text: result.message });
      if (result.ok) refreshAfterAction();
    });
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Cột đã ẩn</h2>
          <p className="text-sm text-muted-foreground">
            {detail.hiddenAssessments.length} cột không tham gia bảng điểm, bản xuất, điểm trung
            bình, Top 5 và cổng phụ huynh. Điểm vẫn còn nguyên.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Thu gọn" : `Xem ${detail.hiddenAssessments.length} cột đã ẩn`}
        </Button>
      </div>
      {message ? <FormMessage tone={MESSAGE_TONES[message.tone]}>{message.text}</FormMessage> : null}
      {expanded ? (
        <ul className="space-y-2">
          {detail.hiddenAssessments.map((assessment) => (
            <li
              key={assessment.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3"
            >
              <div className="min-w-0">
                <p className="font-medium">{assessment.title}</p>
                <p className="text-sm text-muted-foreground">
                  {ASSESSMENT_KIND_LABELS[assessment.kind]} · hệ số {assessment.weight} ·{" "}
                  {assessment.scoredCount === 0 ? "chưa có điểm" : `${assessment.scoredCount} điểm đã nhập`}
                  {assessment.isPublished ? " · trạng thái công bố: Đã công bố" : ""}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={pending || detail.isLocked}
                onClick={() => setConfirming(assessment)}
              >
                Hiện lại
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
      <ConfirmDialog
        open={confirming !== null}
        onClose={() => setConfirming(null)}
        onConfirm={() => { if (confirming) restore(confirming); }}
        pending={pending}
        tone="primary"
        title="Hiện lại cột điểm"
        confirmLabel="Hiện lại cột"
        consequence={confirming ? (
          <>
            Đưa cột <strong>{confirming.title}</strong> trở lại bảng điểm của lớp{" "}
            <strong>{detail.className}</strong>. Điểm trung bình có trọng số và bản xuất sẽ tính
            lại ngay.
            {confirming.isPublished ? (
              <> Cột này đang ở trạng thái <strong>Đã công bố</strong>, nên phụ huynh và thiếu nhi
              trong lớp sẽ <strong>thấy lại điểm ngay lập tức</strong>.</>
            ) : null}
          </>
        ) : ""}
      />
    </section>
  );
}

function ScoreColumnForm({ detail, assessment }: { detail: GradebookDetail; assessment: GradebookAssessment }) {
  const refreshAfterAction = useDeferredRefresh(detail.classId);
  const [pending, setPending] = useState(false);
  useGlobalPending(pending);
  const [message, setMessage] = useState<Message>(null);

  /**
   * M07-A · **TB-M07-01 bước 5 / TB-M07-03 phương án B** — chỉ gửi **ô đã đổi**.
   * Lý do đầy đủ nằm ở `score-diff.ts`; ba dòng tóm tắt: gửi cả roster sinh dòng
   * rác khiến cột không xóa được nữa (F04), ghi đè điểm người khác trong im lặng
   * (F06), và đóng dấu "chỉnh tay" lên cả 50 em của cột chuyên cần (F07).
   */
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const drafts = detail.students.map((student) => ({
      enrollmentId: student.enrollmentId,
      score: readScoreInput(data.get(`score-${student.enrollmentId}`)),
      note: readNoteInput(data.get(`note-${student.enrollmentId}`)),
    }));
    const baselines = Object.fromEntries(
      detail.students.map((student) => [student.enrollmentId, student.scores[assessment.id]]),
    );
    const changed = changedScoreCells(drafts, baselines);
    if (changed.length === 0) {
      setMessage({ tone: "info", text: "Chưa có ô nào thay đổi nên không có gì để lưu." });
      return;
    }
    setPending(true);
    try {
      const result = await saveAssessmentScores({ assessmentId: assessment.id, scores: changed });
      setMessage(result.ok
        ? { tone: "success", text: `Đã lưu ${result.data.count} ô điểm.` }
        : { tone: "error", text: result.message });
      if (result.ok) refreshAfterAction();
    } finally {
      setPending(false);
    }
  }

  /**
   * M07-B · **TB-M07-04 / AC-04-01** — nói ra **cả hai** con số.
   *
   * 🔴 Câu cũ *"Đã cập nhật N đề xuất"* đếm gộp cả dòng bị bỏ qua, nên người
   * dùng đọc "50" rồi mở bảng ra thấy không ô nào đổi — và không có gì giải
   * thích. Ô đang chỉnh tay được giữ nguyên là **đúng**; cái sai là **không nói
   * ra**. Câu mới kèm luôn đường đi tiếp: mỗi ô ấy có nút "dùng lại đề xuất"
   * ngay dưới ô điểm của nó.
   */
  async function refreshSuggestions() {
    setMessage(null);
    setPending(true);
    try {
      const result = await refreshAttendanceScores(assessment.id);
      if (!result.ok) {
        setMessage({ tone: "error", text: result.message });
        return;
      }
      const { refreshed, skippedManual } = result.data;
      setMessage({
        tone: "success",
        text: skippedManual === 0
          ? `Đã cập nhật ${refreshed} đề xuất từ các buổi đã chốt.`
          : `Đã cập nhật ${refreshed} đề xuất · ${skippedManual} ô đang chỉnh tay được giữ nguyên. `
            + "Muốn dùng lại đề xuất cho ô nào thì bấm “Đang chỉnh tay · dùng lại đề xuất” ngay dưới ô đó.",
      });
      refreshAfterAction();
    } finally {
      setPending(false);
    }
  }

  async function resetOverride(enrollmentId: string) {
    setMessage(null);
    setPending(true);
    try {
      const result = await resetAttendanceScoreOverride({ assessmentId: assessment.id, enrollmentId });
      setMessage(result.ok ? { tone: "success", text: "Đã dùng lại điểm hệ thống đề xuất." } : { tone: "error", text: result.message });
      if (result.ok) refreshAfterAction();
    } finally {
      setPending(false);
    }
  }

  return (
    <Card id={`assessment-${assessment.id}`}>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><CardTitle>{assessment.title}</CardTitle><CardDescription>{assessment.assessmentDate ? formatDateVi(assessment.assessmentDate) : "Không ghi ngày"} · hệ số {assessment.weight}</CardDescription></div>
          <div className="flex flex-wrap gap-2">
            {assessment.kind === "attendance" && detail.canGrade && !detail.isLocked ? <Button size="sm" variant="outline" disabled={pending} onClick={refreshSuggestions}>Lấy đề xuất mới</Button> : null}
            <Badge variant={assessment.isPublished ? "success" : "outline"}>{assessment.isPublished ? "Đã công bố" : "Nội bộ"}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit}>
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full min-w-[34rem] text-sm">
              <caption className="sr-only">Nhập điểm {assessment.title}</caption>
              <thead className="bg-muted/50"><tr><th className="sticky left-0 bg-muted px-3 py-3 text-left">Thiếu nhi</th><th className="w-32 px-3 py-3 text-left">Điểm</th><th className="px-3 py-3 text-left">Ghi chú</th></tr></thead>
              <tbody>
                {detail.students.map((student) => {
                  const score = student.scores[assessment.id];
                  return (
                    <tr key={student.enrollmentId} className="border-t border-border">
                      <th className="sticky left-0 bg-card px-3 py-2 text-left font-medium">{student.saintName} {student.fullName}</th>
                      <td className="px-3 py-2">
                        <Input key={`${assessment.id}-${student.enrollmentId}-${score?.score ?? "null"}`} name={`score-${student.enrollmentId}`} type="number" min="0" max={assessment.maxScore} step="0.01" defaultValue={score?.score ?? ""} disabled={detail.isLocked || !detail.canGrade} aria-label={`Điểm ${student.saintName} ${student.fullName}`} />
                        {assessment.kind === "attendance" ? (
                          <div className="mt-1 space-y-1 text-xs text-muted-foreground">
                            <p>Đề xuất: {score?.suggestedScore === null || score?.suggestedScore === undefined ? "—" : score.suggestedScore.toFixed(2)}</p>
                            {score?.isManualOverride ? <button type="button" className="min-h-11 text-primary underline" disabled={pending || detail.isLocked} onClick={() => resetOverride(student.enrollmentId)}>Đang chỉnh tay · dùng lại đề xuất</button> : null}
                          </div>
                        ) : null}
                      </td>
                      {/*
                        `key` theo giá trị đang lưu — bắt buộc từ M07-A. Ô này là
                        ô **không kiểm soát**: sau `router.refresh()` React giữ
                        nguyên giá trị trong DOM nếu không remount, nên ghi chú do
                        người khác vừa sửa **không** hiện lên. Trước đợt này chỉ
                        khó chịu; nay phép so "ô đã đổi chưa" đọc chính ô này, nên
                        một giá trị cũ kẹt lại sẽ bị tính là **đã đổi** và ghi đè
                        đúng thứ vừa được cập nhật. Ô điểm bên cạnh đã làm vậy sẵn.
                      */}
                      <td className="px-3 py-2"><Input key={`${assessment.id}-${student.enrollmentId}-note-${score?.note ?? "null"}`} name={`note-${student.enrollmentId}`} defaultValue={score?.note ?? ""} maxLength={500} disabled={detail.isLocked || !detail.canGrade} aria-label={`Ghi chú ${student.saintName} ${student.fullName}`} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {detail.canGrade ? <Button className="mt-3" type="submit" disabled={pending || detail.isLocked}>{pending ? "Đang lưu…" : `Lưu điểm ${assessment.title}`}</Button> : null}
          {message ? <FormMessage className="mt-3" tone={MESSAGE_TONES[message.tone]}>{message.text}</FormMessage> : null}
        </form>
      </CardContent>
    </Card>
  );
}

/**
 * M07-B · **TB-M07-05 bước 1 / AC-05-01 / BR-M07-32** — ô chọn mức hiển thị,
 * mặc định **nội bộ**, và nói ra hậu quả khi chọn công khai.
 *
 * 🔴 Trước đợt này mặc định là *"Công khai cho phụ huynh/thiếu nhi"*: viết vội
 * một câu về một em rồi bấm Thêm là câu ấy **ra thẳng cổng phụ huynh**, không
 * một dòng cảnh báo. Đảo mặc định thì ca nguy hiểm cần một hành động **có ý
 * thức**, còn ca an toàn vẫn là một cú bấm.
 */
function CommentVisibilityField({
  id,
  value,
  onChange,
  disabled,
}: {
  id: string;
  value: CommentVisibility;
  onChange: (next: CommentVisibility) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Mức hiển thị</Label>
      <Select
        id={id}
        name="visibility"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as CommentVisibility)}
      >
        <option value="staff_only">{COMMENT_VISIBILITY_LABELS.staff_only}</option>
        <option value="student_visible">{COMMENT_VISIBILITY_LABELS.student_visible}</option>
      </Select>
      {/*
        `info` chứ không phải `danger`: công khai một nhận xét là việc **bình
        thường và hợp lệ**, chỉ cần nói rõ hậu quả. Tô đỏ kèm `role="alert"` sẽ
        đọc thành "bạn vừa làm sai" mỗi lần một Giáo lý viên chọn đúng thứ họ
        định chọn. `FormMessage` chỉ có bốn sắc thái và thêm sắc thái mới là sửa
        design system đã duyệt (`09`) — ngoài phạm vi đợt này.
      */}
      {value === "student_visible" ? (
        <FormMessage tone="info">
          Nội dung này sẽ hiện trên cổng phụ huynh/thiếu nhi.
        </FormMessage>
      ) : (
        <p className="text-xs text-muted-foreground">
          Ghi chú nội bộ — phụ huynh và thiếu nhi không đọc được, kể cả số lượng.
        </p>
      )}
    </div>
  );
}

function CommentItem({
  detail,
  comment,
  studentName,
  pending,
  onSaved,
  onRemoved,
  onFailed,
  startTransition,
}: {
  detail: GradebookDetail;
  comment: GradebookStudent["comments"][number];
  /** Tên em — `11` §5 đòi hộp xác nhận nêu hậu quả **bằng tên riêng**. */
  studentName: string;
  pending: boolean;
  onSaved: (text: string) => void;
  onRemoved: (text: string) => void;
  onFailed: (text: string) => void;
  startTransition: (action: () => void) => void;
}) {
  const refreshAfterAction = useDeferredRefresh(detail.classId);
  const [editing, setEditing] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [visibility, setVisibility] = useState<CommentVisibility>(comment.visibility);
  const canWrite = detail.canComment && !detail.isLocked && comment.canModerate;

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await updateStudentComment({
        commentId: comment.id,
        visibility,
        content: String(data.get("content") ?? ""),
      });
      if (!result.ok) {
        onFailed(result.message);
        return;
      }
      setEditing(false);
      onSaved("Đã cập nhật nhận xét.");
      refreshAfterAction();
    });
  }

  /** M07-C · nợ #1 — chỗ `window.confirm` thứ hai trong bốn. */
  function remove() {
    setConfirmingRemove(false);
    startTransition(async () => {
      const result = await deleteStudentComment(comment.id);
      if (!result.ok) {
        onFailed(result.message);
        return;
      }
      onRemoved("Đã xóa nhận xét.");
      refreshAfterAction();
    });
  }

  return (
    <li className="rounded-md border border-border p-3 text-sm">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <Badge variant={comment.visibility === "student_visible" ? "success" : "warning"}>
          {COMMENT_VISIBILITY_LABELS[comment.visibility]}
        </Badge>
        {canWrite && !editing ? (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => setEditing(true)}>Sửa</Button>
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => setConfirmingRemove(true)}>Xóa</Button>
          </div>
        ) : null}
      </div>
      <ConfirmDialog
        open={confirmingRemove}
        onClose={() => setConfirmingRemove(false)}
        onConfirm={remove}
        pending={pending}
        title="Xóa nhận xét"
        confirmLabel="Xóa nhận xét"
        consequence={
          <>
            Xóa nhận xét về <strong>{studentName}</strong> do{" "}
            <strong>{comment.authorName}</strong> viết ngày{" "}
            <strong>{formatDateVi(comment.commentDate)}</strong>.
            {" "}Hệ thống <strong>không lưu lịch sử nhận xét</strong> nên nội dung này mất hẳn,
            không ai lấy lại được.
          </>
        }
      />
      {editing ? (
        <form onSubmit={save} className="space-y-3">
          <CommentVisibilityField
            id={`comment-visibility-${comment.id}`}
            value={visibility}
            onChange={setVisibility}
            disabled={pending}
          />
          <div className="space-y-2">
            <Label htmlFor={`comment-content-${comment.id}`}>Nội dung</Label>
            <Textarea
              id={`comment-content-${comment.id}`}
              name="content"
              defaultValue={comment.content}
              maxLength={2000}
              required
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" disabled={pending}>{pending ? "Đang lưu…" : "Lưu nhận xét"}</Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => { setEditing(false); setVisibility(comment.visibility); }}
            >
              Hủy
            </Button>
          </div>
        </form>
      ) : (
        <p className="whitespace-pre-wrap">{comment.content}</p>
      )}
      <p className="mt-2 text-xs text-muted-foreground">{comment.authorName} · {formatDateVi(comment.commentDate)}</p>
    </li>
  );
}

function CommentComposer({
  classId,
  enrollmentId,
  pending,
  onAdded,
  onFailed,
  startTransition,
}: {
  classId: string;
  enrollmentId: string;
  pending: boolean;
  onAdded: (text: string) => void;
  onFailed: (text: string) => void;
  startTransition: (action: () => void) => void;
}) {
  const refreshAfterAction = useDeferredRefresh(classId);
  const [visibility, setVisibility] = useState<CommentVisibility>("staff_only");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    startTransition(async () => {
      const result = await createStudentComment({
        enrollmentId,
        visibility,
        content: String(data.get("content") ?? ""),
      });
      if (!result.ok) {
        onFailed(result.message);
        return;
      }
      form.reset();
      setVisibility("staff_only");
      onAdded("Đã thêm nhận xét.");
      refreshAfterAction();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <CommentVisibilityField
        id={`new-comment-visibility-${enrollmentId}`}
        value={visibility}
        onChange={setVisibility}
        disabled={pending}
      />
      <div className="space-y-2">
        <Label htmlFor={`new-comment-content-${enrollmentId}`}>Nội dung</Label>
        <Textarea id={`new-comment-content-${enrollmentId}`} name="content" maxLength={2000} required />
      </div>
      <Button type="submit" disabled={pending}>Thêm nhận xét</Button>
    </form>
  );
}

function StudentCommentsPanel({ detail }: { detail: GradebookDetail }) {
  const [pending, startTransition] = useTransition();
  useGlobalPending(pending);
  const [message, setMessage] = useState<Message>(null);

  /**
   * D-61 — câu trả lời do **panel** giữ, không do từng thẻ nhận xét giữ.
   *
   * Xóa một nhận xét là làm chính thẻ đang chứa câu ấy biến mất. Bản cũ còn tệ
   * hơn: nó `setMessage(null)` khi thành công, tức **cố ý không nói gì** sau
   * một thao tác không hoàn tác được.
   */
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Nhận xét</h2>
        <p className="text-sm text-muted-foreground">
          Nhận xét công khai hiển thị trên cổng phụ huynh/thiếu nhi; ghi chú nội bộ không rò nội
          dung lẫn số lượng. Sửa và xóa dành cho người viết, Giáo lý viên đại diện lớp và Ban điều
          hành xứ đoàn.
        </p>
      </div>
      {message ? <FormMessage tone={MESSAGE_TONES[message.tone]}>{message.text}</FormMessage> : null}
      <div className="grid gap-4 xl:grid-cols-2">
        {detail.students.map((student) => (
          <Card key={student.enrollmentId}>
            <CardHeader>
              <CardTitle>{student.saintName} {student.fullName}</CardTitle>
              <CardDescription>{student.comments.length} nhận xét trong phạm vi bạn được xem</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {student.comments.length === 0 ? <p className="text-sm text-muted-foreground">Chưa có nhận xét.</p> : (
                <ul className="space-y-3">
                  {student.comments.map((comment) => (
                    <CommentItem
                      key={comment.id}
                      detail={detail}
                      comment={comment}
                      studentName={`${student.saintName} ${student.fullName}`}
                      pending={pending}
                      startTransition={startTransition}
                      onSaved={(text) => setMessage({ tone: "success", text })}
                      onRemoved={(text) => setMessage({ tone: "success", text })}
                      onFailed={(text) => setMessage({ tone: "error", text })}
                    />
                  ))}
                </ul>
              )}
              {detail.canComment && !detail.isLocked ? (
                <CommentComposer
                  classId={detail.classId}
                  enrollmentId={student.enrollmentId}
                  pending={pending}
                  startTransition={startTransition}
                  onAdded={(text) => setMessage({ tone: "success", text })}
                  onFailed={(text) => setMessage({ tone: "error", text })}
                />
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function NewLeaderboardForm({
  detail,
  onCreated,
}: {
  detail: GradebookDetail;
  onCreated: (leaderboard: GradebookLeaderboard) => void;
}) {
  const refreshAfterAction = useDeferredRefresh(detail.classId);
  const [sourceType, setSourceType] = useState<LeaderboardSourceType>("assessment");
  const [pending, setPending] = useState(false);
  useGlobalPending(pending);
  const [message, setMessage] = useState<Message>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setPending(true);
    void (async () => {
      try {
      const title = String(data.get("title") ?? "");
      const sourceAssessmentId = sourceType === "assessment"
        ? String(data.get("sourceAssessmentId") ?? "") || null
        : null;
      const result = await createLeaderboard({
        classId: detail.classId,
        title,
        sourceType,
        sourceAssessmentId,
      });
      setMessage(result.ok ? { tone: "success", text: "Đã tạo bảng Top 5. Hãy xem trước trước khi công bố." } : { tone: "error", text: result.message });
      if (result.ok) {
        onCreated({
          id: result.data.id,
          title,
          sourceType,
          sourceAssessmentId,
          isPublished: false,
          publishedAt: null,
          hasSnapshot: false,
          supersededCount: 0,
          entries: [],
        });
        form.reset();
        setSourceType("assessment");
        refreshAfterAction();
      }
      } finally {
        setPending(false);
      }
    })();
  }

  return (
    <Card>
      <CardHeader><CardTitle>Tạo Top 5</CardTitle><CardDescription>Có thể công bố từ một bài kiểm tra, điểm tạm, tổng kết hoặc đợt thi đua riêng.</CardDescription></CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2"><Label htmlFor="leaderboard-title">Tiêu đề</Label><Input id="leaderboard-title" name="title" maxLength={120} required placeholder="Top 5 tháng 10" /></div>
          <label className="space-y-2"><span className="text-sm font-medium">Nguồn</span><select name="sourceType" value={sourceType} onChange={(event) => setSourceType(event.target.value as LeaderboardSourceType)} className={selectClassName}>{LEADERBOARD_SOURCE_TYPES.map((value) => <option key={value} value={value}>{LEADERBOARD_SOURCE_LABELS[value]}</option>)}</select></label>
          {sourceType === "assessment" ? <label className="space-y-2"><span className="text-sm font-medium">Cột điểm</span><select name="sourceAssessmentId" className={selectClassName} required defaultValue=""><option value="">Chọn cột điểm</option>{detail.assessments.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label> : <div />}
          <div className="md:col-span-3"><Button type="submit" disabled={pending}>{pending ? "Đang tạo…" : "Tạo bảng Top 5"}</Button></div>
          {message ? <FormMessage className="md:col-span-3" tone={MESSAGE_TONES[message.tone]}>{message.text}</FormMessage> : null}
        </form>
      </CardContent>
    </Card>
  );
}

/**
 * M07-C · **TB-M07-06 / D-155 / BR-M07-34 · BR-M07-35** — vòng đời Top 5 nói ra
 * thành lời.
 *
 * 🔴 Trước đợt này thẻ chỉ biết **hai** trạng thái (`is_published` bật/tắt), mà
 * đời thật có **ba**, và cái thứ ba là chỗ mất dữ liệu: *"đã chốt danh sách
 * nhưng đang ẩn"*. Ở trạng thái ấy nút "Công bố snapshot" **tính lại** theo
 * điểm mới nhất — em đứng hạng 5 hôm trước biến mất, không ai được báo, bản cũ
 * không còn ở đâu (F16). Nhãn *"Ẩn khỏi portal"* thì không hề nói rằng bấm hiện
 * lại sẽ xếp hạng lại.
 *
 * Chủ dự án chọn phương án **B** (2026-08-06): giữ khả năng tính lại, nhưng bản
 * đang có được **lưu vào lịch sử** trước khi bị thay. Nên ở trạng thái thứ ba
 * có **hai** nút khác hẳn nhau, và nhãn của chúng là toàn bộ khác biệt:
 *
 *   · *"Hiện lại bản đang có"* — chỉ bật cờ, danh sách y nguyên.
 *   · *"Chốt lại danh sách"*   — tính lại, bản đang có xuống lịch sử.
 */
function LeaderboardCard({ detail, leaderboard }: { detail: GradebookDetail; leaderboard: GradebookLeaderboard }) {
  const refreshAfterAction = useDeferredRefresh(detail.classId);
  const [pending, setPending] = useState(false);
  useGlobalPending(pending);
  const [message, setMessage] = useState<Message>(null);
  const [isPublished, setIsPublished] = useState(leaderboard.isPublished);
  const [hasSnapshot, setHasSnapshot] = useState(leaderboard.hasSnapshot);
  const [confirming, setConfirming] = useState<"publish" | "delete" | null>(null);
  const [pendingForm, setPendingForm] = useState<FormData | null>(null);
  // Bản đang giữ hiện ra ngay cả khi đã ẩn: đó chính là thứ người dùng phải
  // nhìn thấy để chọn giữa "hiện lại" và "chốt lại".
  const [preview, setPreview] = useState<LeaderboardPreviewEntry[] | null>(
    leaderboard.entries.length > 0
      ? leaderboard.entries.map((entry) => ({ enrollmentId: entry.enrollmentId, saintName: entry.saintName, fullName: entry.fullName, score: entry.score, rank: entry.rank }))
      : null,
  );
  useEffect(() => setIsPublished(leaderboard.isPublished), [leaderboard.isPublished]);
  useEffect(() => setHasSnapshot(leaderboard.hasSnapshot), [leaderboard.hasSnapshot]);

  const isDraft = !hasSnapshot;

  function operationInput(data: FormData) {
    return {
      leaderboardId: leaderboard.id,
      customScores: leaderboard.sourceType === "custom_competition"
        ? detail.students.map((student) => ({ enrollmentId: student.enrollmentId, score: Number(data.get(`custom-${student.enrollmentId}`)) }))
        : null,
    };
  }

  function previewList(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);
    void (async () => {
      try {
      const result = await previewLeaderboard(operationInput(data));
      setMessage(result.ok ? { tone: "success", text: "Đây là snapshot sẽ được công bố." } : { tone: "error", text: result.message });
      setPreview(result.ok ? result.data : null);
      } finally {
        setPending(false);
      }
    })();
  }

  /** M07-C · nợ #1 — chỗ `window.confirm` thứ ba trong bốn. */
  function publish() {
    const data = pendingForm;
    setConfirming(null);
    setPendingForm(null);
    if (!data) return;
    setPending(true);
    void (async () => {
      try {
      const result = await publishLeaderboard(operationInput(data));
      setMessage(result.ok ? { tone: "success", text: `Đã công bố ${result.data.count} vị trí.` } : { tone: "error", text: result.message });
      if (result.ok) {
        setIsPublished(true);
        setHasSnapshot(true);
        refreshAfterAction();
      }
      } finally {
        setPending(false);
      }
    })();
  }

  function unpublish() {
    setPending(true);
    void (async () => {
      try {
      const result = await unpublishLeaderboard(leaderboard.id);
      setMessage(result.ok
        ? { tone: "success", text: "Đã ẩn Top 5 khỏi cổng phụ huynh. Danh sách vẫn được giữ nguyên." }
        : { tone: "error", text: result.message });
      if (result.ok) {
        setIsPublished(false);
        refreshAfterAction();
      }
      } finally {
        setPending(false);
      }
    })();
  }

  function republish() {
    setPending(true);
    void (async () => {
      try {
      const result = await republishLeaderboard(leaderboard.id);
      setMessage(result.ok
        ? { tone: "success", text: "Đã hiện lại đúng danh sách đang giữ, không tính lại." }
        : { tone: "error", text: result.message });
      if (result.ok) {
        setIsPublished(true);
        refreshAfterAction();
      }
      } finally {
        setPending(false);
      }
    })();
  }

  function remove() {
    setConfirming(null);
    setPending(true);
    void (async () => {
      try {
      const result = await deleteLeaderboard(leaderboard.id);
      if (!result.ok) {
        setMessage({ tone: "error", text: result.message });
        return;
      }
      refreshAfterAction();
      } finally {
        setPending(false);
      }
    })();
  }

  const sourceAssessment = detail.assessments.find((item) => item.id === leaderboard.sourceAssessmentId);
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{leaderboard.title}</CardTitle>
            <CardDescription>{LEADERBOARD_SOURCE_LABELS[leaderboard.sourceType]}{sourceAssessment ? ` · ${sourceAssessment.title}` : ""}</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {/*
              Ba trạng thái, ba nhãn. "Bản nháp" và "Đã chốt · đang ẩn" trước
              đợt này đội chung một chữ "Bản nháp" — mà một cái xóa được còn cái
              kia thì không, và một cái chưa có gì còn cái kia đang giữ danh
              sách đã công bố cho phụ huynh xem.
            */}
            <Badge variant={isPublished ? "success" : "outline"}>
              {isPublished ? "Đã công bố" : isDraft ? "Bản nháp" : "Đã chốt · đang ẩn"}
            </Badge>
            {leaderboard.supersededCount > 0 ? (
              <Badge variant="secondary">{leaderboard.supersededCount} bản trước trong lịch sử</Badge>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isPublished ? (
          <div className="flex justify-end">{detail.canManageTop5 ? <Button size="sm" variant="outline" disabled={pending} onClick={unpublish}>Ẩn khỏi cổng</Button> : null}</div>
        ) : detail.canManageTop5 ? (
          <form className="space-y-3" onSubmit={previewList}>
            {leaderboard.sourceType === "custom_competition" ? <div className="grid gap-2 sm:grid-cols-2">{detail.students.map((student) => <label key={student.enrollmentId} className="grid grid-cols-[1fr_8rem] items-center gap-2 text-sm"><span>{student.saintName} {student.fullName}</span><Input name={`custom-${student.enrollmentId}`} type="number" min="-1000000" max="1000000" step="0.01" required aria-label={`Điểm thi đua ${student.saintName} ${student.fullName}`} /></label>)}</div> : null}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" variant="outline" disabled={pending}>Xem trước</Button>
              {/*
                🔴 Nút này là chỗ mất dữ liệu của F16, nên nó phải cầm được
                `FormData` của biểu mẫu **trước khi** hộp thoại mở: hộp thoại
                dựng lại cây DOM và `event.currentTarget.form` sau đó là `null`.
                Bản cũ đọc `form` ngay trong `onClick` vì `window.confirm` chặn
                luồng đồng bộ — một thói quen chỉ đúng với hộp thoại của trình
                duyệt.
              */}
              <Button
                type="button"
                variant={isDraft ? "primary" : "danger"}
                disabled={pending}
                onClick={(event) => {
                  const form = event.currentTarget.form;
                  if (!form) return;
                  setPendingForm(new FormData(form));
                  setConfirming("publish");
                }}
              >
                {isDraft ? "Công bố snapshot" : "Chốt lại danh sách"}
              </Button>
              {!isDraft ? (
                <Button type="button" disabled={pending} onClick={republish}>Hiện lại bản đang có</Button>
              ) : null}
              {isDraft ? (
                <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => setConfirming("delete")}>
                  Xóa bản nháp
                </Button>
              ) : null}
            </div>
          </form>
        ) : null}
        {preview ? <ol className="space-y-2">{preview.map((entry) => <li key={entry.enrollmentId} className="flex items-center gap-3 rounded-md border border-border p-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-bold text-white">{entry.rank}</span><span className="min-w-0 flex-1 font-medium">{entry.saintName} {entry.fullName}</span><span className="font-semibold tabular-nums">{entry.score === null ? "—" : entry.score.toFixed(2)}</span></li>)}</ol> : <p className="text-sm text-muted-foreground">Chưa có bản xem trước.</p>}
        {message ? <FormMessage tone={MESSAGE_TONES[message.tone]}>{message.text}</FormMessage> : null}
        <ConfirmDialog
          open={confirming === "publish"}
          onClose={() => { setConfirming(null); setPendingForm(null); }}
          onConfirm={publish}
          pending={pending}
          tone={isDraft ? "primary" : "danger"}
          title={isDraft ? "Công bố Top 5" : "Chốt lại danh sách Top 5"}
          confirmLabel={isDraft ? "Công bố" : "Chốt lại"}
          consequence={isDraft ? (
            <>
              Công bố bảng <strong>{leaderboard.title}</strong> của lớp{" "}
              <strong>{detail.className}</strong> cho phụ huynh và thiếu nhi trong lớp.
              {" "}Danh sách được chốt tại thời điểm này và <strong>không tự đổi</strong> khi điểm
              nguồn thay đổi về sau.
            </>
          ) : (
            <>
              Xếp hạng lại bảng <strong>{leaderboard.title}</strong> theo điểm{" "}
              <strong>mới nhất</strong>. Danh sách 5 em có thể khác bản đang giữ.
              {" "}Bản đang giữ được lưu vào lịch sử (bản thứ{" "}
              <strong>{leaderboard.supersededCount + 1}</strong>) và{" "}
              <strong>không ai xóa được nữa</strong>.
              {" "}Muốn giữ nguyên danh sách cũ thì bấm “Hiện lại bản đang có”.
            </>
          )}
        />
        <ConfirmDialog
          open={confirming === "delete"}
          onClose={() => setConfirming(null)}
          onConfirm={remove}
          pending={pending}
          title="Xóa bản nháp Top 5"
          confirmLabel="Xóa bản nháp"
          consequence={
            <>
              Xóa bảng <strong>{leaderboard.title}</strong> của lớp{" "}
              <strong>{detail.className}</strong>. Bảng này <strong>chưa từng công bố</strong> nên
              không có danh sách nào bị mất, nhưng thao tác không hoàn tác được.
            </>
          }
        />
      </CardContent>
    </Card>
  );
}

function LeaderboardPanel({ detail }: { detail: GradebookDetail }) {
  const [createdLeaderboards, setCreatedLeaderboards] = useState<GradebookLeaderboard[]>([]);
  const leaderboards = [
    ...detail.leaderboards,
    ...createdLeaderboards.filter(
      (created) => !detail.leaderboards.some((item) => item.id === created.id),
    ),
  ];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Top 5</h2>
        <p className="text-sm text-muted-foreground">
          Danh sách đã chốt không tự đổi khi điểm nguồn thay đổi. Muốn xếp hạng lại thì bấm “Chốt
          lại danh sách” — bản đang giữ được lưu vào lịch sử, không mất đi.
        </p>
      </div>
      {!detail.top5Enabled ? <Card><CardContent className="pt-6 text-sm text-muted-foreground">Super Admin chưa bật tính năng Top 5 cho năm học này.</CardContent></Card> : null}
      {detail.top5Enabled && detail.canManageTop5 ? (
        <NewLeaderboardForm
          detail={detail}
          onCreated={(leaderboard) => setCreatedLeaderboards((current) => [...current, leaderboard])}
        />
      ) : null}
      {leaderboards.map((leaderboard) => <LeaderboardCard key={leaderboard.id} detail={detail} leaderboard={leaderboard} />)}
      {detail.top5Enabled && leaderboards.length === 0 ? <Card><CardContent className="pt-6 text-sm text-muted-foreground">Chưa có bảng Top 5.</CardContent></Card> : null}
    </section>
  );
}

export function GradebookEditor({ detail }: { detail: GradebookDetail }) {
  const refreshAfterAction = useDeferredRefresh(detail.classId);
  const [lockPending, startLockTransition] = useTransition();
  useGlobalPending(lockPending);
  const [lockMessage, setLockMessage] = useState<Message>(null);
  /**
   * M07-B · D-61 — câu trả lời cho **xóa/ẩn cột**, giữ ở đây chứ không ở thẻ
   * cột, vì thẻ ấy biến mất ngay lượt làm mới kế tiếp. Xem chú thích ở
   * `AssessmentSettings`.
   *
   * Đặt trong thẻ trạng thái đầu trang — vùng **duy nhất luôn tồn tại**. Khối
   * "Cấu hình cột điểm" thì không: xóa cột cuối cùng là cả khối biến mất, mang
   * theo câu vừa đặt vào đó.
   */
  const [columnMessage, setColumnMessage] = useState<Message>(null);
  const [confirmingLock, setConfirmingLock] = useState<boolean | null>(null);
  /** M07-C · nợ #1 — chỗ `window.confirm` **cuối cùng của toàn hệ thống**. */
  function changeLock(nextLocked: boolean) {
    setConfirmingLock(null);
    startLockTransition(async () => {
      const result = nextLocked ? await lockGradebook(detail.classId) : await unlockGradebook(detail.classId);
      setLockMessage(result.ok
        ? { tone: "success", text: nextLocked ? "Đã khóa bảng điểm." : "Đã mở khóa bảng điểm." }
        : { tone: "error", text: result.message });
      if (result.ok) refreshAfterAction();
    });
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={detail.isLocked ? "warning" : "success"}>{detail.isLocked ? "Đã khóa" : "Đang mở"}</Badge>
            <span className="text-sm text-muted-foreground">{detail.assessments.length} cột điểm · {detail.students.length} thiếu nhi</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a href={`/results/${detail.classId}/export?format=xlsx`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>Xuất Excel</a>
            <a href={`/results/${detail.classId}/export?format=pdf`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>Xuất PDF</a>
            {!detail.isLocked && detail.canLock ? <Button size="sm" variant="danger" disabled={lockPending} onClick={() => setConfirmingLock(true)}>Khóa bảng điểm</Button> : null}
            {detail.isLocked && detail.canUnlock ? <Button size="sm" variant="outline" disabled={lockPending} onClick={() => setConfirmingLock(false)}>Mở khóa</Button> : null}
          </div>
        </CardContent>
        {lockMessage ? <CardContent className="pt-0"><FormMessage tone={MESSAGE_TONES[lockMessage.tone]}>{lockMessage.text}</FormMessage></CardContent> : null}
        {columnMessage ? <CardContent className="pt-0"><FormMessage tone={MESSAGE_TONES[columnMessage.tone]}>{columnMessage.text}</FormMessage></CardContent> : null}
        <ConfirmDialog
          open={confirmingLock !== null}
          onClose={() => setConfirmingLock(null)}
          onConfirm={() => { if (confirmingLock !== null) changeLock(confirmingLock); }}
          pending={lockPending}
          tone={confirmingLock ? "danger" : "primary"}
          title={confirmingLock ? "Khóa bảng điểm" : "Mở khóa bảng điểm"}
          confirmLabel={confirmingLock ? "Khóa bảng điểm" : "Mở khóa"}
          consequence={confirmingLock ? (
            <>
              Khóa bảng điểm lớp <strong>{detail.className}</strong> ({detail.assessments.length} cột
              điểm · {detail.students.length} thiếu nhi). Sau khi khóa,{" "}
              <strong>không ai sửa được</strong> điểm, hệ số, cấu trúc cột hay nhận xét — chỉ Quản
              trị viên hệ thống mở lại được.
              {/*
                M07-C · D-154 — câu này là **mới**, và nó là thứ duy nhất người
                dùng nhìn thấy của cả hạng mục TB-M07-02. Không nói ra thì họ
                vẫn tưởng khóa là đóng sạch, rồi cuối năm đi nhờ mở khóa cả bảng
                điểm chỉ để công bố một cột.
              */}
              {" "}Riêng việc <strong>công bố kết quả cho phụ huynh</strong> thì vẫn bật/tắt được
              sau khi khóa.
            </>
          ) : (
            <>
              Mở lại bảng điểm lớp <strong>{detail.className}</strong>. Giáo lý viên của lớp sẽ sửa
              được điểm, hệ số, cấu trúc cột và nhận xét trở lại.
            </>
          )}
        />
      </Card>

      {detail.canGrade && !detail.isLocked ? <NewAssessmentForm detail={detail} /> : null}

      {detail.assessments.length > 0 && detail.canGrade ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Cấu hình cột điểm</h2>
          {detail.assessments.map((assessment) => (
            <AssessmentSettings
              key={assessment.id}
              detail={detail}
              assessment={assessment}
              onRemoved={(text) => setColumnMessage({ tone: "success", text })}
            />
          ))}
        </section>
      ) : null}

      {detail.canGrade ? <HiddenAssessmentsPanel detail={detail} /> : null}

      {detail.assessments.length === 0 ? (
        <Card><CardContent className="pt-6 text-sm text-muted-foreground">Lớp chưa tạo cột điểm. Đây là trạng thái hợp lệ; không có cột bắt buộc.</CardContent></Card>
      ) : (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Nhập điểm</h2>
          <div className="hidden space-y-4 md:block">{detail.assessments.map((assessment) => <ScoreColumnForm key={assessment.id} detail={detail} assessment={assessment} />)}</div>
          <div className="space-y-4 md:hidden">{detail.assessments.map((assessment) => <ScoreColumnForm key={assessment.id} detail={detail} assessment={assessment} />)}</div>
        </section>
      )}

      <Card>
        <CardHeader><CardTitle>Điểm trung bình có trọng số</CardTitle><CardDescription>Chỉ tính các ô đã nhập; thay hệ số cập nhật kết quả ngay.</CardDescription></CardHeader>
        <CardContent>
          <div className="overflow-x-auto"><table className="w-full min-w-[24rem] text-sm"><thead><tr className="border-b border-border"><th className="py-3 text-left">Thiếu nhi</th><th className="py-3 text-right">Điểm trung bình</th></tr></thead><tbody>{detail.students.map((student) => <tr key={student.enrollmentId} className="border-b border-border last:border-0"><td className="py-3">{student.saintName} {student.fullName}</td><td className="py-3 text-right font-semibold tabular-nums">{student.weightedAverage === null ? "—" : student.weightedAverage.toFixed(2)}</td></tr>)}</tbody></table></div>
        </CardContent>
      </Card>

      <StudentCommentsPanel detail={detail} />

      <LeaderboardPanel detail={detail} />
    </div>
  );
}
