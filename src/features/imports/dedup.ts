// P2-T4: duplicate detection (docs/09 §5).
//
// Duplicates never block an import — they surface as warnings and the reviewing
// user decides: create a new record, merge into the existing one, or skip.

import { normalizeForMatch } from "./normalize";
import type { NormalizedRow } from "./build-row";

export type DuplicateLevel = "high" | "medium" | "low";

/** An existing student a row might be a duplicate of. */
export interface ExistingStudent {
  id: string;
  studentCode: string;
  fullName: string;
  dateOfBirth: string;
  guardianPhone: string | null;
}

export interface DuplicateMatch {
  level: DuplicateLevel;
  student: ExistingStudent;
  reason: string;
}

/**
 * Similarity of two normalized names, by shared word tokens (Dice coefficient).
 * Vietnamese names are word-structured, so token overlap behaves better than
 * character edit distance for the "name gần giống" case.
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

// One differing syllable in a four-word Vietnamese name scores 0.75
// ("Trần Phạm Ngọc Hiếu" vs "… Hiền"), which is exactly the typo case the low
// level exists for. The low level additionally requires a matching guardian
// phone, so this stays specific; unrelated names score below 0.3.
const NEAR_NAME_THRESHOLD = 0.7;

/**
 * Score one row against the existing students.
 *
 * - high:   name + date of birth + guardian phone all match
 * - medium: name + date of birth match
 * - low:    name is close and the guardian phone matches
 *
 * Returns the strongest match only, so the reviewer sees one clear decision.
 */
export function findDuplicate(
  row: NormalizedRow,
  existing: readonly ExistingStudent[],
): DuplicateMatch | null {
  const rowName = normalizeForMatch(row.full_name);
  if (rowName === "") return null;

  let best: DuplicateMatch | null = null;
  const rank: Record<DuplicateLevel, number> = { low: 1, medium: 2, high: 3 };

  for (const student of existing) {
    const sameName = normalizeForMatch(student.fullName) === rowName;
    const sameBirth =
      row.date_of_birth !== null && row.date_of_birth === student.dateOfBirth;
    const samePhone =
      row.guardian_phone !== null && row.guardian_phone === student.guardianPhone;

    let match: DuplicateMatch | null = null;
    if (sameName && sameBirth && samePhone) {
      match = {
        level: "high",
        student,
        reason: `Trùng họ tên, ngày sinh và SĐT phụ huynh với ${student.studentCode}.`,
      };
    } else if (sameName && sameBirth) {
      match = {
        level: "medium",
        student,
        reason: `Trùng họ tên và ngày sinh với ${student.studentCode}.`,
      };
    } else if (samePhone && nameSimilarity(row.full_name, student.fullName) >= NEAR_NAME_THRESHOLD) {
      match = {
        level: "low",
        student,
        reason: `Tên gần giống và trùng SĐT phụ huynh với ${student.studentCode}.`,
      };
    }

    if (match && (best === null || rank[match.level] > rank[best.level])) {
      best = match;
      if (best.level === "high") break;
    }
  }

  return best;
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
