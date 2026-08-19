import { foldVietnamese } from "@/lib/text/fold-vietnamese";

/**
 * Chống trùng hồ sơ — TB-M04-03 (đóng phần C4/C5 của M04-F02), AC-M04-05.
 *
 * **Cảnh báo mềm, KHÔNG chặn cứng** — đúng tinh thần `docs/03-workflow.md`:
 * *"hệ thống cảnh báo trùng gần đúng; người nhập vẫn được tiếp tục"*. Hai Giáo
 * lý viên trùng họ tên là chuyện thường, và cả một gia đình dùng chung một số
 * điện thoại cũng vậy — nên tuyệt đối **không** thêm ràng buộc `unique` nào lên
 * `phone`/`email` (AC-05.2 canh đúng điều này bằng pgTAP).
 *
 * Hàm THUẦN để kiểm được từng luật một mà không phải dựng cơ sở dữ liệu.
 */

export interface DuplicateCandidate {
  id: string;
  staffCode: string;
  fullName: string;
  saintName: string | null;
  /** Null từ IMP-BULK-002 — hồ sơ nhập hàng loạt có thể chưa có số. */
  phone: string | null;
  dateOfBirth: string | null;
  serviceStatus: string;
}

export interface DuplicateInput {
  fullName: string;
  phone: string;
  dateOfBirth: string | null;
}

export type DuplicateReason = "phone" | "name-and-birthday";

export interface DuplicateSuspect extends DuplicateCandidate {
  reason: DuplicateReason;
}

/**
 * Chỉ giữ chữ số khi so số điện thoại: `0901 234 567`, `0901-234-567` và
 * `+84901234567`… người ta gõ mỗi lần một kiểu, mà đây là dấu hiệu trùng MẠNH
 * nhất nên không được để định dạng làm hỏng.
 *
 * `+84…` được quy về `0…` vì cùng một máy điện thoại.
 */
function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("84") && digits.length >= 10) return `0${digits.slice(2)}`;
  return digits;
}

export function findDuplicateSuspects(
  candidates: readonly DuplicateCandidate[],
  input: DuplicateInput,
): DuplicateSuspect[] {
  const phone = normalizePhone(input.phone);
  const name = foldVietnamese(input.fullName);
  const birthday = input.dateOfBirth?.trim() || null;

  const suspects: DuplicateSuspect[] = [];
  for (const candidate of candidates) {
    // `candidate.phone` có thể trống: hồ sơ không số thì không có dấu hiệu
    // trùng MẠNH nào, chỉ còn đường tên + ngày sinh bên dưới.
    if (phone && candidate.phone && normalizePhone(candidate.phone) === phone) {
      suspects.push({ ...candidate, reason: "phone" });
      continue;
    }
    // Họ tên trùng thôi thì CHƯA đủ (hai người cùng tên là bình thường) — phải
    // kèm cùng ngày sinh. Và cả hai bên đều phải CÓ ngày sinh: hai hồ sơ cùng bỏ
    // trống ô ngày sinh không phải bằng chứng gì cả, gộp chúng lại sẽ khiến mọi
    // người trùng tên bị báo trùng.
    if (
      name &&
      birthday &&
      candidate.dateOfBirth &&
      candidate.dateOfBirth === birthday &&
      foldVietnamese(candidate.fullName) === name
    ) {
      suspects.push({ ...candidate, reason: "name-and-birthday" });
    }
  }
  return suspects;
}

export function duplicateReasonLabel(reason: DuplicateReason): string {
  return reason === "phone" ? "trùng số điện thoại" : "trùng họ tên và ngày sinh";
}

/** Câu cảnh báo trên hộp thoại — nêu SỐ hồ sơ nghi trùng, không nói chung chung. */
export function duplicateWarningText(count: number): string {
  return count === 1
    ? "Đã có 1 hồ sơ trông giống người này."
    : `Đã có ${count} hồ sơ trông giống người này.`;
}
