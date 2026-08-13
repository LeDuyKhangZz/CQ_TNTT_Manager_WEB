/**
 * Dò trùng hồ sơ thiếu nhi — **một định nghĩa duy nhất cho cả hai đường vào**
 * (TB-F13 / AC-F13-04).
 *
 * 🔴 Đây là chỗ chữa nguyên nhân gốc của lỗi F13, luồng chấm **29/75 — thấp
 * nhất module M03**. Nghịch lý trước đợt này: cùng dữ liệu, cùng bảng, nhưng
 * đường **Nhập Excel có** dò trùng ba mức còn đường **gõ tay không có gì cả** —
 * nhập "Maria Nguyễn Thị A, 12/03/2015" hai lần ra hai hồ sơ, hai mã `CQxxxx`,
 * không một lời cảnh báo. Lý do là hàm dò trùng được viết **thuộc về module
 * Nhập Excel** (`src/features/imports/dedup.ts`, P2-T4) chứ không thuộc về miền
 * `students`, nên nó chỉ che đúng một cửa.
 *
 * `src/features/imports/dedup.ts` nay là lớp mỏng gọi vào đây, nên hai đường
 * **không thể** lệch mức cảnh báo — đúng điều AC-F13-04 đòi.
 *
 * Hàm THUẦN, không import gì từ tầng server ⇒ kiểm được bằng unit test thường.
 *
 * **Cảnh báo MỀM, không chặn** (WF-03 bước 4, BR-M03-N08): hai em trùng tên là
 * chuyện bình thường ở một xứ đoàn 900 em. Không có ràng buộc `unique` nào được
 * thêm — người nhập xem xong vẫn được bấm "Vẫn tạo hồ sơ mới".
 */

import { normalizeForMatch } from "@/lib/text/normalize-for-match";

export type DuplicateLevel = "high" | "medium" | "low";

/** Một hồ sơ đã có mà bản ghi đang nhập có thể trùng với. */
export interface ExistingStudent {
  id: string;
  studentCode: string;
  fullName: string;
  dateOfBirth: string;
  guardianPhone: string | null;
  /** Lớp hiện tại, chỉ để người xem nhận ra em — có thể chưa xếp lớp. */
  className?: string | null;
}

export interface DuplicateMatch {
  level: DuplicateLevel;
  student: ExistingStudent;
  reason: string;
}

/** Dữ liệu đang được nhập, dù đến từ ô biểu mẫu hay từ một dòng Excel. */
export interface DuplicateInput {
  fullName: string;
  /** `yyyy-MM-dd`, hoặc null khi chưa biết. */
  dateOfBirth: string | null;
  guardianPhone: string | null;
}

/**
 * Độ giống của hai tên đã chuẩn hoá, đếm theo từ chung (hệ số Dice).
 * Tên tiếng Việt cấu tạo theo TỪ, nên phần chung theo từ hợp lý hơn khoảng cách
 * sửa theo ký tự cho ca "tên gần giống".
 */
export function nameSimilarity(left: string, right: string): number {
  const leftTokens = normalizeForMatch(left).split(" ").filter(Boolean);
  const rightTokens = normalizeForMatch(right).split(" ").filter(Boolean);
  if (leftTokens.length === 0 || rightTokens.length === 0) return 0;

  const remaining = [...rightTokens];
  let shared = 0;
  for (const token of leftTokens) {
    const index = remaining.indexOf(token);
    if (index !== -1) {
      shared += 1;
      remaining.splice(index, 1);
    }
  }
  return (2 * shared) / (leftTokens.length + rightTokens.length);
}

// Lệch một tiếng trong tên bốn chữ cho 0,75 ("Trần Phạm Ngọc Hiếu" so với "…
// Hiền") — đúng ca gõ nhầm mà mức `low` sinh ra để bắt. Mức `low` còn đòi trùng
// số điện thoại người giám hộ nên nó vẫn hẹp; tên không liên quan chấm dưới 0,3.
const NEAR_NAME_THRESHOLD = 0.7;

const LEVEL_RANK: Record<DuplicateLevel, number> = { low: 1, medium: 2, high: 3 };

function scoreOne(input: DuplicateInput, student: ExistingStudent): DuplicateMatch | null {
  const inputName = normalizeForMatch(input.fullName);
  if (inputName === "") return null;

  const sameName = normalizeForMatch(student.fullName) === inputName;
  const sameBirth = input.dateOfBirth !== null && input.dateOfBirth === student.dateOfBirth;
  const samePhone =
    input.guardianPhone !== null && input.guardianPhone === student.guardianPhone;

  if (sameName && sameBirth && samePhone) {
    return {
      level: "high",
      student,
      reason: `Trùng họ tên, ngày sinh và SĐT phụ huynh với ${student.studentCode}.`,
    };
  }
  if (sameName && sameBirth) {
    return {
      level: "medium",
      student,
      reason: `Trùng họ tên và ngày sinh với ${student.studentCode}.`,
    };
  }
  if (samePhone && nameSimilarity(input.fullName, student.fullName) >= NEAR_NAME_THRESHOLD) {
    return {
      level: "low",
      student,
      reason: `Tên gần giống và trùng SĐT phụ huynh với ${student.studentCode}.`,
    };
  }
  return null;
}

/**
 * Mọi hồ sơ nghi trùng, mạnh trước yếu sau — dùng cho biểu mẫu nhập tay, nơi
 * người nhập cần **thấy hết** để tự quyết.
 */
export function findStudentDuplicates(
  input: DuplicateInput,
  existing: readonly ExistingStudent[],
): DuplicateMatch[] {
  const matches: DuplicateMatch[] = [];
  for (const student of existing) {
    const match = scoreOne(input, student);
    if (match) matches.push(match);
  }
  return matches.sort((left, right) => LEVEL_RANK[right.level] - LEVEL_RANK[left.level]);
}

/**
 * Chỉ hồ sơ nghi trùng MẠNH nhất — dùng cho đường Nhập Excel, nơi mỗi dòng phải
 * quy về **một** quyết định rõ ràng cho người duyệt.
 */
export function findStrongestDuplicate(
  input: DuplicateInput,
  existing: readonly ExistingStudent[],
): DuplicateMatch | null {
  let best: DuplicateMatch | null = null;
  for (const student of existing) {
    const match = scoreOne(input, student);
    if (match && (best === null || LEVEL_RANK[match.level] > LEVEL_RANK[best.level])) {
      best = match;
      if (best.level === "high") break;
    }
  }
  return best;
}

export const DUPLICATE_LEVEL_LABELS: Readonly<Record<DuplicateLevel, string>> = {
  high: "Gần chắc chắn trùng",
  medium: "Nhiều khả năng trùng",
  low: "Có thể trùng",
};

/** Câu cảnh báo nêu SỐ hồ sơ, không nói chung chung — cùng khuôn M04-B. */
export function duplicateWarningText(count: number): string {
  return count === 1
    ? "Đã có 1 hồ sơ trông giống em này."
    : `Đã có ${count} hồ sơ trông giống em này.`;
}
