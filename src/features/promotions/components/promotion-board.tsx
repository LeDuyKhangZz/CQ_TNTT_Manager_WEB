"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateVi } from "@/lib/dates";
import { PROMOTION_PROPOSAL_STATUSES, PROMOTION_STATUS_LABELS, type PromotionProposalStatus } from "../constants";
import { proposePromotion, reviewPromotion } from "../server/actions";
import type { PromotionRosterItem, PromotionTargetOption } from "../server/queries";

const selectClassName = "h-11 min-h-11 w-full rounded-md border border-border bg-card px-3 text-sm";
type Message = { tone: "success" | "error"; text: string } | null;

function WarningSummary({ item }: { item: PromotionRosterItem }) {
  const warning = item.review?.warningSnapshot;
  if (!warning) return null;
  const flags = [
    warning.warnConsecutiveAbsence ? "vắng liên tiếp" : null,
    warning.warnConsecutiveSunday ? "vắng Chúa Nhật liên tiếp" : null,
    warning.warnLowRate ? "tỷ lệ tham dự thấp" : null,
  ].filter(Boolean);
  return (
    <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
      <span>TB: {warning.weightedAverage ?? "—"}</span>
      <span className="mx-2">•</span>
      <span>Lễ: {warning.massAttendanceScore ?? "—"}</span>
      <span className="mx-2">•</span>
      <span>Giáo lý: {warning.catechismAttendanceScore ?? "—"}</span>
      {flags.length > 0 ? <p className="mt-1 text-warning">Cảnh báo tham khảo: {flags.join(", ")}.</p> : null}
    </div>
  );
}

