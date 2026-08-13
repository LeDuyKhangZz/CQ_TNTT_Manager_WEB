import { z } from "zod";
import { PROMOTION_BATCH_LIMIT, PROMOTION_PROPOSAL_STATUSES } from "./constants";

const optionalUuid = z.string().uuid().nullable().optional();
const optionalNote = z.string().trim().max(1000).nullable().optional();

export const promotionProposalSchema = z.object({
  sourceEnrollmentId: z.string().uuid(),
  proposedStatus: z.enum(PROMOTION_PROPOSAL_STATUSES),
  targetClassId: optionalUuid,
  proposeTrainee: z.boolean().default(false),
  note: optionalNote,
}).superRefine((value, context) => {
  const needsTarget = value.proposedStatus === "recommended_promote" || value.proposedStatus === "recommended_repeat";
  if (value.proposeTrainee && (value.proposedStatus !== "recommended_promote" || value.targetClassId)) {
    context.addIssue({ code: "custom", message: "Đề xuất Dự trưởng không chọn lớp đích." });
  } else if (needsTarget && !value.proposeTrainee && !value.targetClassId) {
    context.addIssue({ code: "custom", message: "Vui lòng chọn lớp đích." });
  } else if (!needsTarget && (value.targetClassId || value.proposeTrainee)) {
    context.addIssue({ code: "custom", message: "Trạng thái này không có lớp đích." });
  }
});

/**
 * **AC-15 — từ chối phải nêu lý do, và hàng rào nằm Ở ĐÂY.**
 *
 * `04_TO_BE_FLOWS` TO-BE 6 viết đúng một câu: *"Nút 'Từ chối' bắt buộc
 * `review_note` không rỗng (Zod `min(1)` khi `decision='reject'`)"*, và AC-15 nói
 * rõ hơn: *"hiện lỗi … **và** server cũng từ chối, không chỉ chặn ở client"*.
 *
 * 🔴 Thuộc tính `required` của ô ý kiến chỉ tồn tại trong trình duyệt; Server
 * Action thì gọi thẳng được — đúng điều `AGENTS` §5 gọi là *"ẩn nút không phải
 * authorization"*. Cùng hình dạng với luật bí tích (BR-M08-18) mà M08-B đã đặt
 * vào `reviewPromotion`, chỉ khác chỗ đứng: luật bí tích cần đọc `warning_snapshot`
 * nên phải nằm trong action, còn luật này chỉ nhìn vào chính đầu vào nên nằm
 * được ngay trong schema — nơi mọi đường gọi đều phải đi qua.
 *
 * ⚠️ Cơ sở dữ liệu **không** ép luật này: `approve_promotion_review` nhận
 * `p_note` rỗng cho cả hai quyết định (`…promotions.sql:266`). Đó là chủ ý chứ
 * không phải sót — RPC ấy nằm trong nhóm *"giữ nguyên vì đã đúng"* của
 * `04_TO_BE_FLOWS`, và AC-15 là một luật **giao diện–nghiệp vụ** chứ không phải
 * một bất biến của dữ liệu: một lượt từ chối không lý do vẫn là một hàng hợp lệ.
 */
export const promotionReviewSchema = z.object({
  reviewId: z.string().uuid(),
  decision: z.enum(["approve", "reject"]),
  targetClassId: optionalUuid,
  note: optionalNote,
}).superRefine((value, context) => {
  if (value.decision === "reject" && !(value.note ?? "").trim()) {
    context.addIssue({ code: "custom", message: "Vui lòng nêu lý do từ chối." });
  }
});

/**
 * **Đề xuất hàng loạt — M08-C, TO-BE 2 / AC-20.**
 *
 * Cùng `superRefine` với đề xuất đơn lẻ, và đó là chủ ý giống hệt lý do đã ghi ở
 * `promotionDirectTransferSchema`: **đường hàng loạt không được lỏng hơn đường
 * từng em ở bất kỳ điểm nào**. Mỗi phần tử vẫn đi qua đủ hàng rào của
 * `propose_promotion` ở tầng cơ sở dữ liệu — schema này chỉ chặn sớm.
 *
 * 🔴 **Không có `proposeTrainee` ở đây, và đó là một quyết định.** "Đề nghị vào
 * Dự trưởng" là một nhận định về **một em cụ thể** (BR-M08-10), không phải một
 * thuộc tính áp chung được cho cả lớp; cho nó vào biểu mẫu hàng loạt là mời một
 * cú bấm biến 28 em thành Dự trưởng.
 */
export const promotionBatchProposalSchema = z.object({
  enrollmentIds: z.array(z.string().uuid())
    .min(1, "Chưa chọn em nào để đề xuất.")
    .max(PROMOTION_BATCH_LIMIT, `Mỗi lượt đề xuất hàng loạt tối đa ${PROMOTION_BATCH_LIMIT} em.`),
  proposedStatus: z.enum(PROMOTION_PROPOSAL_STATUSES),
  targetClassId: optionalUuid,
  note: optionalNote,
}).superRefine((value, context) => {
  const needsTarget = value.proposedStatus === "recommended_promote" || value.proposedStatus === "recommended_repeat";
  if (needsTarget && !value.targetClassId) {
    context.addIssue({ code: "custom", message: "Vui lòng chọn lớp đích." });
  } else if (!needsTarget && value.targetClassId) {
    context.addIssue({ code: "custom", message: "Trạng thái này không có lớp đích." });
  }
});

/**
 * **D-159 — "Chuyển lớp" một bước cho cấp xứ đoàn.**
 *
 * Cùng hình dạng với `promotionProposalSchema` **kể cả `superRefine`**, và đó là
 * chủ ý: đường một bước không được lỏng hơn đường hai bước ở bất kỳ điểm nào.
 * Chép lại `superRefine` thay vì `.extend()` một schema chung vì `superRefine`
 * của zod không nối tiếp được sau `.extend()`.
 */
export const promotionDirectTransferSchema = z.object({
  sourceEnrollmentId: z.string().uuid(),
  proposedStatus: z.enum(PROMOTION_PROPOSAL_STATUSES),
  targetClassId: optionalUuid,
  proposeTrainee: z.boolean().default(false),
  note: optionalNote,
}).superRefine((value, context) => {
  const needsTarget = value.proposedStatus === "recommended_promote" || value.proposedStatus === "recommended_repeat";
  if (value.proposeTrainee && (value.proposedStatus !== "recommended_promote" || value.targetClassId)) {
    context.addIssue({ code: "custom", message: "Đề xuất Dự trưởng không chọn lớp đích." });
  } else if (needsTarget && !value.proposeTrainee && !value.targetClassId) {
    context.addIssue({ code: "custom", message: "Vui lòng chọn lớp đích." });
  } else if (!needsTarget && (value.targetClassId || value.proposeTrainee)) {
    context.addIssue({ code: "custom", message: "Trạng thái này không có lớp đích." });
  }
});

export type PromotionProposalInput = z.infer<typeof promotionProposalSchema>;
export type PromotionReviewInput = z.infer<typeof promotionReviewSchema>;
export type PromotionDirectTransferInput = z.infer<typeof promotionDirectTransferSchema>;
export type PromotionBatchProposalInput = z.infer<typeof promotionBatchProposalSchema>;

