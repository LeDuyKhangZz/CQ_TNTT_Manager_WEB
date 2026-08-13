// P2-T4: duplicate detection (docs/09 §5).
//
// Duplicates never block an import — they surface as warnings and the reviewing
// user decides: create a new record, merge into the existing one, or skip.
//
// 🔴 **M03-B đã chuyển luật so khớp lên `src/lib/students/duplicate.ts`.** File
// này nay chỉ còn hai việc: đổi một `NormalizedRow` của Excel thành dữ liệu
// trung tính, và bắt trùng *bên trong chính tệp* — thứ mà cơ sở dữ liệu không
// thấy được. Mọi chỗ gọi cũ của M12 giữ nguyên vì các tên vẫn được xuất ở đây.
//
// Vì sao phải chuyển: trước đợt này luật "thế nào là trùng" nằm **trong module
// Nhập Excel**, nên đường nhập tay không được che (F13, 29/75). Hai bản chép
// tay của cùng một luật là đúng hình dạng của lỗi F10 mà M03-A vừa diệt.

import { normalizeForMatch } from "./normalize";
import { findStrongestDuplicate } from "@/lib/students/duplicate";
import type { DuplicateMatch, ExistingStudent } from "@/lib/students/duplicate";
import type { NormalizedRow } from "./build-row";

export type {
  DuplicateLevel,
  DuplicateMatch,
  ExistingStudent,
} from "@/lib/students/duplicate";
export { nameSimilarity } from "@/lib/students/duplicate";

/**
 * Chấm một dòng Excel với các hồ sơ đã có.
 *
 * - high:   trùng tên + ngày sinh + SĐT phụ huynh
 * - medium: trùng tên + ngày sinh
 * - low:    tên gần giống và trùng SĐT phụ huynh
 *
 * Chỉ trả về hồ sơ nghi trùng mạnh nhất, để người duyệt thấy một quyết định rõ.
 */
export function findDuplicate(
  row: NormalizedRow,
  existing: readonly ExistingStudent[],
): DuplicateMatch | null {
  return findStrongestDuplicate(
    {
      fullName: row.full_name,
      dateOfBirth: row.date_of_birth,
      guardianPhone: row.guardian_phone,
    },
    existing,
  );
}

/** Duplicates *within* the uploaded file itself, which the DB cannot catch. */
export function findInFileDuplicates(rows: readonly NormalizedRow[]): Map<number, string> {
  const seen = new Map<string, number>();
  const conflicts = new Map<number, string>();

  rows.forEach((row, index) => {
    if (row.date_of_birth === null) return;
    const key = `${normalizeForMatch(row.full_name)}|${row.date_of_birth}`;
    const firstIndex = seen.get(key);
    if (firstIndex === undefined) {
      seen.set(key, index);
      return;
    }
    conflicts.set(
      index,
      `Trùng với một dòng khác trong cùng file (dòng thứ ${firstIndex + 1} của danh sách).`,
    );
  });

  return conflicts;
}