function PromotionCard({ item, targets }: { item: PromotionRosterItem; targets: PromotionTargetOption[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<PromotionProposalStatus>(item.review?.proposedStatus ?? "recommended_promote");
  const [trainee, setTrainee] = useState(item.review?.proposeTrainee ?? false);
  const [message, setMessage] = useState<Message>(null);
  const targetOptions = useMemo(() => targets.filter((target) => {
    if (target.yearStart <= item.yearStart || target.classKind !== "catechism") return false;
    return status === "recommended_repeat"
      ? target.gradeLevelId === item.gradeLevelId
      : target.gradeLevelId === item.nextGradeLevelId;
  }), [item.gradeLevelId, item.nextGradeLevelId, item.yearStart, status, targets]);
  const needsTarget = status === "recommended_promote" || status === "recommended_repeat";
  const defaultTarget = item.review?.proposedTargetClassId ?? targetOptions[0]?.id ?? "";

  function submitProposal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setMessage(null);
    startTransition(async () => {
      const result = await proposePromotion({
        sourceEnrollmentId: item.enrollmentId,
        proposedStatus: status,
        targetClassId: needsTarget && !trainee ? String(data.get("targetClassId") ?? "") || null : null,
        proposeTrainee: trainee,
        note: String(data.get("note") ?? "") || null,
      });
      setMessage(result.ok
        ? { tone: "success", text: "Đã lưu đề xuất chuyển lớp." }
        : { tone: "error", text: result.message });
      if (result.ok) router.refresh();
    });
  }

  function runReview(form: HTMLFormElement, decision: "approve" | "reject") {
    if (!item.review) return;
    const data = new FormData(form);
    setMessage(null);
    startTransition(async () => {
      const result = await reviewPromotion({
        reviewId: item.review!.id,
        decision,
        targetClassId: decision === "approve" && !item.review!.proposeTrainee
          ? String(data.get("reviewTargetClassId") ?? "") || null
          : null,
        note: String(data.get("reviewNote") ?? "") || null,
      });
      setMessage(result.ok
        ? { tone: "success", text: decision === "approve" ? "Đã duyệt và cập nhật ghi danh." : "Đã từ chối đề xuất." }
        : { tone: "error", text: result.message });
      if (result.ok) router.refresh();
    });
  }

  const reviewTargets = item.review?.proposedStatus === "recommended_repeat"
    ? targets.filter((target) => target.yearStart > item.yearStart && target.classKind === "catechism" && target.gradeLevelId === item.gradeLevelId)
    : targets.filter((target) => target.yearStart > item.yearStart && target.classKind === "catechism" && target.gradeLevelId === item.nextGradeLevelId);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><CardTitle>{item.studentName}</CardTitle><CardDescription>{item.className} · {item.yearCode}</CardDescription></div>
          {item.review ? <Badge variant={item.review.finalStatus === "approved" ? "success" : item.review.finalStatus === "rejected" ? "danger" : "warning"}>{PROMOTION_STATUS_LABELS[item.review.finalStatus]}</Badge> : <Badge>Chưa đề xuất</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {item.review ? (
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Đề xuất:</span> {item.review.proposeTrainee ? "Đề nghị vào Dự trưởng" : PROMOTION_STATUS_LABELS[item.review.proposedStatus]}</p>
            <p className="text-muted-foreground">Gửi ngày {formatDateVi(item.review.proposedAt.slice(0, 10))}{item.review.representativeNote ? ` · ${item.review.representativeNote}` : ""}</p>
            {item.review.reviewNote ? <p><span className="font-medium">Ý kiến duyệt:</span> {item.review.reviewNote}</p> : null}
          </div>
        ) : null}
        <WarningSummary item={item} />

        {item.canPropose && item.review?.finalStatus !== "approved" ? (
          <form onSubmit={submitProposal} className="grid gap-3 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium">Đề xuất</span>
              <select value={status} onChange={(event) => { setStatus(event.target.value as PromotionProposalStatus); setTrainee(false); }} className={selectClassName}>
                {PROMOTION_PROPOSAL_STATUSES.map((value) => <option value={value} key={value}>{PROMOTION_STATUS_LABELS[value]}</option>)}
              </select>
            </label>
            {needsTarget && !trainee ? (
              <label className="space-y-2">
                <span className="text-sm font-medium">Lớp đích</span>
                <select key={`${status}-${defaultTarget}`} name="targetClassId" defaultValue={defaultTarget} required className={selectClassName}>
                  <option value="">Chọn lớp</option>
                  {targetOptions.map((target) => <option value={target.id} key={target.id}>{target.displayName} · {target.academicYearCode}</option>)}
                </select>
              </label>
            ) : null}
            {status === "recommended_promote" && item.canProposeTrainee ? (
              <label className="flex min-h-11 items-center gap-2 text-sm md:col-span-2">
                <input type="checkbox" checked={trainee} onChange={(event) => setTrainee(event.target.checked)} /> Đề xuất vào Dự trưởng (hệ thống chọn lớp năm sau khi duyệt)
              </label>
            ) : null}
            <div className="space-y-2 md:col-span-2"><Label htmlFor={`proposal-note-${item.enrollmentId}`}>Ghi chú đại diện</Label><Input id={`proposal-note-${item.enrollmentId}`} name="note" maxLength={1000} defaultValue={item.review?.representativeNote ?? ""} /></div>
            <div className="md:col-span-2"><Button type="submit" disabled={pending}>{pending ? "Đang lưu…" : "Lưu đề xuất"}</Button></div>
          </form>
        ) : null}

        {item.canReview && item.review?.finalStatus === "pending" ? (
          <form className="grid gap-3 border-t border-border pt-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); runReview(event.currentTarget, "approve"); }}>
            {!item.review.proposeTrainee && ["recommended_promote", "recommended_repeat"].includes(item.review.proposedStatus) ? (
              <label className="space-y-2">
                <span className="text-sm font-medium">Lớp đích khi duyệt</span>
                <select name="reviewTargetClassId" defaultValue={item.review.proposedTargetClassId ?? ""} required className={selectClassName}>
                  {reviewTargets.map((target) => <option value={target.id} key={target.id}>{target.displayName} · {target.academicYearCode}</option>)}
                </select>
              </label>
            ) : null}
            <div className="space-y-2 md:col-span-2"><Label htmlFor={`review-note-${item.enrollmentId}`}>Ý kiến trưởng ngành</Label><Input id={`review-note-${item.enrollmentId}`} name="reviewNote" maxLength={1000} /></div>
            <div className="flex flex-wrap gap-2 md:col-span-2">
              <Button type="submit" disabled={pending}>{pending ? "Đang xử lý…" : "Duyệt"}</Button>
              <Button type="button" variant="outline" disabled={pending} onClick={(event) => { if (event.currentTarget.form) runReview(event.currentTarget.form, "reject"); }}>Từ chối</Button>
            </div>
          </form>
        ) : null}
        {message ? <FormMessage tone={message.tone === "error" ? "danger" : "success"}>{message.text}</FormMessage> : null}
      </CardContent>
    </Card>
  );
}

export function PromotionBoard({ roster, targets }: { roster: PromotionRosterItem[]; targets: PromotionTargetOption[] }) {
  if (roster.length === 0) return <Card><CardContent className="pt-6 text-sm text-muted-foreground">Không có ghi danh đang mở trong phạm vi của bạn.</CardContent></Card>;
  return <div className="grid gap-4 xl:grid-cols-2">{roster.map((item) => <PromotionCard key={item.enrollmentId} item={item} targets={targets} />)}</div>;
}
