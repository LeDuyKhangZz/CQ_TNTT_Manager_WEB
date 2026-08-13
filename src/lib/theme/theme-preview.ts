import type { ThemeKey } from "./sector-palette";

/**
 * Xem trước theme trước khi kích hoạt năm học mới — Q-12, 10 §11, 15 §4 bước 1.6.
 *
 * Kích hoạt năm học là thao tác **không quay lại được** và nó đổi màu của hàng
 * trăm tài khoản cùng lúc. Đổi màu im lặng làm người dùng tưởng hệ thống hỏng
 * (10 §11), nên Super Admin phải thấy TRƯỚC: bao nhiêu người đổi ngành, ai sẽ
 * mất màu vì chưa được phân công, em nào chưa xếp lớp.
 *
 * Hàm này THUẦN: nhận hai trạng thái đã tra sẵn (bây giờ / sau khi kích hoạt)
 * và chỉ đếm. Không chạm database, không quyết định màu — hệt như cách
 * `decideThemeContext` tách khỏi `resolveThemeContext`.
 *
 * 🔴 KHÔNG tự gán ngành cho người thiếu dữ liệu (15 §4 bước 3.2). Thiếu thì
 * đếm vào cột cảnh báo để người phụ trách xử lý, không đoán hộ.
 */

export type ThemePreviewBranch = {
  themeKey: ThemeKey;
  /** `sectors.name` — "Ấu Nhi". Không được rỗng. */
  branchName: string;
};

export type ThemePreviewKind = "STAFF" | "STUDENT";

export type ThemePreviewPerson = {
  id: string;
  name: string;
  kind: ThemePreviewKind;
  /** Ngành đang có hiệu lực hôm nay. `null` = chưa phân công / chưa xếp lớp. */
  current: ThemePreviewBranch | null;
  /** Ngành sẽ có hiệu lực sau khi kích hoạt. `null` = sẽ chưa có. */
  next: ThemePreviewBranch | null;
};

export type ThemePreviewChange =
  | "CHANGED" // đổi từ ngành này sang ngành khác
  | "BECOMES_UNASSIGNED" // đang có ngành, sau khi kích hoạt thì mất
  | "BECOMES_ASSIGNED" // đang chưa có, sau khi kích hoạt thì có
  | "STAYS_UNASSIGNED" // chưa có và vẫn chưa có
  | "UNCHANGED";

export type ThemePreviewRow = ThemePreviewPerson & { change: ThemePreviewChange };

export type ThemePreviewGroup = {
  kind: ThemePreviewKind;
  /** Tổng số người trong nhóm. */
  total: number;
  /** Đổi từ ngành này sang ngành khác. */
  changed: number;
  /** Từ chưa có ngành thành có ngành. */
  newlyAssigned: number;
  /** SẼ không có ngành sau khi kích hoạt — kể cả người vốn đã không có. */
  unassignedAfter: number;
};

export type ThemePreview = {
  staff: ThemePreviewGroup;
  students: ThemePreviewGroup;
  /**
   * Chỉ những người cần nhìn tới: có thay đổi, hoặc sẽ không có ngành.
   * Người giữ nguyên ngành không nằm trong bảng — 900 dòng "không đổi" chỉ làm
   * chìm mất 23 dòng cần xử lý.
   */
  rows: readonly ThemePreviewRow[];
};

export function classifyThemeChange(person: ThemePreviewPerson): ThemePreviewChange {
  const before = person.current?.themeKey ?? null;
  const after = person.next?.themeKey ?? null;

  if (before === after) return before === null ? "STAYS_UNASSIGNED" : "UNCHANGED";
  if (after === null) return "BECOMES_UNASSIGNED";
  if (before === null) return "BECOMES_ASSIGNED";
  return "CHANGED";
}

function emptyGroup(kind: ThemePreviewKind): ThemePreviewGroup {
  return { kind, total: 0, changed: 0, newlyAssigned: 0, unassignedAfter: 0 };
}

/**
 * Thứ tự tất định (10 §3): nhân sự trước thiếu nhi, rồi theo tên, rồi theo id.
 * Hai lần chạy trên cùng dữ liệu phải cho cùng một bảng — nếu không, Super Admin
 * mở lại màn hình xem trước và thấy thứ tự khác sẽ không dám tin con số nào.
 */
function compareRows(a: ThemePreviewRow, b: ThemePreviewRow): number {
  if (a.kind !== b.kind) return a.kind === "STAFF" ? -1 : 1;
  const byName = a.name.localeCompare(b.name, "vi");
  return byName !== 0 ? byName : a.id.localeCompare(b.id);
}

export function buildThemePreview(
  people: readonly ThemePreviewPerson[],
): ThemePreview {
  const groups: Record<ThemePreviewKind, ThemePreviewGroup> = {
    STAFF: emptyGroup("STAFF"),
    STUDENT: emptyGroup("STUDENT"),
  };
  const rows: ThemePreviewRow[] = [];

  for (const person of people) {
    const change = classifyThemeChange(person);
    const group = groups[person.kind];

    group.total += 1;
    if (change === "CHANGED") group.changed += 1;
    if (change === "BECOMES_ASSIGNED") group.newlyAssigned += 1;
    if (person.next === null) group.unassignedAfter += 1;

    if (change !== "UNCHANGED") rows.push({ ...person, change });
  }

  return {
    staff: groups.STAFF,
    students: groups.STUDENT,
    rows: rows.sort(compareRows),
  };
}
