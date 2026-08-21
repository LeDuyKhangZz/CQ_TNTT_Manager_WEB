/**
 * Tham số lọc, phân trang và luật chọn lớp đích của bảng chuyển lớp — **M08-A,
 * TO-BE 1 (M08-F01 `CRITICAL` 38/75 · M08-F09 28/75)**.
 *
 * 🔴 Vấn đề đang sửa, đúng như 5-Whys `03_AUDIT_RESULTS` §4.1 và §4.4 truy ra:
 * `/promotions` gọi **hai truy vấn cho MỖI ghi danh** (`queries.ts:98-101` cũ:
 * `canProposeForClass` chạy trong một `Promise.all` trên từng phần tử) và tải
 * **toàn bộ** ghi danh của **mọi năm học**, không lọc, không phân trang. Với
 * ~900 em toàn xứ đoàn đó là ~1.800 lượt đi về cơ sở dữ liệu cho một lượt mở
 * trang, và một trang cuộn dài hàng chục nghìn pixel. Gốc rễ mà tài liệu chỉ ra:
 * *"thiếu một truy vấn danh sách được thiết kế cho danh sách"* — quyền per-dòng
 * được suy ra từ một hàm quyền per-thao-tác.
 *
 * File này **thuần** — không import gì từ tầng máy chủ — nên luật *"đường dẫn nào
 * là hợp lệ"* và *"lớp đích mặc định là lớp nào"* kiểm được bằng unit test
 * thường, không phải dựng Supabase. Cùng khuôn `imports/batch-directory.ts`
 * (M12-B) và `students/student-directory.ts` (M03-B), và cố ý dùng lại **đúng**
 * cách đặt tên ở đó (`parse…Criteria` · `…Href` · `clamp…Page` ·
 * `hasActive…Filter`) để người đọc sau không phải học hai bộ khái niệm cho cùng
 * một việc.
 */

import { foldVietnamese } from "@/lib/text/fold-vietnamese";
import type { PromotionFinalStatus } from "./constants";
import { UUID_PATTERN } from "@/lib/validation/uuid";

// ---------------------------------------------------------------------------
// A. Bộ lọc trạng thái
// ---------------------------------------------------------------------------

/**
 * `not_proposed` là **chưa có dòng đề xuất nào** — không phải một giá trị của
 * `promotion_status`. Nó phải nằm cùng bộ với ba trạng thái kia vì trên màn hình
 * người dùng nhìn thấy bốn cái huy hiệu ngang hàng nhau, và *"còn ai chưa đề
 * xuất"* mới là câu hỏi thật của đại diện lớp cuối năm.
 */
export const PROMOTION_STATUS_FILTERS = [
  "all",
  "not_proposed",
  "pending",
  "approved",
  "rejected",
] as const;
export type PromotionStatusFilter = (typeof PROMOTION_STATUS_FILTERS)[number];

export const DEFAULT_PROMOTION_STATUS_FILTER: PromotionStatusFilter = "all";

export const PROMOTION_STATUS_FILTER_LABELS: Readonly<Record<PromotionStatusFilter, string>> = {
  all: "Tất cả trạng thái",
  not_proposed: "Chưa đề xuất",
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
};

export function parsePromotionStatusFilter(value: string | undefined): PromotionStatusFilter {
  return (PROMOTION_STATUS_FILTERS as readonly string[]).includes(value ?? "")
    ? (value as PromotionStatusFilter)
    : DEFAULT_PROMOTION_STATUS_FILTER;
}

/** Trạng thái của một dòng trên bảng: `null` review nghĩa là chưa đề xuất. */
export function rowStatusFilterOf(finalStatus: PromotionFinalStatus | null): PromotionStatusFilter {
  return finalStatus ?? "not_proposed";
}

// ---------------------------------------------------------------------------
// B. Tham số của trang
// ---------------------------------------------------------------------------

/**
 * Hai mươi lăm dòng một trang — đúng con số `04_TO_BE_FLOWS` TO-BE 1 bước 3 chốt.
 *
 * Nằm giữa 20 của `/students` và 50 của `/imports/[batchId]` là có lý do: một
 * lớp đông nhất khoảng 50 em, nên 25 chia lớp ấy thành **đúng hai trang** — vừa
 * đủ để "duyệt hết một lớp" không thành một cuộc cuộn dài, vừa không bắt người
 * duyệt sang trang bốn năm lần cho một lớp.
 */
export const PROMOTION_PAGE_SIZE = 25;

/** `all` mọi lớp trong phạm vi đọc được · còn lại là id một lớp. */
export type PromotionClassFilter = "all" | (string & {});

