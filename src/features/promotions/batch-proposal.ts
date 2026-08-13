/**
 * Đề xuất hàng loạt — **M08-C, TO-BE 2 / AC-20 (hạng mục 4 của `07`)**.
 *
 * `04_TO_BE_FLOWS` TO-BE 2 nêu đúng thao tác thật của đại diện lớp cuối năm:
 * *"cả lớp lên lớp, trừ vài em"* — và đo luôn cái giá của bản cũ: **30 em × 3
 * thao tác = 90 lượt**, so với 4 lượt của bản mới. `07` §1 xếp hạng mục này
 * **phụ thuộc hạng mục 1** vì nó cần một cái bảng có ô đánh dấu; bảng ấy đã có
 * từ M08-A, nên phần còn lại nằm ở đây.
 *
 * 🔴 **Chủ dự án chốt 2026-08-08: "Chọn tất cả" lấy MỌI em khớp bộ lọc, kể cả
 * trang sau.** Đó là nguyên văn AC-20 (*"lớp Ấu 1A có 28 em… chọn tất cả… tạo 28
 * review"*) trong khi trang chia **25** dòng. Cái giá đã nói rõ khi chốt: người
 * bấm xác nhận một danh sách **dài hơn** thứ họ đang nhìn. Hai điều bù lại, và
 * cả hai đều bắt buộc:
 *
 *   1. Hộp xác nhận liệt kê **đủ tên từng em** (`11` §5 — *"nêu hậu quả bằng tên
 *      riêng"*), không phải một con số.
 *   2. Con số ấy **nói ra ngay trên nút**, trước khi bấm.
 *
 * File **thuần** — không import gì từ tầng máy chủ — nên luật *"ai được chọn"*,
 * *"trần 60"* và câu kết quả kiểm được bằng unit test thường. Cùng khuôn
 * `promotion-directory.ts` (M08-A) và `sacrament-warning.ts` (M08-B).
 */

import { PROMOTION_BATCH_LIMIT, type PromotionFinalStatus } from "./constants";

// ---------------------------------------------------------------------------
// A. Ai được chọn
// ---------------------------------------------------------------------------

/** Phần tối thiểu của một dòng mà luật chọn cần biết. */
export interface BatchEligibleRow {
  enrollmentId: string;
  studentName: string;
  className: string;
  classId: string;
  gradeLevelId: string | null;
  nextGradeLevelId: string | null;
  sectionCode: string | null;
  yearStart: string;
  canPropose: boolean;
  enrollmentOpen: boolean;
  finalStatus: PromotionFinalStatus | null;
}

/**
 * Một em có thể đưa vào lượt hàng loạt.
 *
 * 🔴 Mang theo **cấp lớp và nhánh A/B** chứ không chỉ id và tên, vì danh sách
 * này phủ **cả những em ở trang sau** — mà giao diện chỉ có dữ liệu đầy đủ của
 * 25 dòng đang hiện. Không có mấy trường này thì ô "Lớp đích chung" không biết
 * mình đang chọn lớp cho cấp nào, và câu trả lời duy nhất còn lại là bắt người
 * dùng lọc theo lớp trước — tức bỏ đi đúng điều "chọn tất cả khớp bộ lọc" vừa
 * được chốt.
 */
export interface PromotionBatchCandidate {
  enrollmentId: string;
  studentName: string;
  className: string;
  classId: string;
  gradeLevelId: string | null;
  nextGradeLevelId: string | null;
  sectionCode: string | null;
  yearStart: string;
  /** Đã có đề xuất (`pending`/`rejected`) — lượt hàng loạt sẽ **ghi đè** nó. */
  overwrites: boolean;
}

/**
 * **BR-M08-16** — hàng loạt áp cho ghi danh **chưa có đề xuất** hoặc đề xuất
 * đang `pending`/`rejected`; đề xuất **đã duyệt** bị loại.
 *
 * Hai điều kiện nữa không nằm trong BR nhưng là điều kiện của chính RPC, nên bỏ
 * chúng ở đây chỉ đổi một dòng bị loại im lặng thành một dòng đỏ ở kết quả:
 *
 *   · `canPropose` — người dùng phải là đại diện của lớp ấy (hoặc ghi toàn cục).
 *   · `enrollmentOpen` — `propose_promotion` ném `ENROLLMENT_NOT_OPEN` cho ghi
 *     danh đã đóng (`…promotions.sql:266-268`).
 */
export function isBatchEligible(row: BatchEligibleRow): boolean {
  return row.canPropose && row.enrollmentOpen && row.finalStatus !== "approved";
}

