"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AppError, type AppErrorCode } from "@/lib/errors";
import { requireRouteAccess } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import type { PromotionBatchFailure, PromotionBatchOutcome } from "../batch-proposal";
import { classifyPromotionDbError, describePromotionZodIssues } from "../db-errors";
import {
  missingReviewNoteMessage,
  requiresReviewNote,
  type PromotionWarningSnapshot,
} from "../sacrament-warning";
import {
  promotionBatchProposalSchema,
  promotionDirectTransferSchema,
  promotionProposalSchema,
  promotionReviewSchema,
  type PromotionBatchProposalInput,
  type PromotionDirectTransferInput,
  type PromotionProposalInput,
  type PromotionReviewInput,
} from "../schemas";
import { canProposeForClass, canReviewSector } from "./permissions";

export type PromotionActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; code: AppErrorCode; message: string };

/**
 * 🔴 **`ZodError` không còn bị nuốt** — M08-A.
 *
 * Bản cũ (`actions.ts:14-17`) chỉ giữ `message` của `AppError` và đổ **mọi** thứ
 * còn lại vào một câu *"Không thể xử lý chuyển lớp. Vui lòng thử lại."*. Ba câu
 * mà `schemas.ts` đã viết sẵn từ Phase 5 — *"Vui lòng chọn lớp đích."*, *"Đề
 * xuất Dự trưởng không chọn lớp đích."*, *"Trạng thái này không có lớp đích."* —
 * vì thế **chưa từng hiện ra một lần nào**. Và câu thay thế còn nói sai: *"Vui
 * lòng thử lại"* là lời hứa rằng bấm lại sẽ được, trong khi lỗi validation thì
 * bấm lại hỏng y hệt.
 */
function failure(error: unknown): PromotionActionResult<never> {
  if (error instanceof AppError) return { ok: false, code: error.code, message: error.message };
  if (error instanceof z.ZodError) {
    return { ok: false, code: "VALIDATION_ERROR", message: describePromotionZodIssues(error.issues) };
  }
  return { ok: false, code: "CONFLICT", message: "Không xử lý được chuyển lớp. Vui lòng thử lại." };
}

function mapDatabaseError(error: { code?: string; message?: string; details?: string } | null): AppError {
  const { appCode, message } = classifyPromotionDbError(error);
  return new AppError(appCode, message);
}

/**
 * Nợ #14 / D-96 — guard gọi **NGOÀI `try`**, và bằng `requireRouteAccess`.
 *
 * Hai lỗi cùng lúc ở bản cũ, đúng hình dạng đã trả ở `attendance` (M05-A),
 * `teaching-plans` (M06-A) và `assessments` (M07-A):
 *
 * (1) `requireAuthContext("/promotions")` chỉ hỏi *"đã đăng nhập chưa"* — nó
 *     **không** đọc `ROUTE_RULES`, nên luật *"Thủ quỹ không vào `/promotions`"*
 *     (BR-M08-23 / SEC-01) chỉ được thi hành ở tầng trang. Không phải lỗ hổng
 *     hôm nay — RPC và RLS vẫn chặn — nhưng nghĩa là hai tầng nói hai luật.
 * (2) Nó nằm **trong** `try`, mà `redirect()` của Next báo hiệu bằng cách **ném**
 *     — nên `catch` nuốt mất, và người vừa hết phiên đăng nhập đọc *"Không xử lý
 *     được chuyển lớp. Vui lòng thử lại."* rồi thử lại mãi thay vì được đưa về
 *     `/login`.
 *
 * ⚠️ Bài học M12-A vẫn đúng ở đây theo chiều ngược lại: module này gọi thẳng
 * `requireAuthContext` nên grep thấy được — nhưng phần **quyền theo lớp/ngành**
 * thì nấp trong `canProposeForClass` / `canReviewSector`, và hai hàm đó phải ở
 * lại **trong** `try` vì chúng ném `AppError` chứ không chuyển hướng.
 */
async function promotionsRouteContext() {
  return requireRouteAccess("/promotions");
}

export async function proposePromotion(input: PromotionProposalInput): Promise<PromotionActionResult<{ id: string }>> {
  const context = await promotionsRouteContext();
  try {
    const parsed = promotionProposalSchema.parse(input);
    const supabase = await createClient();
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("class_id")
      .eq("id", parsed.sourceEnrollmentId)
      .maybeSingle();
    if (!enrollment) throw new AppError("RESOURCE_NOT_FOUND");
    if (!(await canProposeForClass(context, supabase, enrollment.class_id))) throw new AppError("FORBIDDEN");
    const { data, error } = await supabase.rpc("propose_promotion", {
      p_source_enrollment_id: parsed.sourceEnrollmentId,
      p_proposed_status: parsed.proposedStatus,
      p_target_class_id: parsed.targetClassId ?? undefined,
      p_propose_trainee: parsed.proposeTrainee,
      p_note: parsed.note ?? undefined,
    });
    if (error || !data) throw mapDatabaseError(error);
    revalidatePath("/promotions");
    return { ok: true, data: { id: data } };
  } catch (error) {
    return failure(error);
  }
}

