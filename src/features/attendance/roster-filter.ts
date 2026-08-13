import { foldVietnamese } from "@/lib/text/fold-vietnamese";
import { isAbsent, type AttendanceStatus } from "./constants";

/**
 * Lọc danh sách điểm danh — M05-C / U-11, TB-09.
 *
 * 🔴 Thuần client và **thuần hàm**: không gọi máy chủ, không đọc React state.
 * Lý do không phải cho gọn — ở 360px một lớp 50 em dài ~9.000px, và việc người
 * điểm danh thật sự làm là *"soát lại mình đã đánh vắng ai"* ngay trước khi
 * chốt. Gọi máy chủ cho việc đó nghĩa là đợi mạng 4G sân nhà thờ giữa lúc đang
 * đếm người; và bộ lọc phải chạy trên **bản nháp đang gõ**, không phải trên dữ
 * liệu đã lưu — em vừa được đánh vắng phải rơi vào nhóm "Đang vắng" ngay lập
 * tức, kể cả khi chưa bấm Lưu.
 */

export const ROSTER_FILTERS = ["all", "absent", "requested", "warned"] as const;

export type RosterFilter = (typeof ROSTER_FILTERS)[number];

export const ROSTER_FILTER_LABELS: Readonly<Record<RosterFilter, string>> = {
  all: "Tất cả",
  absent: "Đang vắng",
  requested: "Có đơn",
  warned: "Cảnh báo",
};

/** Phần dữ liệu của một em mà bộ lọc cần biết — cố ý KHÔNG lấy cả roster entry. */
export interface RosterFilterEntry {
  enrollmentId: string;
  label: string;
  pendingAbsenceReason: string | null;
  warnings: readonly string[];
}

/** Trạng thái **đang gõ** của một em, tra theo `enrollmentId`. */
export type RosterDraftLookup = Readonly<
  Record<string, { mass: AttendanceStatus; catechism: AttendanceStatus } | undefined>
>;

function matchesGroup(
  entry: RosterFilterEntry,
  drafts: RosterDraftLookup,
  filter: RosterFilter,
): boolean {
  if (filter === "all") return true;
  if (filter === "requested") return entry.pendingAbsenceReason !== null;
  if (filter === "warned") return entry.warnings.length > 0;

  // "Đang vắng" đọc bản nháp, không đọc dữ liệu đã lưu. Em chưa có bản nháp
  // (chưa dựng xong) thì không tính là vắng — mặc định của module là "có mặt".
  const draft = drafts[entry.enrollmentId];
  if (!draft) return false;
  return isAbsent(draft.mass) || isAbsent(draft.catechism);
}

/**
 * Có khớp ô tìm tên không. Bỏ dấu **cả hai vế** — người điểm danh gõ "an" trên
 * bàn phím điện thoại không bao giờ gõ ra "Ân", và tên trong cơ sở dữ liệu thì
 * có dấu đầy đủ.
 */
function matchesQuery(entry: RosterFilterEntry, foldedQuery: string): boolean {
  if (foldedQuery === "") return true;
  return foldVietnamese(entry.label).includes(foldedQuery);
}

export function filterRoster<T extends RosterFilterEntry>(
  entries: readonly T[],
  drafts: RosterDraftLookup,
  filter: RosterFilter,
  query: string,
): T[] {
  const foldedQuery = foldVietnamese(query);
  return entries.filter(
    (entry) => matchesGroup(entry, drafts, filter) && matchesQuery(entry, foldedQuery),
  );
}

/**
 * Số em của từng nhóm — hiện ngay trên nút lọc.
 *
 * Con số **không** chịu ảnh hưởng của ô tìm tên: nút lọc phải nói *"cả buổi này
 * có 3 em đang vắng"*, chứ không phải *"trong số em khớp chữ bạn vừa gõ thì có
 * 3 em vắng"* — người ta đọc con số ấy để quyết định có bấm hay không.
 */
export function countRosterFilters(
  entries: readonly RosterFilterEntry[],
  drafts: RosterDraftLookup,
): Record<RosterFilter, number> {
  return {
    all: entries.length,
    absent: entries.filter((entry) => matchesGroup(entry, drafts, "absent")).length,
    requested: entries.filter((entry) => matchesGroup(entry, drafts, "requested")).length,
    warned: entries.filter((entry) => matchesGroup(entry, drafts, "warned")).length,
  };
}

/** Câu giải thích khi bộ lọc không còn em nào — nêu **đúng** thứ đang lọc. */
export function emptyRosterMessage(filter: RosterFilter, query: string): string {
  const trimmed = query.trim();
  if (trimmed !== "") {
    return `Không có em nào khớp “${trimmed}” trong nhóm “${ROSTER_FILTER_LABELS[filter]}”.`;
  }
  switch (filter) {
    case "absent":
      return "Chưa em nào được đánh vắng trong buổi này.";
    case "requested":
      return "Không em nào của lớp có đơn xin nghỉ cho buổi này.";
    case "warned":
      return "Không em nào của lớp đang bị cảnh báo chuyên cần.";
    default:
      return "Lớp chưa có thiếu nhi ghi danh.";
  }
}