export function batchCandidatesOf(rows: readonly BatchEligibleRow[]): PromotionBatchCandidate[] {
  return rows.filter(isBatchEligible).map((row) => ({
    enrollmentId: row.enrollmentId,
    studentName: row.studentName,
    className: row.className,
    classId: row.classId,
    gradeLevelId: row.gradeLevelId,
    nextGradeLevelId: row.nextGradeLevelId,
    sectionCode: row.sectionCode,
    yearStart: row.yearStart,
    overwrites: row.finalStatus !== null,
  }));
}

// ---------------------------------------------------------------------------
// A-bis. Lớp đích chung áp được cho những ai
// ---------------------------------------------------------------------------

export interface BatchTargetScope {
  /** Cấp của lớp nguồn — chỉ có nghĩa khi `mixedGrades` là `false`. */
  gradeLevelId: string | null;
  nextGradeLevelId: string | null;
  /** Nhánh A/B chung, `null` khi các em đang chọn không cùng một nhánh. */
  sectionCode: string | null;
  yearStart: string;
  /** Đang chọn em của **nhiều cấp khác nhau**. */
  mixedGrades: boolean;
}

/**
 * Phạm vi lớp đích của một lượt chọn — `null` khi chưa chọn ai.
 *
 * 🔴 **`mixedGrades` là lý do file này tồn tại thay vì một dòng `.filter()` trong
 * component.** "Chọn tất cả" trên bộ lọc *"Tất cả lớp"* gom em của Ấu 1, Thiếu 2
 * và Nghĩa 3 vào cùng một lượt, và **không có lớp đích nào đúng cho cả ba** —
 * `propose_promotion` sẽ ném `PROMOTION_TARGET_INVALID` cho hầu hết. Gửi đi rồi
 * mới báo là để người dùng ngồi đợi 60 lượt gọi để nhận về 55 dòng đỏ; biết
 * trước thì nói được ngay trên biểu mẫu.
 *
 * Hai trạng thái **không có lớp đích** ("Tạm nghỉ" · "Rút học") vẫn chạy bình
 * thường khi trộn cấp — chúng không hỏi lớp đích nên không có gì để sai.
 */
export function batchTargetScope(
  selected: readonly PromotionBatchCandidate[],
): BatchTargetScope | null {
  if (selected.length === 0) return null;
  const first = selected[0];
  const mixedGrades = selected.some((item) => item.gradeLevelId !== first.gradeLevelId);
  const sameSection = selected.every((item) => item.sectionCode === first.sectionCode);
  return {
    gradeLevelId: first.gradeLevelId,
    nextGradeLevelId: first.nextGradeLevelId,
    sectionCode: sameSection ? first.sectionCode : null,
    yearStart: first.yearStart,
    mixedGrades,
  };
}

/** Câu giải thích khi lượt chọn trộn nhiều cấp — `null` khi không áp dụng. */
export function describeMixedGrades(scope: BatchTargetScope | null): string | null {
  if (!scope?.mixedGrades) return null;
  return (
    "Bạn đang chọn thiếu nhi của nhiều cấp lớp khác nhau, mà một lớp đích chỉ đúng cho "
    + "một cấp. Hãy lọc theo một lớp rồi chọn lại, hoặc dùng trạng thái không có lớp đích "
    + "(\"Tạm nghỉ\" · \"Rút học\")."
  );
}

/**
 * Cắt danh sách chọn về trần **60** (`PROMOTION_BATCH_LIMIT`).
 *
 * 🔴 Trả về **cả phần bị cắt**, không cắt im lặng. Một lượt "Chọn tất cả" trên
 * bộ lọc "Tất cả lớp" của một xứ đoàn ~900 em sẽ chạm trần ngay, và im lặng ở
 * đây nghĩa là người dùng tưởng đã đề xuất cho cả xứ đoàn trong khi mới được 60
 * em — đúng loại lỗi mà M12-B gọi là *"sai mà không gì báo là sai"*.
 */
export function takeBatchSelection(
  candidates: readonly PromotionBatchCandidate[],
  limit: number = PROMOTION_BATCH_LIMIT,
): { ids: string[]; dropped: number } {
  const kept = candidates.slice(0, Math.max(0, limit));
  return { ids: kept.map((item) => item.enrollmentId), dropped: candidates.length - kept.length };
}

/** Câu đi kèm nút "Chọn tất cả" khi danh sách vượt trần — `null` khi không vượt. */
export function describeBatchOverflow(dropped: number, limit: number = PROMOTION_BATCH_LIMIT): string | null {
  if (dropped <= 0) return null;
  return (
    `Mỗi lượt tối đa ${limit} em nên đã chọn ${limit} em đầu danh sách; còn ${dropped} em nữa. `
    + "Gửi xong lượt này rồi bấm \"Chọn tất cả\" lần nữa để làm tiếp."
  );
}