/**
 * **Đề xuất hàng loạt — M08-C, TO-BE 2 / AC-20 (hạng mục 4).**
 *
 * `04_TO_BE_FLOWS` TO-BE 2 bước 3 chốt cách làm: gọi `propose_promotion` **tuần
 * tự** cho từng ghi danh rồi gom kết quả. Ba điều đi kèm, và cả ba đều cố ý:
 *
 * 1. 🔴 **KHÔNG phải một giao dịch, và không nên là.** Mỗi em là một quyết định
 *    độc lập; cuộn lại 28 em vì một em có ghi danh vừa bị đóng ở tab khác là làm
 *    hỏng đúng việc tính năng này sinh ra để làm. Vì thế kết quả trả về là
 *    `{succeeded, failed[]}` chứ không phải một `ok/không ok`.
 * 2. **Không nuốt lỗi** (TO-BE 2 mục "Error handling"): mỗi lượt hỏng mang **tên
 *    em** và **câu tiếng Việt riêng** của luật đã chặn nó — cùng bộ dịch
 *    `classifyPromotionDbError` mà M08-A dựng cho đường đơn lẻ, nên hàng loạt
 *    không có một tập câu lỗi thứ hai đi lệch dần với đường kia.
 * 3. **Kiểm quyền một lần cho mỗi LỚP, không phải mỗi em.** Đúng bài học M08-A:
 *    `canProposeForClass` là hai truy vấn, và gọi nó 60 lần là dựng lại chính
 *    phép nhân mà lỗi `CRITICAL` của module vừa được gỡ. Một lượt hàng loạt
 *    thường nằm gọn trong **một** lớp.
 *
 * ⚠️ Hàng rào thật vẫn là RPC: `propose_promotion` tự kiểm `app.can_manage_promotion`
 * cho **từng** ghi danh (`…promotions.sql:269-271`). Lượt kiểm ở đây chỉ để trả
 * về một câu tiếng Việt sớm thay vì 60 lần đi về cơ sở dữ liệu để nhận 60 lần
 * `FORBIDDEN`.
 */
export async function proposePromotionBatch(
  input: PromotionBatchProposalInput,
): Promise<PromotionActionResult<PromotionBatchOutcome>> {
  const context = await promotionsRouteContext();
  try {
    const parsed = promotionBatchProposalSchema.parse(input);
    const supabase = await createClient();

    const { data: enrollmentRows } = await supabase
      .from("enrollments")
      .select("id, class_id, students(saint_name, full_name)")
      .in("id", parsed.enrollmentIds);

    const rows = new Map((enrollmentRows ?? []).map((row) => [row.id, row] as const));
    const classPermission = new Map<string, boolean>();
    const failed: PromotionBatchFailure[] = [];
    let succeeded = 0;

    for (const enrollmentId of parsed.enrollmentIds) {
      const row = rows.get(enrollmentId);
      if (!row) {
        // Không đọc được thì cũng không có tên để nêu — nói ra đúng điều đó thay
        // vì bịa một cái tên hay im lặng bỏ qua.
        failed.push({
          studentName: "Một ghi danh trong danh sách",
          message: "Không còn đọc được ghi danh này. Hãy tải lại trang.",
        });
        continue;
      }

      const studentName = row.students
        ? `${row.students.saint_name} ${row.students.full_name}`.trim()
        : "Một thiếu nhi";

      let allowed = classPermission.get(row.class_id);
      if (allowed === undefined) {
        allowed = await canProposeForClass(context, supabase, row.class_id);
        classPermission.set(row.class_id, allowed);
      }
      if (!allowed) {
        failed.push({ studentName, message: "Bạn không phải đại diện của lớp này." });
        continue;
      }

      const { data, error } = await supabase.rpc("propose_promotion", {
        p_source_enrollment_id: enrollmentId,
        p_proposed_status: parsed.proposedStatus,
        p_target_class_id: parsed.targetClassId ?? undefined,
        p_propose_trainee: false,
        p_note: parsed.note ?? undefined,
      });
      if (error || !data) {
        failed.push({ studentName, message: classifyPromotionDbError(error).message });
        continue;
      }
      succeeded += 1;
    }

    if (succeeded > 0) revalidatePath("/promotions");
    return { ok: true, data: { succeeded, failed } };
  } catch (error) {
    return failure(error);
  }
}