export interface PromotionBoardCriteria {
  classId: PromotionClassFilter;
  status: PromotionStatusFilter;
  /** Chuỗi người dùng gõ, **chưa** bỏ dấu — giữ nguyên để đổ lại vào ô tìm. */
  search: string;
  page: number;
}

/**
 * Chỉ nhận `all` hoặc một UUID thật.
 *
 * Chuỗi rác đi thẳng vào `.eq()` cho PostgREST lỗi `22P02` và trang **500** —
 * đúng điều `AGENTS` §5 cấm ("Invalid UUID trả 404/validation error, không
 * 500"), mà tham số này lại đến từ thanh địa chỉ nên ai sửa cũng được. Cùng hàng
 * rào `student-directory.ts` (M03-B) và `batch-directory.ts` (M12-B) đã dựng.
 *
 * `04_TO_BE_FLOWS` TO-BE 1 mục "Validation" còn đòi thêm: `classId` không nằm
 * trong tập lớp đọc được thì **hiện lại bộ chọn kèm thông báo, không `throw`** —
 * phần đó nằm ở tầng truy vấn, vì chỉ ở đó mới biết tập lớp là gì.
 */
export function parsePromotionClassFilter(value: string | undefined): PromotionClassFilter {
  if (value === undefined || value === "" || value === "all") return "all";
  return UUID_PATTERN.test(value) ? value : "all";
}

export function parsePromotionPage(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function parsePromotionCriteria(
  params: Readonly<Record<string, string | string[] | undefined>>,
): PromotionBoardCriteria {
  const one = (key: string): string | undefined => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };
  return {
    classId: parsePromotionClassFilter(one("classId")),
    status: parsePromotionStatusFilter(one("status")),
    search: (one("q") ?? "").trim(),
    page: parsePromotionPage(one("page")),
  };
}

/**
 * Đường dẫn giữ nguyên bộ lọc khi đổi trang — TO-BE 1 bước 2 đòi trạng thái nằm
 * **trên URL** để chia sẻ được và bấm Back được.
 */
