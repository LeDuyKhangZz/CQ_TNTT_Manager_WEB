"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  type LeaderboardSourceType,
} from "../constants";
import {
  createAssessment,
  createStudentComment,
  createLeaderboard,
  deleteAssessment,
  deleteStudentComment,
  lockGradebook,
  previewLeaderboard,
  publishLeaderboard,
  refreshAttendanceScores,
  resetAttendanceScoreOverride,
  saveAssessmentScores,
  setAssessmentPublished,
  unlockGradebook,
  unpublishLeaderboard,
  updateAssessment,
} from "../server/actions";
import type { LeaderboardPreviewEntry } from "../server/actions";
import type { GradebookAssessment, GradebookDetail, GradebookLeaderboard } from "../server/queries";

const selectClassName = "h-11 min-h-11 w-full rounded-md border border-border bg-card px-3 text-sm";
type Message = { tone: "success" | "error"; text: string } | null;

const DEFAULT_WEIGHTS: Record<AssessmentKind, number> = {
  quiz_15m: 1,
  midterm: 2,
  final: 3,
  attendance: 1,
  custom: 1,
};

function scoreFrom(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? "").trim();
  return text === "" ? null : Number(text);
}

function NewAssessmentForm({ detail }: { detail: GradebookDetail }) {
  const router = useRouter();
  const [kind, setKind] = useState<AssessmentKind>("quiz_15m");
  const [pending, startTransition] = useTransition();
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
      router.refresh();
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
            <Input key={kind} id={`new-assessment-weight-${kind}`} name="weight" type="number" min="0.01" max="100" step="0.01" defaultValue={DEFAULT_WEIGHTS[kind]} required />
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
          {message ? <FormMessage className="md:col-span-2 xl:col-span-5" tone={message.tone === "error" ? "danger" : "success"}>{message.text}</FormMessage> : null}
        </form>
      </CardContent>
    </Card>
  );
}

function AssessmentSettings({ detail, assessment }: { detail: GradebookDetail; assessment: GradebookAssessment }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<Message>(null);

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
      if (result.ok) router.refresh();
    });
  }

  function togglePublish() {
    startTransition(async () => {
      const result = await setAssessmentPublished({ assessmentId: assessment.id, published: !assessment.isPublished });
      setMessage(result.ok ? { tone: "success", text: assessment.isPublished ? "Đã ẩn kết quả khỏi portal." : "Đã công bố kết quả." } : { tone: "error", text: result.message });
      if (result.ok) router.refresh();
    });
  }

  function remove() {
    if (!window.confirm(`Xóa cột “${assessment.title}”? Chỉ cột chưa có điểm mới xóa được.`)) return;
    startTransition(async () => {
      const result = await deleteAssessment(assessment.id);
      setMessage(result.ok ? null : { tone: "error", text: result.message });
      if (result.ok) router.refresh();
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
            <Button type="submit" size="sm" variant="outline" disabled={pending || detail.isLocked}>Lưu</Button>
            <Button size="sm" variant="ghost" disabled={pending || detail.isLocked} onClick={togglePublish}>{assessment.isPublished ? "Ẩn" : "Công bố"}</Button>
            <Button size="sm" variant="danger" disabled={pending || detail.isLocked} onClick={remove}>Xóa</Button>
          </div>
        </form>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant="secondary">{ASSESSMENT_KIND_LABELS[assessment.kind]}</Badge>
          {assessment.attendanceComponent ? <Badge variant="outline">{ATTENDANCE_COMPONENT_LABELS[assessment.attendanceComponent]}</Badge> : null}
          <Badge variant={assessment.isPublished ? "success" : "outline"}>{assessment.isPublished ? "Đã công bố" : "Nội bộ"}</Badge>
        </div>
        {message ? <FormMessage className="mt-3" tone={message.tone === "error" ? "danger" : "success"}>{message.text}</FormMessage> : null}
      </CardContent>
    </Card>
  );
}

function ScoreColumnForm({ detail, assessment }: { detail: GradebookDetail; assessment: GradebookAssessment }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<Message>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveAssessmentScores({
        assessmentId: assessment.id,
        scores: detail.students.map((student) => ({
          enrollmentId: student.enrollmentId,
          score: scoreFrom(data.get(`score-${student.enrollmentId}`)),
          note: String(data.get(`note-${student.enrollmentId}`) ?? "").trim() || null,
        })),
      });
      setMessage(result.ok ? { tone: "success", text: `Đã lưu ${result.data.count} dòng điểm.` } : { tone: "error", text: result.message });
      if (result.ok) router.refresh();
    });
  }

  function refreshSuggestions() {
    setMessage(null);
    startTransition(async () => {
      const result = await refreshAttendanceScores(assessment.id);
      setMessage(result.ok ? { tone: "success", text: `Đã cập nhật ${result.data.count} đề xuất từ các buổi đã chốt.` } : { tone: "error", text: result.message });
      if (result.ok) router.refresh();
    });
  }

  function resetOverride(enrollmentId: string) {
    setMessage(null);
    startTransition(async () => {
      const result = await resetAttendanceScoreOverride({ assessmentId: assessment.id, enrollmentId });
      setMessage(result.ok ? { tone: "success", text: "Đã dùng lại điểm hệ thống đề xuất." } : { tone: "error", text: result.message });
      if (result.ok) router.refresh();
    });
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
                      <td className="px-3 py-2"><Input name={`note-${student.enrollmentId}`} defaultValue={score?.note ?? ""} maxLength={500} disabled={detail.isLocked || !detail.canGrade} aria-label={`Ghi chú ${student.saintName} ${student.fullName}`} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {detail.canGrade ? <Button className="mt-3" type="submit" disabled={pending || detail.isLocked}>{pending ? "Đang lưu…" : `Lưu điểm ${assessment.title}`}</Button> : null}
          {message ? <FormMessage className="mt-3" tone={message.tone === "error" ? "danger" : "success"}>{message.text}</FormMessage> : null}
        </form>
      </CardContent>
    </Card>
  );
}

