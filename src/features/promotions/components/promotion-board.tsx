"use client";
import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormMessage } from "@/components/ui/form-message";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatDateVi } from "@/lib/dates";
import {
  PROMOTION_PROPOSAL_STATUSES,
  PROMOTION_STATUS_LABELS,
  type PromotionProposalStatus,
} from "../constants";
import {
  batchTargetScope,
  describeBatchConsequence,
  describeBatchOverflow,
  describeMixedGrades,
  summarizeBatchOutcome,
  takeBatchSelection,
  type PromotionBatchCandidate,
} from "../batch-proposal";
import { defaultTargetClassId } from "../promotion-directory";
import {
  hasPromotionHistory,
  promotionEventActorName,
  promotionEventLabel,
  type PromotionReviewEvent,
} from "../review-journal";
import {
  approveConfirmLabel,
  describeApproveConsequence,
} from "../review-consequence";
import {
  describeCompleteSacraments,
  describeMissingSacraments,
  requiresReviewNote,
} from "../sacrament-warning";
import {
  describeTransferConsequence,
  describeTransferSuccess,
  transferConfirmLabel,
} from "../transfer-consequence";
import {
  proposePromotion,
  proposePromotionBatch,
  reviewPromotion,
  transferEnrollmentNow,
} from "../server/actions";
import type { PromotionRosterItem, PromotionTargetOption } from "../server/queries";

type Message = { tone: "success" | "error"; text: string } | null;

const CELL = "block px-0 py-1 md:table-cell md:px-3 md:py-2 md:align-middle";
const MOBILE_LABEL = "mr-2 inline-block min-w-24 text-xs font-medium text-ink-muted md:hidden";

function statusBadge(item: PromotionRosterItem) {
  if (!item.review) return <Badge variant="outline">Chưa đề xuất</Badge>;
  const variant =
    item.review.finalStatus === "approved"
      ? "success"
      : item.review.finalStatus === "rejected"
        ? "danger"
        : "warning";
  return <Badge variant={variant}>{PROMOTION_STATUS_LABELS[item.review.finalStatus]}</Badge>;
}

/** `"Ấu 2A · 2091-2092"` — tên lớp **kèm năm học**: cùng một tên lớp tồn tại ở mọi năm. */
function targetLabelOf(targets: readonly PromotionTargetOption[], targetClassId: string): string | null {
  const target = targets.find((option) => option.id === targetClassId);
  return target ? `${target.displayName} · ${target.academicYearCode}` : null;
}

function WarningSummary({ item }: { item: PromotionRosterItem }) {
  const warning = item.review?.warningSnapshot;
  if (!warning) return null;
  const flags = [
    warning.warnConsecutiveAbsence ? "vắng liên tiếp" : null,
    warning.warnConsecutiveSunday ? "vắng Chúa Nhật liên tiếp" : null,
    warning.warnLowRate ? "tỷ lệ tham dự thấp" : null,
  ].filter(Boolean);
  // D-156/D-161 — BR-M08-X1 lần đầu có người tiêu thụ. Khoá có thể VẮNG (lớp
  // không phải cấp cuối ngành, hoặc đề xuất tạo trước M08-B) và cả hai hàm dưới
  // đây trả `null` khi vắng.
  const missingText = describeMissingSacraments(warning);
  const completeText = describeCompleteSacraments(warning);
  return (
    <div className="rounded-md bg-surface-muted p-3 text-xs text-ink-muted">
      <span data-numeric>TB: {warning.weightedAverage ?? "—"}</span>
      <span className="mx-2">•</span>
      <span data-numeric>Lễ: {warning.massAttendanceScore ?? "—"}</span>
      <span className="mx-2">•</span>
      <span data-numeric>Giáo lý: {warning.catechismAttendanceScore ?? "—"}</span>
      {flags.length > 0 ? (
        <p className="mt-1 text-warning">Cảnh báo tham khảo: {flags.join(", ")}.</p>
      ) : null}
      {missingText ? (
        <p className="mt-1 font-medium text-warning">
          {missingText} Cảnh báo này <strong>không chặn</strong> việc lên lớp, nhưng người duyệt phải
          nêu ý kiến.
        </p>
      ) : null}
      {completeText ? <p className="mt-1">{completeText}</p> : null}
    </div>
  );
}

/**
 * Nhật ký quyết định — **D-157 / AC-18**, nay kèm **tên người** (M08-C, hạng mục 8).
 *
 * Chỉ hiện khi có **nhiều hơn một** bước: một dòng "đã gửi đề xuất" lặp lại đúng
 * thứ panel vừa ghi ở trên. Xem `hasPromotionHistory`.
 */