export function promotionsHref(criteria: PromotionBoardCriteria, page: number): string {
  const params = new URLSearchParams();
  if (criteria.classId !== "all") params.set("classId", criteria.classId);
  if (criteria.status !== DEFAULT_PROMOTION_STATUS_FILTER) params.set("status", criteria.status);
  if (criteria.search) params.set("q", criteria.search);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/promotions?${query}` : "/promotions";
}

/** Ô "Chờ duyệt 4" trong bảng tiến độ dẫn thẳng vào đúng lớp ở đúng trạng thái. */
export function promotionCellHref(classId: string, status: PromotionStatusFilter): string {
  return promotionsHref({ classId, status, search: "", page: 1 }, 1);
}

/** Có bộ lọc nào đang bật không — quyết định trạng thái rỗng nói câu gì (`09` §9). */
export function hasActivePromotionFilter(criteria: PromotionBoardCriteria): boolean {
  return (
    criteria.classId !== "all" ||
    criteria.status !== DEFAULT_PROMOTION_STATUS_FILTER ||
    criteria.search !== ""
  );
}

/**
 * Trang cuối cùng có nghĩa với một tổng số cho trước.
 *
 * Cần thiết vì số trang đọc từ thanh địa chỉ: lọc lại cho ít dòng hơn rồi bấm
 * dấu trang cũ `?page=12` sẽ ra một trang **trống không giải thích**.
 */
export function clampPromotionPage(page: number, totalItems: number): number {
  const pageCount = Math.max(1, Math.ceil(totalItems / PROMOTION_PAGE_SIZE));
  return Math.min(Math.max(1, page), pageCount);
}

// ---------------------------------------------------------------------------
// C. Lọc và sắp xếp một danh sách đã đọc về
// ---------------------------------------------------------------------------

/** Phần tối thiểu của một dòng mà các hàm thuần dưới đây cần biết. */
export interface PromotionFilterableRow {
  studentName: string;
  classId: string;
  finalStatus: PromotionFinalStatus | null;
}

/**
 * Lọc theo lớp · trạng thái · tên (không dấu).
 *
 * Chạy trong Node chứ không trong SQL, và đó là một lựa chọn **có đo lường**:
 * phép lọc theo trạng thái hỏi *"ghi danh này CÓ dòng đề xuất nào không"* — một
 * phép nối trái mà PostgREST không diễn đạt được kèm `range()` trong một lượt
 * gọi. Cách duy nhất làm ở tầng cơ sở dữ liệu là gửi lên danh sách vài trăm UUID
 * trong chuỗi truy vấn, thứ vỡ ở giới hạn độ dài URL.
 *
 * 🔴 Điều AC-13 thật sự đòi là **"số truy vấn ≤ 6, không phụ thuộc số dòng"** —
 * và điều đó vẫn đúng: cả trang dùng 3–5 lượt gọi cố định dù có 50 hay 5.000
 * ghi danh. Cái bị bỏ là 1.800 lượt gọi, không phải một lượt gọi to.
 */
export function filterPromotionRows<T extends PromotionFilterableRow>(
  rows: readonly T[],
  criteria: PromotionBoardCriteria,
): T[] {
  const folded = foldVietnamese(criteria.search);
  return rows.filter((row) => {
    if (criteria.classId !== "all" && row.classId !== criteria.classId) return false;
    if (criteria.status !== "all" && rowStatusFilterOf(row.finalStatus) !== criteria.status) {
      return false;
    }
    if (folded && !foldVietnamese(row.studentName).includes(folded)) return false;
    return true;
  });
}

// ---------------------------------------------------------------------------
// D. Bảng tiến độ theo lớp — TO-BE 1 bước 1
// ---------------------------------------------------------------------------

export interface PromotionClassProgress {
  classId: string;
  className: string;
  /** Sĩ số = số ghi danh còn mở (`active`/`paused`) của lớp. */
  rosterSize: number;
  notProposed: number;
  pending: number;
  approved: number;
  rejected: number;
}

/**
 * Đếm tiến độ của **cả phạm vi**, không đếm trên trang đang xem.
 *
 * 🔴 Đây đúng cái bẫy M12-B đã vấp và ghi lại: ba con số đầu trang từng đếm trên
 * trang hiện tại, nên một lần nhập 900 dòng hiện nút *"Ghi 50 dòng"* — sai mà
 * không gì báo là sai. Ở đây hậu quả còn nặng hơn: bảng tiến độ là thứ **duy
 * nhất** trả lời được câu *"còn bao nhiêu em nữa thì xong"*, nên nó đếm sai là
 * người duyệt tưởng đã xong trong khi chưa.
 */
export function buildClassProgress(
  rows: readonly (PromotionFilterableRow & { className: string; enrollmentOpen: boolean })[],
): PromotionClassProgress[] {
  const byClass = new Map<string, PromotionClassProgress>();
  for (const row of rows) {
    let entry = byClass.get(row.classId);
    if (!entry) {
      entry = {
        classId: row.classId,
        className: row.className,
        rosterSize: 0,
        notProposed: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
      };
      byClass.set(row.classId, entry);
    }
    if (row.enrollmentOpen) entry.rosterSize += 1;
    if (row.finalStatus === null) entry.notProposed += 1;
    else entry[row.finalStatus] += 1;
  }
  return [...byClass.values()].sort((left, right) =>
    left.className.localeCompare(right.className, "vi"),
  );
}

// ---------------------------------------------------------------------------
// E. BR-M08-X2 — mặc định giữ nhánh A/B
// ---------------------------------------------------------------------------

export interface PromotionTargetLike {
  id: string;
  sectionCode: string | null;
  displayName: string;
}

/**
 * **BR-M08-X2 — `docs/03` WF-11 nói "mặc định giữ nhánh A/B"; hệ thống chưa bao
 * giờ làm điều đó.**
 *
 * `promotion-board.tsx` cũ lấy **phần tử đầu** của danh sách đã sắp theo
 * `display_name` (`:52`), nên một em đang học **Ấu 1B** luôn được đề xuất sẵn
 * sang **Ấu 2A**. Hai hệ quả, và cái thứ hai nặng hơn:
 *
 *   1. Người đề xuất phải sửa tay ở **mọi** em của mọi lớp nhánh B.
 *   2. Ô lớp đích **tự chọn sẵn một giá trị hợp lệ**, nên một cú bấm "Lưu đề
 *      xuất" là ra một đề xuất trông hoàn chỉnh mà người dùng **chưa thực sự
 *      quyết định** — đúng điều `03_AUDIT_RESULTS` tiêu chí 5 trừ điểm.
 *
 * Nay: cùng nhánh trước, không có thì mới lấy phần tử đầu. Lớp không chia nhánh
 * (`section_code` null, ví dụ Thiếu 3 → Nghĩa 1) rơi vào nhánh sau — đúng, vì ở
 * đó không có gì để "giữ".
 */
export function defaultTargetClassId(
  sourceSectionCode: string | null,
  targets: readonly PromotionTargetLike[],
): string {
  if (targets.length === 0) return "";
  if (sourceSectionCode !== null) {
    const sameSection = targets.find((target) => target.sectionCode === sourceSectionCode);
    if (sameSection) return sameSection.id;
  }
  return targets[0].id;
}