export async function reviewPromotion(input: PromotionReviewInput): Promise<PromotionActionResult<{ enrollmentId: string | null }>> {
  const context = await promotionsRouteContext();
  try {
    const parsed = promotionReviewSchema.parse(input);
    const supabase = await createClient();
    const { data: review } = await supabase
      .from("promotion_reviews")
      .select("source_class_id, warning_snapshot, classes!promotion_reviews_source_class_id_fkey(grade_levels(sector_id))")
      .eq("id", parsed.reviewId)
      .maybeSingle();
    if (!review) throw new AppError("RESOURCE_NOT_FOUND");
    const sectorId = review.classes?.grade_levels?.sector_id ?? null;
    if (!canReviewSector(context, sectorId)) throw new AppError("FORBIDDEN");

    /*
      🔴 **AC-16 vế ba — bắt buộc nêu ý kiến khi em thiếu bí tích, kiểm Ở ĐÂY chứ
      không chỉ ở màn hình.** `04_TO_BE_FLOWS` TO-BE 3 bước 3 viết rõ *"client +
      server"*, và vế server là vế **duy nhất** đúng: thuộc tính `required` của
      ô ý kiến chỉ tồn tại trong trình duyệt, còn Server Action thì gọi thẳng
      được — đúng điều `AGENTS` §5 gọi là "ẩn nút không phải authorization".

      Luật đọc từ **snapshot đã chốt lúc đề xuất** (BR-M08-21), không tính lại:
      hai người duyệt cùng một đề xuất phải gặp cùng một yêu cầu, kể cả khi giữa
      chừng có ai đó nhập bổ sung bí tích cho em.

      Chỉ áp cho `approve`. Luật *"từ chối phải nêu lý do"* (**AC-15**) đã có ở
      M08-C nhưng nằm **trong `promotionReviewSchema`**, không nằm ở đây — nó chỉ
      nhìn vào chính đầu vào nên đặt được ở chỗ mọi đường gọi đều phải đi qua,
      còn luật bí tích thì cần đọc `warning_snapshot` của hàng review nên bắt
      buộc phải ở tầng này.
    */
    if (
      parsed.decision === "approve"
      && requiresReviewNote(review.warning_snapshot as PromotionWarningSnapshot | null)
      && !(parsed.note ?? "").trim()
    ) {
      throw new AppError(
        "VALIDATION_ERROR",
        missingReviewNoteMessage(review.warning_snapshot as PromotionWarningSnapshot | null),
      );
    }

    const { data, error } = await supabase.rpc("approve_promotion_review", {
      p_review_id: parsed.reviewId,
      p_decision: parsed.decision,
      p_target_class_id: parsed.targetClassId ?? undefined,
      p_note: parsed.note ?? undefined,
    });
    if (error) throw mapDatabaseError(error);
    revalidatePath("/promotions");
    revalidatePath("/students");
    return { ok: true, data: { enrollmentId: data } };
  } catch (error) {
    return failure(error);
  }
}

/**
 * **D-159 — "Chuyển lớp" một bước cho bốn vai trò cấp xứ đoàn.**
 *
 * `05_BUSINESS_RULES` BR-M08-Y1 hỏi *"vừa đề xuất vừa tự duyệt — có phải chủ ý
 * không"*; chủ dự án chốt **không siết, mà bỏ bớt một bước**. Hôm nay bốn vai trò
 * ấy đã làm được đúng việc này, chỉ là phải điền hai biểu mẫu nối nhau.
 *
 * 🔴 **Toàn bộ việc nằm trong MỘT lệnh gọi cơ sở dữ liệu**, không phải hai lệnh
 * nối nhau ở đây. Lý do là điều D-158 vừa được chốt để diệt: `proposePromotion`
 * thành công rồi `reviewPromotion` hỏng (mạng rớt · trình duyệt đóng · máy chủ
 * khởi động lại) sẽ để lại **một đề xuất mồ côi**, và từ M08-B cái mồ côi ấy còn
 * **khoá luôn** ghi danh của em — không ai đóng được nữa cho tới khi có người vào
 * xử lý đề xuất. `public.promote_enrollment_now` gọi lại đúng hai RPC cũ trong
 * cùng một giao dịch nên mọi hàng rào đi theo miễn phí.
 *
 * ⚠️ Không có kiểm quyền riêng ở tầng này ngoài `requireRouteAccess`: hàng rào là
 * `app.can_global_write()` **bên trong** RPC. Đây là ngoại lệ có chủ ý với thói
 * quen "kiểm lại lần hai" của hai action trên — ở đó lần kiểm thứ hai trả lời một
 * câu hỏi *theo lớp/ngành* mà RPC không nói ra được; ở đây câu hỏi là *"vai trò
 * của bạn là gì"*, và RPC trả lời nó bằng đúng một nguồn sự thật.
 */
export async function transferEnrollmentNow(
  input: PromotionDirectTransferInput,
): Promise<PromotionActionResult<{ enrollmentId: string | null }>> {
  await promotionsRouteContext();
  try {
    const parsed = promotionDirectTransferSchema.parse(input);
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("promote_enrollment_now", {
      p_source_enrollment_id: parsed.sourceEnrollmentId,
      p_proposed_status: parsed.proposedStatus,
      p_target_class_id: parsed.targetClassId ?? undefined,
      p_propose_trainee: parsed.proposeTrainee,
      p_note: parsed.note ?? undefined,
    });
    if (error) throw mapDatabaseError(error);
    revalidatePath("/promotions");
    revalidatePath("/students");
    revalidatePath("/classes");
    return { ok: true, data: { enrollmentId: data } };
  } catch (error) {
    return failure(error);
  }
}