function StudentCommentsPanel({ detail }: { detail: GradebookDetail }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<Message>(null);

  function addComment(event: FormEvent<HTMLFormElement>, enrollmentId: string) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    startTransition(async () => {
      const result = await createStudentComment({
        enrollmentId,
        visibility: String(data.get("visibility") ?? "student_visible") as "student_visible" | "staff_only",
        content: String(data.get("content") ?? ""),
      });
      setMessage(result.ok ? { tone: "success", text: "Đã thêm nhận xét." } : { tone: "error", text: result.message });
      if (result.ok) {
        form.reset();
        router.refresh();
      }
    });
  }

  function removeComment(commentId: string) {
    if (!window.confirm("Xóa nhận xét này?")) return;
    startTransition(async () => {
      const result = await deleteStudentComment(commentId);
      setMessage(result.ok ? null : { tone: "error", text: result.message });
      if (result.ok) router.refresh();
    });
  }

  return (
    <section className="space-y-4">
      <div><h2 className="text-lg font-semibold">Nhận xét</h2><p className="text-sm text-muted-foreground">Nhận xét công khai hiển thị trên portal; ghi chú nội bộ không rò nội dung hoặc số lượng.</p></div>
      {message ? <FormMessage tone={message.tone === "error" ? "danger" : "success"}>{message.text}</FormMessage> : null}
      <div className="grid gap-4 xl:grid-cols-2">
        {detail.students.map((student) => (
          <Card key={student.enrollmentId}>
            <CardHeader><CardTitle>{student.saintName} {student.fullName}</CardTitle><CardDescription>{student.comments.length} nhận xét trong phạm vi bạn được xem</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {student.comments.length === 0 ? <p className="text-sm text-muted-foreground">Chưa có nhận xét.</p> : (
                <ul className="space-y-3">
                  {student.comments.map((comment) => (
                    <li key={comment.id} className="rounded-md border border-border p-3 text-sm">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <Badge variant={comment.visibility === "student_visible" ? "success" : "warning"}>{COMMENT_VISIBILITY_LABELS[comment.visibility]}</Badge>
                        {detail.canComment && !detail.isLocked ? <Button size="sm" variant="ghost" disabled={pending} onClick={() => removeComment(comment.id)}>Xóa</Button> : null}
                      </div>
                      <p className="whitespace-pre-wrap">{comment.content}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{comment.authorName} · {formatDateVi(comment.commentDate)}</p>
                    </li>
                  ))}
                </ul>
              )}
              {detail.canComment && !detail.isLocked ? (
                <form onSubmit={(event) => addComment(event, student.enrollmentId)} className="space-y-3">
                  <label className="space-y-2"><span className="text-sm font-medium">Mức hiển thị</span><select name="visibility" className={selectClassName} defaultValue="student_visible"><option value="student_visible">Công khai cho phụ huynh/thiếu nhi</option><option value="staff_only">Nội bộ nhân sự</option></select></label>
                  <label className="space-y-2"><span className="text-sm font-medium">Nội dung</span><textarea name="content" className="min-h-24 w-full rounded-md border border-border bg-card px-3 py-2 text-sm" maxLength={2000} required /></label>
                  <Button type="submit" disabled={pending}>Thêm nhận xét</Button>
                </form>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function NewLeaderboardForm({ detail }: { detail: GradebookDetail }) {
  const router = useRouter();
  const [sourceType, setSourceType] = useState<LeaderboardSourceType>("assessment");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<Message>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    startTransition(async () => {
      const result = await createLeaderboard({
        classId: detail.classId,
        title: String(data.get("title") ?? ""),
        sourceType,
        sourceAssessmentId: sourceType === "assessment" ? String(data.get("sourceAssessmentId") ?? "") || null : null,
      });
      setMessage(result.ok ? { tone: "success", text: "Đã tạo bảng Top 5. Hãy xem trước trước khi công bố." } : { tone: "error", text: result.message });
      if (result.ok) {
        form.reset();
        setSourceType("assessment");
        router.refresh();
      }
    });
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
          {message ? <FormMessage className="md:col-span-3" tone={message.tone === "error" ? "danger" : "success"}>{message.text}</FormMessage> : null}
        </form>
      </CardContent>
    </Card>
  );
}

function LeaderboardCard({ detail, leaderboard }: { detail: GradebookDetail; leaderboard: GradebookLeaderboard }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<Message>(null);
  const [preview, setPreview] = useState<LeaderboardPreviewEntry[] | null>(leaderboard.isPublished ? leaderboard.entries.map((entry) => ({ enrollmentId: entry.enrollmentId, saintName: entry.saintName, fullName: entry.fullName, score: entry.score, rank: entry.rank })) : null);

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
    startTransition(async () => {
      const result = await previewLeaderboard(operationInput(data));
      setMessage(result.ok ? { tone: "success", text: "Đây là snapshot sẽ được công bố." } : { tone: "error", text: result.message });
      setPreview(result.ok ? result.data : null);
    });
  }

  function publish(form: HTMLFormElement) {
    const data = new FormData(form);
    if (!window.confirm("Công bố snapshot Top 5 này cho phụ huynh và thiếu nhi trong lớp?")) return;
    startTransition(async () => {
      const result = await publishLeaderboard(operationInput(data));
      setMessage(result.ok ? { tone: "success", text: `Đã công bố ${result.data.count} vị trí.` } : { tone: "error", text: result.message });
      if (result.ok) router.refresh();
    });
  }

  function unpublish() {
    startTransition(async () => {
      const result = await unpublishLeaderboard(leaderboard.id);
      setMessage(result.ok ? { tone: "success", text: "Đã ẩn Top 5 khỏi portal." } : { tone: "error", text: result.message });
      if (result.ok) router.refresh();
    });
  }

  const sourceAssessment = detail.assessments.find((item) => item.id === leaderboard.sourceAssessmentId);
  return (
    <Card>
      <CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle>{leaderboard.title}</CardTitle><CardDescription>{LEADERBOARD_SOURCE_LABELS[leaderboard.sourceType]}{sourceAssessment ? ` · ${sourceAssessment.title}` : ""}</CardDescription></div><Badge variant={leaderboard.isPublished ? "success" : "outline"}>{leaderboard.isPublished ? "Đã công bố" : "Bản nháp"}</Badge></div></CardHeader>
      <CardContent className="space-y-4">
        {leaderboard.isPublished ? (
          <div className="flex justify-end">{detail.canManageTop5 ? <Button size="sm" variant="outline" disabled={pending} onClick={unpublish}>Ẩn khỏi portal</Button> : null}</div>
        ) : detail.canManageTop5 ? (
          <form className="space-y-3" onSubmit={previewList}>
            {leaderboard.sourceType === "custom_competition" ? <div className="grid gap-2 sm:grid-cols-2">{detail.students.map((student) => <label key={student.enrollmentId} className="grid grid-cols-[1fr_8rem] items-center gap-2 text-sm"><span>{student.saintName} {student.fullName}</span><Input name={`custom-${student.enrollmentId}`} type="number" min="-1000000" max="1000000" step="0.01" required aria-label={`Điểm thi đua ${student.saintName} ${student.fullName}`} /></label>)}</div> : null}
            <div className="flex flex-wrap gap-2"><Button type="submit" variant="outline" disabled={pending}>Xem trước</Button><Button type="button" disabled={pending} onClick={(event) => { if (event.currentTarget.form) publish(event.currentTarget.form); }}>Công bố snapshot</Button></div>
          </form>
        ) : null}
        {preview ? <ol className="space-y-2">{preview.map((entry) => <li key={entry.enrollmentId} className="flex items-center gap-3 rounded-md border border-border p-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-bold text-white">{entry.rank}</span><span className="min-w-0 flex-1 font-medium">{entry.saintName} {entry.fullName}</span><span className="font-semibold tabular-nums">{entry.score === null ? "—" : entry.score.toFixed(2)}</span></li>)}</ol> : <p className="text-sm text-muted-foreground">Chưa có bản xem trước.</p>}
        {message ? <FormMessage tone={message.tone === "error" ? "danger" : "success"}>{message.text}</FormMessage> : null}
      </CardContent>
    </Card>
  );
}

function LeaderboardPanel({ detail }: { detail: GradebookDetail }) {
  return (
    <section className="space-y-4">
      <div><h2 className="text-lg font-semibold">Top 5</h2><p className="text-sm text-muted-foreground">Snapshot đã công bố không tự đổi khi điểm nguồn thay đổi.</p></div>
      {!detail.top5Enabled ? <Card><CardContent className="pt-6 text-sm text-muted-foreground">Super Admin chưa bật tính năng Top 5 cho năm học này.</CardContent></Card> : null}
      {detail.top5Enabled && detail.canManageTop5 ? <NewLeaderboardForm detail={detail} /> : null}
      {detail.leaderboards.map((leaderboard) => <LeaderboardCard key={leaderboard.id} detail={detail} leaderboard={leaderboard} />)}
      {detail.top5Enabled && detail.leaderboards.length === 0 ? <Card><CardContent className="pt-6 text-sm text-muted-foreground">Chưa có bảng Top 5.</CardContent></Card> : null}
    </section>
  );
}

export function GradebookEditor({ detail }: { detail: GradebookDetail }) {
  const router = useRouter();
  const [lockPending, startLockTransition] = useTransition();
  const [lockMessage, setLockMessage] = useState<Message>(null);
  const [mobileAssessmentId, setMobileAssessmentId] = useState(detail.assessments[0]?.id ?? "");
  const visibleAssessments = mobileAssessmentId
    ? detail.assessments.filter((item) => item.id === mobileAssessmentId)
    : detail.assessments;

  function changeLock(nextLocked: boolean) {
    const question = nextLocked
      ? "Khóa bảng điểm? Sau khi khóa, chỉ Super Admin có thể mở lại."
      : "Mở khóa bảng điểm này?";
    if (!window.confirm(question)) return;
    startLockTransition(async () => {
      const result = nextLocked ? await lockGradebook(detail.classId) : await unlockGradebook(detail.classId);
      setLockMessage(result.ok
        ? { tone: "success", text: nextLocked ? "Đã khóa bảng điểm." : "Đã mở khóa bảng điểm." }
        : { tone: "error", text: result.message });
      if (result.ok) router.refresh();
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
            {!detail.isLocked && detail.canLock ? <Button size="sm" variant="danger" disabled={lockPending} onClick={() => changeLock(true)}>Khóa bảng điểm</Button> : null}
            {detail.isLocked && detail.canUnlock ? <Button size="sm" variant="outline" disabled={lockPending} onClick={() => changeLock(false)}>Mở khóa</Button> : null}
          </div>
        </CardContent>
        {lockMessage ? <CardContent className="pt-0"><FormMessage tone={lockMessage.tone === "error" ? "danger" : "success"}>{lockMessage.text}</FormMessage></CardContent> : null}
      </Card>

      {detail.canGrade && !detail.isLocked ? <NewAssessmentForm detail={detail} /> : null}

      {detail.assessments.length > 0 && detail.canGrade ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Cấu hình cột điểm</h2>
          {detail.assessments.map((assessment) => <AssessmentSettings key={assessment.id} detail={detail} assessment={assessment} />)}
        </section>
      ) : null}

      {detail.assessments.length === 0 ? (
        <Card><CardContent className="pt-6 text-sm text-muted-foreground">Lớp chưa tạo cột điểm. Đây là trạng thái hợp lệ; không có cột bắt buộc.</CardContent></Card>
      ) : (
        <section className="space-y-4">
          <div className="space-y-2 md:hidden">
            <Label htmlFor="mobile-assessment">Chọn cột điểm để nhập</Label>
            <select id="mobile-assessment" className={selectClassName} value={mobileAssessmentId} onChange={(event) => setMobileAssessmentId(event.target.value)}>
              {detail.assessments.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
            </select>
          </div>
          <h2 className="text-lg font-semibold">Nhập điểm</h2>
          <div className="hidden space-y-4 md:block">{detail.assessments.map((assessment) => <ScoreColumnForm key={assessment.id} detail={detail} assessment={assessment} />)}</div>
          <div className="space-y-4 md:hidden">{visibleAssessments.map((assessment) => <ScoreColumnForm key={assessment.id} detail={detail} assessment={assessment} />)}</div>
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