// ---------------------------------------------------------------------------
// B. Câu hậu quả của hộp xác nhận
// ---------------------------------------------------------------------------

export interface BatchConsequenceInput {
  count: number;
  /** Nhãn tiếng Việt của trạng thái đề xuất, ví dụ `"Đề nghị lên lớp"`. */
  statusLabel: string;
  /** Tên lớp đích kèm năm học; `null` khi trạng thái không có lớp đích. */
  targetLabel: string | null;
  /** Bao nhiêu em trong số đó **đã có** đề xuất sẽ bị ghi đè. */
  overwriteCount: number;
}

/**
 * Câu mở đầu hộp xác nhận. Danh sách tên do chính hộp thoại dựng thành `<ul>` —
 * nhét 60 cái tên vào một câu là một khối chữ không ai đọc.
 *
 * 🔴 Vế `overwriteCount` là vế **không được bỏ**: gửi lại một đề xuất đang chờ
 * duyệt sẽ đặt nó về `pending` và **xoá `reviewed_*` khỏi hàng review**
 * (BR-M08-16). Từ M08-B lần từ chối cũ vẫn nằm lại trong nhật ký (D-157), nhưng
 * ý kiến của trưởng ngành trên **hàng hiện tại** thì mất — và người bấm "Chọn
 * tất cả" hoàn toàn có thể không biết mấy em ấy đã có đề xuất.
 */
export function describeBatchConsequence(input: BatchConsequenceInput): string {
  const target = input.targetLabel ? ` sang lớp ${input.targetLabel}` : "";
  const head = `Gửi đề xuất "${input.statusLabel}"${target} cho ${input.count} em dưới đây, `
    + "để Trưởng ngành duyệt từng em.";

  if (input.overwriteCount <= 0) return head;
  return (
    `${head} Trong đó ${input.overwriteCount} em đã có đề xuất — lượt này sẽ GHI ĐÈ đề xuất cũ `
    + "và đưa chúng về trạng thái chờ duyệt; ý kiến trưởng ngành đã ghi trên các đề xuất ấy sẽ "
    + "không còn hiện ở dòng hiện tại (nhật ký quyết định vẫn giữ)."
  );
}

// ---------------------------------------------------------------------------
// C. Kết quả trả về
// ---------------------------------------------------------------------------

export interface PromotionBatchFailure {
  studentName: string;
  message: string;
}

export interface PromotionBatchOutcome {
  succeeded: number;
  failed: PromotionBatchFailure[];
}

/** Bao nhiêu tên lỗi được nêu đích danh trước khi gộp phần còn lại thành một con số. */
const NAMED_FAILURES = 5;

/**
 * Câu kết quả — **D-61 + SW-04**: nói ra **con số thật**, không phải "Đã lưu".
 *
 * `04_TO_BE_FLOWS` TO-BE 2 mục "Error handling" đòi *"trả `{succeeded, failed}`,
 * hiển thị đầy đủ, **không nuốt lỗi**"*, và AC-20 vế hai đòi những em bị bỏ qua
 * phải **được liệt kê tên**. Vì thế câu dưới đây nêu tên chứ không nêu số — chỉ
 * gộp lại khi danh sách dài quá mức đọc được.
 *
 * ⚠️ Một lượt hàng loạt **không phải một giao dịch**: `propose_promotion` chạy
 * tuần tự cho từng em (TO-BE 2 bước 3), nên "3 thành công, 2 hỏng" là một kết
 * quả **thật và bình thường**, không phải một trạng thái nửa vời cần cuộn lại.
 * Mỗi em là một quyết định độc lập; cuộn lại 28 em vì một em có ghi danh vừa
 * đóng là làm hỏng đúng việc mà tính năng này sinh ra để làm.
 */
export function summarizeBatchOutcome(
  outcome: PromotionBatchOutcome,
): { tone: "success" | "danger"; text: string } {
  const failedCount = outcome.failed.length;

  if (failedCount === 0) {
    return {
      tone: "success",
      text: `Đã gửi ${outcome.succeeded} đề xuất cho Trưởng ngành duyệt.`,
    };
  }

  const named = outcome.failed.slice(0, NAMED_FAILURES)
    .map((item) => `${item.studentName} — ${item.message}`)
    .join(" · ");
  const rest = failedCount > NAMED_FAILURES ? ` (và ${failedCount - NAMED_FAILURES} em khác)` : "";
  const head = outcome.succeeded > 0
    ? `Đã gửi ${outcome.succeeded} đề xuất. ${failedCount} em chưa gửi được: `
    : `Không gửi được đề xuất nào. ${failedCount} em bị từ chối: `;

  return { tone: "danger", text: `${head}${named}${rest}` };
}