function DecisionJournal({ events }: { events: readonly PromotionReviewEvent[] }) {
  if (!hasPromotionHistory(events)) return null;
  return (
    <section className="rounded-md border border-line bg-surface p-3">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
        Nhật ký quyết định
      </h4>
      <ol className="mt-2 space-y-1 text-xs">
        {events.map((event) => {
          const actor = promotionEventActorName(event);
          return (
            <li key={event.eventNo} className="flex flex-wrap gap-x-2">
              <span className="font-medium text-ink">{promotionEventLabel(event.eventType)}</span>
              {/* Tên người đứng sau vai trò của bước, không thay nó: khi cửa sổ
                  hẹp không tra được tên, dòng vẫn đọc trọn nghĩa. */}
              {actor ? <span className="text-ink">{actor}</span> : null}
              <span className="text-ink-muted">{formatDateVi(event.occurredAt.slice(0, 10))}</span>
              {event.note ? <span className="basis-full text-ink">“{event.note}”</span> : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/**
 * Hai biểu mẫu của một em — nội dung thẻ cũ, nay nằm trong panel mở ra từ bảng.
 *
 * `06_UI_UX_RECOMMENDATIONS` §1 nêu đúng vấn đề của bản cũ: *"Trộn 2 vai trò
 * trong cùng một card — với global-write, một card có tới 2 form chồng nhau;
 * ranh giới trách nhiệm mờ."* Gấp vào panel không xoá được điều đó, nhưng nó
 * kéo cả hai ra khỏi **danh sách**, nên việc quét mắt tìm em cần xử lý không
 * còn phải cuộn qua hai biểu mẫu cho mỗi em.
 */
function PromotionDetailPanel({
  item,
  targets,
}: {
  item: PromotionRosterItem;
  targets: PromotionTargetOption[];
}) {
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

  // BR-M08-X2 — `docs/03` WF-11 "mặc định giữ nhánh A/B". Bản cũ lấy phần tử
  // đầu danh sách đã sắp theo tên, nên một em Ấu 1B luôn được đề xuất sẵn sang
  // Ấu 2A. Xem `defaultTargetClassId`.
  const defaultTarget =
    item.review?.proposedTargetClassId
    ?? defaultTargetClassId(item.sectionCode, targetOptions.map((target) => ({
      id: target.id,
      sectionCode: target.sectionCode,
      displayName: target.displayName,
    })));

  const reviewTargets = targets.filter((target) => {
    if (target.yearStart <= item.yearStart || target.classKind !== "catechism") return false;
    return item.review?.proposedStatus === "recommended_repeat"
      ? target.gradeLevelId === item.gradeLevelId
      : target.gradeLevelId === item.nextGradeLevelId;
  });

  /**
   * **D-159 — bốn vai trò cấp xứ đoàn thấy MỘT nút "Chuyển lớp" thay cho hai
   * biểu mẫu.** Chỉ khi **chưa có đề xuất nào**: một đề xuất đang chờ là quyết
   * định của người khác, và xử lý nó là việc của biểu mẫu duyệt bên dưới —
   * `promote_enrollment_now` sẽ ghi đè nó, thứ không ai định làm khi bấm một nút
   * tên là "Chuyển lớp".
   */
  const directMode = item.canTransferDirectly && !item.review;
  const [pendingTransfer, setPendingTransfer] = useState<{
    targetClassId: string | null;
    note: string | null;
  } | null>(null);

  /**
   * **AC-14 — hộp xác nhận trước khi Duyệt.** Giữ đúng thứ đã đọc từ biểu mẫu tại
   * thời điểm bấm, cùng lý do đã ghi ở `pendingTransfer`: cây DOM dựng lại giữa
   * hai lượt nên đọc lại biểu mẫu sau một ranh giới bất đồng bộ là đọc vào một
   * phần tử đã bị tháo (bài học nợ #1 ở M07-C).
   */
  const [pendingApprove, setPendingApprove] = useState<{
    targetClassId: string | null;
    note: string | null;
  } | null>(null);

  function submitProposal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const targetClassId = needsTarget && !trainee ? String(data.get("targetClassId") ?? "") || null : null;
    const note = String(data.get("note") ?? "") || null;

    // 🔴 `FormData` chụp **trước** khi mở hộp thoại — bài học nợ #1 ở M07-C: cây
    // DOM dựng lại giữa hai lượt, nên đọc lại biểu mẫu sau một ranh giới bất đồng
    // bộ là đọc vào một phần tử đã bị tháo.
    if (directMode) {
      setMessage(null);
      setPendingTransfer({ targetClassId, note });
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const result = await proposePromotion({
        sourceEnrollmentId: item.enrollmentId,
        proposedStatus: status,
        targetClassId,
        proposeTrainee: trainee,
        note,
      });
      setMessage(result.ok
        ? { tone: "success", text: `Đã gửi đề xuất của ${item.studentName} cho Trưởng ngành duyệt.` }
        : { tone: "error", text: result.message });
      if (result.ok) router.refresh();
    });
  }

  function runDirectTransfer() {
    if (!pendingTransfer) return;
    const payload = pendingTransfer;
    setPendingTransfer(null);
    startTransition(async () => {
      const result = await transferEnrollmentNow({
        sourceEnrollmentId: item.enrollmentId,
        proposedStatus: status,
        targetClassId: payload.targetClassId,
        proposeTrainee: trainee,
        note: payload.note,
      });
      setMessage(result.ok
        ? { tone: "success", text: describeTransferSuccess(item.studentName, status, trainee) }
        : { tone: "error", text: result.message });
      if (result.ok) router.refresh();
    });
  }

  function runReview(
    decision: "approve" | "reject",
    payload: { targetClassId: string | null; note: string | null },
  ) {
    if (!item.review) return;
    const reviewId = item.review.id;
    setMessage(null);
    startTransition(async () => {
      const result = await reviewPromotion({
        reviewId,
        decision,
        targetClassId: payload.targetClassId,
        note: payload.note,
      });
      setMessage(result.ok
        ? {
            tone: "success",
            text: decision === "approve"
              ? `Đã duyệt và cập nhật ghi danh của ${item.studentName}.`
              : `Đã từ chối đề xuất của ${item.studentName}.`,
          }
        : { tone: "error", text: result.message });
      if (result.ok) router.refresh();
    });
  }

  /** Đọc hai ô của biểu mẫu duyệt **một lần**, ngay trong lượt bấm. */
  function readReviewForm(form: HTMLFormElement): { targetClassId: string | null; note: string | null } {
    const data = new FormData(form);
    const proposeTrainee = item.review?.proposeTrainee ?? false;
    return {
      targetClassId: !proposeTrainee ? String(data.get("reviewTargetClassId") ?? "") || null : null,
      note: String(data.get("reviewNote") ?? "") || null,
    };
  }

  function requestApprove(form: HTMLFormElement) {
    setMessage(null);
    setPendingApprove(readReviewForm(form));
  }

  function runApprove() {
    if (!pendingApprove) return;
    const payload = pendingApprove;
    setPendingApprove(null);
    runReview("approve", payload);
  }

  /**
   * **AC-15 — từ chối phải nêu lý do.** Chặn ở đây **và** ở `promotionReviewSchema`:
   * AC-15 đòi nguyên văn *"hiện lỗi … **và** server cũng từ chối, không chỉ chặn
   * ở client"*. Lượt chặn ở đây chỉ để câu lỗi hiện ra **ngay cạnh ô** thay vì
   * sau một vòng đi về máy chủ.
   */
  function requestReject(form: HTMLFormElement) {
    const payload = readReviewForm(form);
    if (!(payload.note ?? "").trim()) {
      setMessage({ tone: "error", text: "Vui lòng nêu lý do từ chối." });
      form.querySelector<HTMLTextAreaElement>('textarea[name="reviewNote"]')?.focus();
      return;
    }
    // Từ chối **không** tạo và không đóng ghi danh nào, và đại diện gửi lại được
    // (BR-M08-16) — nên không có hộp xác nhận ở đây. Xem `review-consequence.ts`.
    runReview("reject", { targetClassId: null, note: payload.note });
  }

  // AC-16 vế ba. Đọc từ **snapshot đã chốt lúc đề xuất** (BR-M08-21) chứ không
  // tính lại — hai người duyệt cùng một đề xuất phải gặp cùng một yêu cầu.
  const noteRequired = requiresReviewNote(item.review?.warningSnapshot);

  const noteId = `proposal-note-${item.enrollmentId}`;
  const statusId = `proposal-status-${item.enrollmentId}`;
  const targetId = `proposal-target-${item.enrollmentId}`;
  const reviewTargetId = `review-target-${item.enrollmentId}`;
  const reviewNoteId = `review-note-${item.enrollmentId}`;

  return (
    <div className="space-y-4 border-l-2 border-theme-border bg-surface-muted/40 p-4">
      {item.review ? (
        <div className="space-y-1 text-sm">
          <p>
            <span className="font-medium">Đề xuất hiện tại:</span>{" "}
            {item.review.proposeTrainee
              ? "Đề nghị vào Dự trưởng"
              : PROMOTION_STATUS_LABELS[item.review.proposedStatus]}
          </p>
          {/* Hạng mục 8 — `06_UI_UX_RECOMMENDATIONS` §3 chấm mức Cao: *"không
              hiển thị AI đã đề xuất và AI đã duyệt"*. Tên đứng sau ngày và chỉ
              hiện khi cửa sổ hẹp tra được. */}
          <p className="text-ink-muted">
            Gửi ngày {formatDateVi(item.review.proposedAt.slice(0, 10))}
            {item.review.proposedByName ? ` · ${item.review.proposedByName}` : ""}
            {item.review.representativeNote ? ` · ${item.review.representativeNote}` : ""}
          </p>
          {item.review.reviewedAt ? (
            <p className="text-ink-muted">
              Duyệt ngày {formatDateVi(item.review.reviewedAt.slice(0, 10))}
              {item.review.reviewedByName ? ` · ${item.review.reviewedByName}` : ""}
            </p>
          ) : null}
          {item.review.reviewNote ? (
            <p>
              <span className="font-medium">Ý kiến trưởng ngành:</span> {item.review.reviewNote}
            </p>
          ) : null}
        </div>
      ) : null}

      <WarningSummary item={item} />

      {item.review ? <DecisionJournal events={item.review.events} /> : null}

      {item.canPropose && item.review?.finalStatus !== "approved" ? (
        <form onSubmit={submitProposal} className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor={statusId}>Đề xuất</Label>
            <Select
              id={statusId}
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as PromotionProposalStatus);
                setTrainee(false);
              }}
            >
              {PROMOTION_PROPOSAL_STATUSES.map((value) => (
                <option value={value} key={value}>
                  {PROMOTION_STATUS_LABELS[value]}
                </option>
              ))}
            </Select>
          </div>

          {needsTarget && !trainee ? (
            <div className="space-y-1">
              <Label htmlFor={targetId}>Lớp đích</Label>
              <Select
                id={targetId}
                key={`${status}-${defaultTarget}`}
                name="targetClassId"
                defaultValue={defaultTarget}
                required
              >
                <option value="">Chọn lớp</option>
                {targetOptions.map((target) => (
                  <option value={target.id} key={target.id}>
                    {target.displayName} · {target.academicYearCode}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}

          {status === "recommended_promote" && item.canProposeTrainee ? (
            <label className="flex min-h-11 items-center gap-3 text-sm md:col-span-2">
              {/* Vùng chạm 44px cho chính ô tick, không chỉ cho nhãn bọc ngoài —
                  `06_UI_UX_RECOMMENDATIONS` §7 đo được ô cũ chỉ ~13–16px. */}
              <input
                type="checkbox"
                checked={trainee}
                onChange={(event) => setTrainee(event.target.checked)}
                className="h-6 w-6 shrink-0 rounded border-line-strong"
              />
              <span>Đề xuất vào Dự trưởng (hệ thống chọn lớp năm sau khi duyệt)</span>
            </label>
          ) : null}

          <div className="space-y-1 md:col-span-2">
            <Label htmlFor={noteId}>Ghi chú đại diện</Label>
            {/* `<Input>` một dòng cho 1.000 ký tự là sai kiểu điều khiển —
                `06_UI_UX_RECOMMENDATIONS` §4. */}
            <Textarea
              id={noteId}
              name="note"
              rows={2}
              maxLength={1000}
              defaultValue={item.review?.representativeNote ?? ""}
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <Button type="submit" disabled={pending} aria-busy={pending}>
              {pending
                ? "Đang lưu…"
                : directMode
                  ? "Chuyển lớp"
                  : "Gửi đề xuất cho Trưởng ngành"}
            </Button>
            {directMode ? (
              // D-159: nói ra rằng đây là MỘT bước, không phải bước đầu của hai.
              // Người ở cấp xứ đoàn quen với luồng cũ sẽ ngồi chờ một lượt duyệt
              // không bao giờ tới nếu không có câu này.
              <p className="text-xs text-ink-muted">
                Bạn ở cấp xứ đoàn nên thao tác này <strong>vừa đề xuất vừa duyệt</strong> trong một
                lượt. Hệ thống sẽ hỏi lại một lần trước khi chuyển.
              </p>
            ) : null}
          </div>
        </form>
      ) : null}

      {item.canReview && item.review?.finalStatus === "pending" ? (
        <form
          className="grid gap-3 border-t border-line pt-4 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            requestApprove(event.currentTarget);
          }}
        >
          {!item.review.proposeTrainee
          && ["recommended_promote", "recommended_repeat"].includes(item.review.proposedStatus) ? (
            <div className="space-y-1">
              <Label htmlFor={reviewTargetId}>Lớp đích khi duyệt</Label>
              {reviewTargets.length === 0 ? (
                // `06_UI_UX_RECOMMENDATIONS` §4: ô `required` không có lựa chọn
                // nào là một ô trống không giải thích — người duyệt bấm Duyệt và
                // trình duyệt chặn im lặng.
                <FormMessage tone="info">
                  Năm học kế tiếp chưa có lớp nào đúng cấp để nhận em này. Hãy tạo lớp cho năm sau ở
                  trang Quản trị rồi quay lại duyệt.
                </FormMessage>
              ) : (
                <Select
                  id={reviewTargetId}
                  name="reviewTargetClassId"
                  defaultValue={item.review.proposedTargetClassId ?? ""}
                  required
                >
                  {reviewTargets.map((target) => (
                    <option value={target.id} key={target.id}>
                      {target.displayName} · {target.academicYearCode}
                    </option>
                  ))}
                </Select>
              )}
            </div>
          ) : null}

          <div className="space-y-1 md:col-span-2">
            <Label htmlFor={reviewNoteId}>
              Ý kiến trưởng ngành
              {noteRequired ? <span className="ml-1 text-danger">*</span> : null}
            </Label>
            {/* AC-16 vế ba — thiếu bí tích thì **bắt buộc** nêu ý kiến. AC-15 —
                từ chối thì **luôn** bắt buộc. `required` ở đây chỉ là tiện ích
                cho đường "Duyệt"; hàng rào thật nằm trong `reviewPromotion` và
                `promotionReviewSchema` (`AGENTS` §5). Nói ra **vì sao** bắt buộc,
                không để một dấu sao không giải thích. */}
            <Textarea
              id={reviewNoteId}
              name="reviewNote"
              rows={2}
              maxLength={1000}
              required={noteRequired}
              aria-describedby={`${reviewNoteId}-hint`}
            />
            <p id={`${reviewNoteId}-hint`} className="text-xs text-ink-muted">
              {noteRequired
                ? "Em này còn thiếu bí tích của lớp cuối ngành. Cảnh báo không chặn việc lên lớp, nhưng quyết định phải để lại lý do."
                : "Bắt buộc khi từ chối — đại diện lớp cần biết phải sửa gì trước khi gửi lại."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 md:col-span-2">
            <Button type="submit" disabled={pending} aria-busy={pending}>
              {pending ? "Đang xử lý…" : "Duyệt"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={(event) => {
                if (event.currentTarget.form) requestReject(event.currentTarget.form);
              }}
            >
              Từ chối
            </Button>
          </div>
        </form>
      ) : null}

      {/* `FormMessage` tự đặt `role="alert"`/`role="status"` theo tone — đóng
          phần a11y mà `06_UI_UX_RECOMMENDATIONS` §7 nêu (bản cũ không có). */}
      {message ? (
        <FormMessage tone={message.tone === "error" ? "danger" : "success"}>{message.text}</FormMessage>
      ) : null}

      {/* D-159 "hỏi lại một lần rồi xong". Hậu quả nêu **bằng tên riêng** — tên
          em · lớp đang học · lớp sẽ vào · năm học đích (`11` §5). */}
      <ConfirmDialog
        open={pendingTransfer !== null}
        onClose={() => setPendingTransfer(null)}
        onConfirm={runDirectTransfer}
        pending={pending}
        title={`Chuyển lớp cho ${item.studentName}?`}
        confirmLabel={transferConfirmLabel(status, trainee)}
        tone="danger"
        consequence={
          <p>
            {describeTransferConsequence({
              studentName: item.studentName,
              sourceClassName: item.className,
              sourceYearCode: item.yearCode,
              proposedStatus: status,
              proposeTrainee: trainee,
              targetLabel: pendingTransfer?.targetClassId
                ? targetLabelOf(targets, pendingTransfer.targetClassId)
                : null,
            })}
          </p>
        }
      />

      {/* AC-14 — hộp xác nhận cho "Duyệt". Nợ mang qua hai đợt, trả ở đây. */}
      {item.review ? (
        <ConfirmDialog
          open={pendingApprove !== null}
          onClose={() => setPendingApprove(null)}
          onConfirm={runApprove}
          pending={pending}
          title={`Duyệt chuyển lớp cho ${item.studentName}?`}
          confirmLabel={approveConfirmLabel(item.review.proposedStatus, item.review.proposeTrainee)}
          tone="danger"
          consequence={
            <p>
              {describeApproveConsequence({
                studentName: item.studentName,
                sourceClassName: item.className,
                sourceYearCode: item.yearCode,
                proposedStatus: item.review.proposedStatus,
                proposeTrainee: item.review.proposeTrainee,
                targetLabel: pendingApprove?.targetClassId
                  ? targetLabelOf(targets, pendingApprove.targetClassId)
                  : null,
                proposedTargetLabel: item.review.proposedTargetClassId
                  ? targetLabelOf(targets, item.review.proposedTargetClassId)
                  : null,
              })}
            </p>
          }
        />
      ) : null}
    </div>
  );
}

function PromotionRow({
  item,
  targets,
  expanded,
  onToggle,
  hasSelectColumn,
  selectable,
  selected,
  onSelectChange,
}: {
  item: PromotionRosterItem;
  targets: PromotionTargetOption[];
  expanded: boolean;
  onToggle: () => void;
  /**
   * Bảng **có** cột chọn hay không — quyết định theo cả bảng, không theo dòng.
   *
   * 🔴 Tách khỏi `selectable` là bắt buộc: bỏ hẳn `<td>` ở dòng không chọn được
   * sẽ đẩy toàn bộ dòng ấy lệch một cột so với `<thead>` — tên em rơi vào cột
   * "Lớp" và không có gì báo là sai.
   */
  hasSelectColumn: boolean;
  /** Dòng này có đưa vào lượt hàng loạt được không (BR-M08-16 + quyền + ghi danh mở). */
  selectable: boolean;
  /** Dòng này có nằm trong lượt chọn hàng loạt không. */
  selected: boolean;
  onSelectChange: (checked: boolean) => void;
}) {
  const panelId = `promotion-panel-${item.enrollmentId}`;
  const proposalText = item.review
    ? item.review.proposeTrainee
      ? "Đề nghị vào Dự trưởng"
      : PROMOTION_STATUS_LABELS[item.review.proposedStatus]
    : "—";

  return (
    <>
      <tr className="block border-b border-line px-4 py-3 md:table-row md:px-0 md:py-0">
        {hasSelectColumn ? (
          <td className={cn(CELL, "md:w-10")}>
            {selectable ? (
              // Vùng chạm 44px ở **mọi** cỡ màn (`11` §5), không chỉ trên điện
              // thoại: dòng của bảng vốn đã cao hơn thế nhờ nút "Chi tiết", nên
              // giữ ngưỡng ở đây không làm bảng cao thêm một pixel nào.
              <label className="flex min-h-11 items-center gap-2">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={(event) => onSelectChange(event.target.checked)}
                  className="h-6 w-6 shrink-0 rounded border-line-strong"
                  // Nhãn nêu TÊN EM: 25 ô tick giống hệt nhau thì trình đọc màn
                  // hình không nói lên được ô nào là của ai.
                  aria-label={`Chọn ${item.studentName} cho lượt đề xuất hàng loạt`}
                />
                <span className={cn(MOBILE_LABEL, "m-0")}>Chọn</span>
              </label>
            ) : null}
          </td>
        ) : null}
        <td className={cn(CELL, "font-medium")}>
          <span className={MOBILE_LABEL}>Thiếu nhi</span>
          {item.studentName}
        </td>
        <td className={CELL}>
          <span className={MOBILE_LABEL}>Lớp</span>
          {item.className}
        </td>
        <td className={CELL}>
          <span className={MOBILE_LABEL}>Đề xuất</span>
          {proposalText}
        </td>
        <td className={CELL}>
          <span className={MOBILE_LABEL}>Trạng thái</span>
          {statusBadge(item)}
        </td>
        <td className={cn(CELL, "md:text-right")}>
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            aria-controls={panelId}
            className="inline-flex min-h-11 items-center gap-1 rounded-md px-3 text-sm font-medium text-ink hover:bg-surface-muted"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            ) : (
              <ChevronRight className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            )}
            {/* Nhãn nêu TÊN EM: trình đọc màn hình đọc lần lượt 25 nút "Chi
                tiết" giống hệt nhau thì không nút nào nói lên điều gì. */}
            <span aria-hidden="true">Chi tiết</span>
            <span className="sr-only">
              {expanded ? "Đóng chi tiết của" : "Mở chi tiết của"} {item.studentName}
            </span>
          </button>
        </td>
      </tr>
      {expanded ? (
        <tr id={panelId} className="block border-b border-line md:table-row">
          <td colSpan={hasSelectColumn ? 6 : 5} className="block p-0 md:table-cell">
            <PromotionDetailPanel item={item} targets={targets} />
          </td>
        </tr>
      ) : null}
    </>
  );
}

/**
 * Thanh đề xuất hàng loạt — **TO-BE 2 / AC-20**.
 *
 * `04_TO_BE_FLOWS` đo cái giá của bản cũ: 30 em × 3 thao tác = **90 lượt**, so
 * với **4 lượt** ở đây. Rủi ro đi kèm cũng được nói thẳng ở TO-BE 2 mục "Ảnh
 * hưởng": *"thao tác nhầm ở quy mô lớn ⇒ **bắt buộc** có bước xem lại trước khi
 * xác nhận"* — nên nút cuối mở một hộp **liệt kê đủ tên**, không phải một con số.
 */
function PromotionBatchBar({
  selectable,
  selectedIds,
  onSelectedIdsChange,
  targets,
  offPageCount,
}: {
  selectable: readonly PromotionBatchCandidate[];
  selectedIds: ReadonlySet<string>;
  onSelectedIdsChange: (next: Set<string>) => void;
  targets: PromotionTargetOption[];
  offPageCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<PromotionProposalStatus>("recommended_promote");
  const [targetClassId, setTargetClassId] = useState("");
  const [message, setMessage] = useState<Message>(null);
  const [overflowNote, setOverflowNote] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const selected = useMemo(
    () => selectable.filter((item) => selectedIds.has(item.enrollmentId)),
    [selectable, selectedIds],
  );
  const scope = useMemo(() => batchTargetScope(selected), [selected]);
  const needsTarget = status === "recommended_promote" || status === "recommended_repeat";
  const mixedNote = describeMixedGrades(scope);

  const targetOptions = useMemo(() => {
    if (!scope || scope.mixedGrades) return [];
    return targets.filter((target) => {
      if (target.yearStart <= scope.yearStart || target.classKind !== "catechism") return false;
      return status === "recommended_repeat"
        ? target.gradeLevelId === scope.gradeLevelId
        : target.gradeLevelId === scope.nextGradeLevelId;
    });
  }, [scope, status, targets]);

  // BR-M08-X2 cũng áp cho hàng loạt: nhánh A/B chung được giữ khi mọi em đang
  // chọn cùng một nhánh, còn trộn nhánh thì không đoán hộ.
  const suggestedTarget = useMemo(
    () => defaultTargetClassId(scope?.sectionCode ?? null, targetOptions.map((target) => ({
      id: target.id,
      sectionCode: target.sectionCode,
      displayName: target.displayName,
    }))),
    [scope?.sectionCode, targetOptions],
  );
  const effectiveTarget = targetOptions.some((option) => option.id === targetClassId)
    ? targetClassId
    : suggestedTarget;

  function selectAll() {
    const { ids, dropped } = takeBatchSelection(selectable);
    onSelectedIdsChange(new Set(ids));
    setOverflowNote(describeBatchOverflow(dropped));
    setMessage(null);
  }

  function clearAll() {
    onSelectedIdsChange(new Set());
    setOverflowNote(null);
    setMessage(null);
  }

  function runBatch() {
    setConfirming(false);
    const enrollmentIds = selected.map((item) => item.enrollmentId);
    setMessage(null);
    startTransition(async () => {
      const result = await proposePromotionBatch({
        enrollmentIds,
        proposedStatus: status,
        targetClassId: needsTarget ? effectiveTarget || null : null,
        note: null,
      });
      if (!result.ok) {
        setMessage({ tone: "error", text: result.message });
        return;
      }
      const summary = summarizeBatchOutcome(result.data);
      setMessage({ tone: summary.tone === "success" ? "success" : "error", text: summary.text });
      if (result.data.succeeded > 0) {
        onSelectedIdsChange(new Set());
        setOverflowNote(null);
        router.refresh();
      }
    });
  }

  const blocked = needsTarget && (!!mixedNote || !effectiveTarget);
  const overwriteCount = selected.filter((item) => item.overwrites).length;

  return (
    <section
      aria-labelledby="promotion-batch-heading"
      className="space-y-3 rounded-lg border border-line bg-surface p-4"
    >
      <h3 id="promotion-batch-heading" className="text-sm font-semibold">
        Đề xuất hàng loạt
      </h3>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span>
          Đã chọn <span data-numeric className="font-medium">{selected.length}</span> em
          {offPageCount > 0 ? (
            // Chủ dự án chốt "chọn tất cả khớp bộ lọc, kể cả trang sau" — nên
            // phải nói ra rằng có em đang được chọn mà KHÔNG nằm trên màn hình.
            <span className="text-ink-muted">
              {" "}(trong đó <span data-numeric>{offPageCount}</span> em ở trang khác)
            </span>
          ) : null}
        </span>
        <Button type="button" variant="outline" size="sm" onClick={selectAll} disabled={pending}>
          Chọn tất cả {selectable.length} em khớp bộ lọc
        </Button>
        {selected.length > 0 ? (
          <Button type="button" variant="ghost" size="sm" onClick={clearAll} disabled={pending}>
            Bỏ chọn
          </Button>
        ) : null}
      </div>

      {overflowNote ? <FormMessage tone="info">{overflowNote}</FormMessage> : null}

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="batch-status">Đề xuất chung</Label>
          <Select
            id="batch-status"
            value={status}
            onChange={(event) => setStatus(event.target.value as PromotionProposalStatus)}
          >
            {PROMOTION_PROPOSAL_STATUSES.map((value) => (
              <option value={value} key={value}>
                {PROMOTION_STATUS_LABELS[value]}
              </option>
            ))}
          </Select>
        </div>

        {needsTarget ? (
          <div className="space-y-1">
            <Label htmlFor="batch-target">Lớp đích chung</Label>
            {mixedNote ? (
              <FormMessage tone="info">{mixedNote}</FormMessage>
            ) : targetOptions.length === 0 ? (
              <FormMessage tone="info">
                {selected.length === 0
                  ? "Chọn thiếu nhi trước để hệ thống biết lớp đích nào đúng cấp."
                  : "Năm học kế tiếp chưa có lớp nào đúng cấp để nhận các em này."}
              </FormMessage>
            ) : (
              <Select
                id="batch-target"
                value={effectiveTarget}
                onChange={(event) => setTargetClassId(event.target.value)}
              >
                {targetOptions.map((target) => (
                  <option value={target.id} key={target.id}>
                    {target.displayName} · {target.academicYearCode}
                  </option>
                ))}
              </Select>
            )}
          </div>
        ) : null}
      </div>

      <Button
        type="button"
        disabled={pending || selected.length === 0 || blocked}
        aria-busy={pending}
        onClick={() => {
          setMessage(null);
          setConfirming(true);
        }}
      >
        {pending ? "Đang gửi…" : `Xem lại và gửi ${selected.length} đề xuất`}
      </Button>

      {message ? (
        <FormMessage tone={message.tone === "error" ? "danger" : "success"}>{message.text}</FormMessage>
      ) : null}

      {/* Bước "xem lại" mà TO-BE 2 gọi là **bắt buộc**: đủ tên từng em, không
          phải một con số — `11` §5 "nêu hậu quả bằng tên riêng". */}
      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={runBatch}
        pending={pending}
        title={`Gửi ${selected.length} đề xuất?`}
        confirmLabel={`Gửi ${selected.length} đề xuất`}
        tone="primary"
        consequence={
          <>
            <p>
              {describeBatchConsequence({
                count: selected.length,
                statusLabel: PROMOTION_STATUS_LABELS[status],
                targetLabel: needsTarget && effectiveTarget
                  ? targetLabelOf(targets, effectiveTarget)
                  : null,
                overwriteCount,
              })}
            </p>
            <ul className="mt-2 list-disc space-y-0.5 pl-5">
              {selected.map((item) => (
                <li key={item.enrollmentId}>
                  {item.studentName} <span className="text-ink-muted">· {item.className}</span>
                  {item.overwrites ? <span className="text-warning"> · đã có đề xuất</span> : null}
                </li>
              ))}
            </ul>
          </>
        }
      />
    </section>
  );
}

export function PromotionBoard({
  roster,
  targets,
  selectable = [],
}: {
  roster: PromotionRosterItem[];
  targets: PromotionTargetOption[];
  /** Mọi em khớp bộ lọc mà đề xuất hàng loạt áp được — **kể cả em ở trang sau**. */
  selectable?: PromotionBatchCandidate[];
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set<string>());

  const selectableIds = useMemo(
    () => new Set(selectable.map((item) => item.enrollmentId)),
    [selectable],
  );
  const batchEnabled = selectable.length > 0;
  const rosterIds = useMemo(() => new Set(roster.map((item) => item.enrollmentId)), [roster]);
  const offPageCount = useMemo(
    () => [...selectedIds].filter((id) => !rosterIds.has(id)).length,
    [rosterIds, selectedIds],
  );

  function toggleOne(enrollmentId: string, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(enrollmentId);
      else next.delete(enrollmentId);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      {batchEnabled ? (
        <PromotionBatchBar
          selectable={selectable}
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
          targets={targets}
          offPageCount={offPageCount}
        />
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full border-collapse text-sm md:min-w-[44rem]">
          <caption className="sr-only">
            Danh sách thiếu nhi và trạng thái đề xuất chuyển lớp. Mở &quot;Chi tiết&quot; của một em
            để tạo đề xuất hoặc duyệt.
          </caption>
          <thead className="hidden md:table-header-group">
            <tr className="border-b border-line bg-surface-muted text-left">
              {batchEnabled ? (
                <th scope="col" className="px-3 py-2 font-semibold">
                  <span className="sr-only">Chọn cho lượt đề xuất hàng loạt</span>
                </th>
              ) : null}
              <th scope="col" className="px-3 py-2 font-semibold">
                Thiếu nhi
              </th>
              <th scope="col" className="px-3 py-2 font-semibold">
                Lớp
              </th>
              <th scope="col" className="px-3 py-2 font-semibold">
                Đề xuất
              </th>
              <th scope="col" className="px-3 py-2 font-semibold">
                Trạng thái
              </th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">
                <span className="sr-only">Thao tác</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {roster.map((item) => (
              <PromotionRow
                key={item.enrollmentId}
                item={item}
                targets={targets}
                expanded={expandedId === item.enrollmentId}
                onToggle={() =>
                  setExpandedId((current) => (current === item.enrollmentId ? null : item.enrollmentId))
                }
                hasSelectColumn={batchEnabled}
                selectable={selectableIds.has(item.enrollmentId)}
                selected={selectedIds.has(item.enrollmentId)}
                onSelectChange={(checked) => toggleOne(item.enrollmentId, checked)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
