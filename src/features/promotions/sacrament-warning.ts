/**
 * Đọc phần **bí tích** của `warning_snapshot` — M08-B, D-156/D-161, AC-16/AC-17.
 *
 * File **thuần**, không import gì từ tầng máy chủ, nên luật *"khi nào bắt buộc
 * nêu ý kiến trước khi duyệt"* kiểm được bằng unit test thường. Cùng khuôn
 * `promotion-directory.ts` (M08-A).
 *
 * 🔴 **Ba khoá này có thể VẮNG, và vắng là chuyện bình thường chứ không phải lỗi
 * dữ liệu** — hai trường hợp khác hẳn nhau cùng dẫn tới đó:
 *
 *   1. Lớp nguồn **không** phải lớp cuối ngành ⇒ AC-17 đòi snapshot **không có**
 *      khoá `sacramentReviewRequired` (chứ không phải có nó với giá trị `false`).
 *   2. Đề xuất được tạo **trước** M08-B ⇒ snapshot cũ không thể có khoá mới.
 *
 * `07_IMPLEMENTATION_IMPACT` §2.5 gọi thẳng đây là rủi ro của migration: *"review
 * cũ giữ snapshot cũ (thiếu khoá mới) → UI phải chịu được khoá vắng"*. Mọi hàm
 * dưới đây coi khoá vắng là *"không có gì để cảnh báo"*.
 */

import { sacramentLabelList } from "@/lib/sacraments";

export interface PromotionWarningSnapshot {
  weightedAverage?: number | null;
  massAttendanceScore?: number | null;
  catechismAttendanceScore?: number | null;
  warnConsecutiveAbsence?: boolean;
  warnConsecutiveSunday?: boolean;
  warnLowRate?: boolean;
  /** Chỉ tồn tại khi lớp nguồn là lớp cuối ngành (BR-M08-17). */
  sacramentReviewRequired?: boolean;
  requiredSacraments?: string[];
  missingSacraments?: string[];
}

/** Lớp nguồn có phải lớp cuối ngành không — `false` khi khoá vắng. */
export function isSacramentReviewRequired(
  snapshot: PromotionWarningSnapshot | null | undefined,
): boolean {
  return snapshot?.sacramentReviewRequired === true;
}

/** Danh sách bí tích còn thiếu; **luôn** là một mảng, kể cả khi khoá vắng. */
export function missingSacramentsOf(
  snapshot: PromotionWarningSnapshot | null | undefined,
): string[] {
  if (!isSacramentReviewRequired(snapshot)) return [];
  const missing = snapshot?.missingSacraments;
  return Array.isArray(missing) ? missing.filter((item) => typeof item === "string") : [];
}

/**
 * **BR-M08-18 / AC-16 vế ba — điều kiện bắt buộc nêu ý kiến trước khi duyệt.**
 *
 * Thiếu bí tích **không** chặn duyệt (`04_TO_BE_FLOWS` TO-BE 3 nói rõ: *"chỉ buộc
 * ghi ý kiến"*), nhưng nó buộc người duyệt để lại một câu — và câu ấy là thứ
 * `04_TO_BE_FLOWS` mục "Audit" gọi là **vết lý do**: sang năm, người đọc lại hồ sơ
 * biết được xứ đoàn đã cân nhắc điều gì khi cho một em lên lớp mà chưa đủ bí tích.
 *
 * Lớp cuối ngành mà em **đủ** bí tích thì không bắt buộc gì — cờ bật không phải là
 * điều kiện, danh sách thiếu mới là.
 */
export function requiresReviewNote(
  snapshot: PromotionWarningSnapshot | null | undefined,
): boolean {
  return missingSacramentsOf(snapshot).length > 0;
}

/**
 * Câu cảnh báo trên màn hình — `null` khi không có gì để nói.
 *
 * Nêu **tên riêng của từng bí tích** chứ không phải một con số: *"thiếu 2 bí tích"*
 * buộc người duyệt đi mở hồ sơ em ra tra, đúng loại câu mà `11` §5 cấm ở hộp xác
 * nhận và cũng không nên có ở cảnh báo.
 */
export function describeMissingSacraments(
  snapshot: PromotionWarningSnapshot | null | undefined,
): string | null {
  const missing = missingSacramentsOf(snapshot);
  if (missing.length === 0) return null;
  return `Lớp cuối ngành — em còn thiếu ${sacramentLabelList(missing)}.`;
}

/** Câu khẳng định cho ca lớp cuối ngành mà em **đã đủ** — `null` khi không áp dụng. */
export function describeCompleteSacraments(
  snapshot: PromotionWarningSnapshot | null | undefined,
): string | null {
  if (!isSacramentReviewRequired(snapshot)) return null;
  if (missingSacramentsOf(snapshot).length > 0) return null;
  return "Lớp cuối ngành — em đã có đủ bí tích theo yêu cầu của ngành.";
}

/** Câu lỗi khi người duyệt bấm Duyệt mà bỏ trống ô ý kiến. */
export function missingReviewNoteMessage(
  snapshot: PromotionWarningSnapshot | null | undefined,
): string {
  const missing = missingSacramentsOf(snapshot);
  return (
    `Em này còn thiếu ${sacramentLabelList(missing)} ở lớp cuối ngành. `
    + "Vui lòng nêu ý kiến trước khi duyệt — cảnh báo bí tích không chặn việc lên lớp, "
    + "nhưng quyết định phải để lại lý do."
  );
}
