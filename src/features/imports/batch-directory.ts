/**
 * Tham số lọc và phân trang của luồng nhập Excel — M12-B, **TO-BE 7 / AC-25**.
 *
 * 🔴 Vấn đề đang sửa: trang chi tiết một lần nhập dựng **toàn bộ** dòng trong một
 * lượt (`[batchId]/page.tsx` cũ `batch.rows.map(…)` không cắt trang), còn danh
 * sách lần nhập cắt cứng **20 cái mới nhất** (`queries.ts:159 .limit(20)`) mà
 * không cho lọc, không cho sang trang. Một sổ lớp thật của xứ đoàn là **300–900
 * dòng**: trang chi tiết vì thế vừa nặng vừa không tìm được dòng cần sửa, mà đây
 * lại chính là màn hình người duyệt phải ngồi lâu nhất.
 *
 * File **thuần** — không import gì từ tầng server — nên luật "URL nào là hợp lệ"
 * kiểm được bằng unit test thường, không phải dựng Supabase. Cùng khuôn
 * `students/student-directory.ts` của M03-B, và cố ý dùng lại đúng cách đặt tên
 * ở đó (`parse…Criteria` · `…ListHref` · `clamp…Page` · `hasActive…Filter`) để
 * người đọc sau không phải học hai bộ khái niệm cho cùng một việc.
 */

import type { RowAction } from "./row-decision";
import { UUID_PATTERN } from "@/lib/validation/uuid";

// ---------------------------------------------------------------------------
// A. Dòng trong một lần nhập
// ---------------------------------------------------------------------------

/**
 * Năm mươi dòng một trang — đúng con số `04_TO_BE_FLOWS` TO-BE 7 chốt.
 *
 * Lớn hơn 20 của `/students` là có lý do: ở đây người dùng đang **điền giới tính
 * hàng loạt**, tức việc của họ là quét mắt xuống một cột và chọn liên tục. Cắt
 * trang quá nhỏ thì mỗi lượt "Lưu tất cả thay đổi" chỉ gom được vài dòng, đúng
 * cái phiền mà TO-BE 4 sinh ra để bỏ.
 */
export const BATCH_ROW_PAGE_SIZE = 50;

/** `all` là mọi dòng; còn lại là một giá trị của `import_row_status`. */
export const ROW_STATUS_FILTERS = [
  "all",
  "error",
  "warning",
  "valid",
  "committed",
  "skipped",
] as const;
export type RowStatusFilter = (typeof ROW_STATUS_FILTERS)[number];

export const DEFAULT_ROW_STATUS_FILTER: RowStatusFilter = "all";

/**
 * Nhãn đúng thứ tự `04_TO_BE_FLOWS` liệt kê: *Tất cả / Lỗi / Cảnh báo / Hợp lệ /
 * Đã ghi / Bỏ qua*. Giữ nguyên câu chữ đang hiện trên huy hiệu trạng thái dòng —
 * bộ lọc gọi tên một đằng, huy hiệu gọi một nẻo là bắt người dùng tự dịch.
 */
export const ROW_STATUS_FILTER_LABELS: Readonly<Record<RowStatusFilter, string>> = {
  all: "Tất cả",
  error: "Lỗi",
  warning: "Cảnh báo",
  valid: "Hợp lệ",
  committed: "Đã ghi",
  skipped: "Bỏ qua",
};

export function parseRowStatusFilter(value: string | undefined): RowStatusFilter {
  return (ROW_STATUS_FILTERS as readonly string[]).includes(value ?? "")
    ? (value as RowStatusFilter)
    : DEFAULT_ROW_STATUS_FILTER;
}

export interface BatchRowCriteria {
  status: RowStatusFilter;
  page: number;
}

// ---------------------------------------------------------------------------
// B. Danh sách lần nhập
// ---------------------------------------------------------------------------

/** Hai mươi lần nhập một trang — giữ đúng con số `limit(20)` cũ, nay có trang sau. */
export const BATCH_PAGE_SIZE = 20;

export const BATCH_STATUS_FILTERS = [
  "all",
  "dry_run",
  "partially_committed",
  "committed",
  "cancelled",
] as const;
export type BatchStatusFilter = (typeof BATCH_STATUS_FILTERS)[number];

export const DEFAULT_BATCH_STATUS_FILTER: BatchStatusFilter = "all";

export const BATCH_STATUS_FILTER_LABELS: Readonly<Record<BatchStatusFilter, string>> = {
  all: "Tất cả trạng thái",
  dry_run: "Đã kiểm tra, chờ xác nhận",
  partially_committed: "Ghi một phần — còn dòng lỗi",
  committed: "Đã ghi vào hệ thống",
  cancelled: "Đã huỷ",
};

export function parseBatchStatusFilter(value: string | undefined): BatchStatusFilter {
  return (BATCH_STATUS_FILTERS as readonly string[]).includes(value ?? "")
    ? (value as BatchStatusFilter)
    : DEFAULT_BATCH_STATUS_FILTER;
}

/**
 * `current` là **năm học hiện hành** — mặc định, và cố ý không phải một id cụ thể.
 *
 * 🔴 Chủ dự án chốt 2026-07-29 (D-135): mở trang ra thấy đúng lần nhập của năm
 * đang chạy. Lưu mặc định bằng chữ `current` thay vì bằng id năm học làm cho
 * đường dẫn `/imports` **không bao giờ cũ**: sang năm học mới thì cùng một đường
 * dẫn ấy vẫn trỏ đúng năm mới, còn dấu trang cũ của ai đó không âm thầm khoá họ
 * vào năm 2026 mãi mãi.
 */
export type BatchYearFilter = "current" | "all" | (string & {});

export const DEFAULT_BATCH_YEAR_FILTER: BatchYearFilter = "current";

export interface BatchListCriteria {
  status: BatchStatusFilter;
  yearId: BatchYearFilter;
  page: number;
}

// ---------------------------------------------------------------------------
// C. Dùng chung
// ---------------------------------------------------------------------------

/**
 * Chỉ nhận một trong các từ khoá cho trước hoặc một UUID thật.
 *
 * Chuỗi rác đi thẳng vào `.eq()` cho PostgREST lỗi `22P02` và trang **500** —
 * đúng điều `AGENTS` §5 cấm, mà tham số này lại đến từ thanh địa chỉ nên ai sửa
 * cũng được. Cùng hàng rào `student-directory.ts` đã dựng ở M03-B.
 */
function parseIdFilter<T extends string>(value: string | undefined, keywords: readonly T[], fallback: T): T | string {
  if (value === undefined || value === "") return fallback;
  if ((keywords as readonly string[]).includes(value)) return value as T;
  return UUID_PATTERN.test(value) ? value : fallback;
}

function firstParam(
  params: Readonly<Record<string, string | string[] | undefined>>,
  key: string,
): string | undefined {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export function parsePage(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function parseBatchRowCriteria(
  params: Readonly<Record<string, string | string[] | undefined>>,
): BatchRowCriteria {
  return {
    status: parseRowStatusFilter(firstParam(params, "status")),
    page: parsePage(firstParam(params, "page")),
  };
}

export function parseBatchListCriteria(
  params: Readonly<Record<string, string | string[] | undefined>>,
): BatchListCriteria {
  return {
    status: parseBatchStatusFilter(firstParam(params, "status")),
    yearId: parseIdFilter(firstParam(params, "year"), ["current", "all"] as const, "current"),
    page: parsePage(firstParam(params, "page")),
  };
}

/**
 * Trang cuối cùng có nghĩa với một tổng số cho trước.
 *
 * Cần thiết vì số trang đọc từ thanh địa chỉ: lọc lại cho ít dòng hơn rồi bấm
 * dấu trang cũ `?page=12` sẽ ra một trang **trống không giải thích**.
 */
export function clampPage(page: number, totalItems: number, pageSize: number): number {
  const pageCount = Math.max(1, Math.ceil(totalItems / Math.max(1, pageSize)));
  return Math.min(Math.max(1, page), pageCount);
}

/** Đường dẫn trang chi tiết một lần nhập, giữ nguyên bộ lọc khi đổi trang. */
export function batchRowsHref(batchId: string, criteria: BatchRowCriteria, page: number): string {
  const params = new URLSearchParams();
  if (criteria.status !== DEFAULT_ROW_STATUS_FILTER) params.set("status", criteria.status);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/imports/${batchId}?${query}` : `/imports/${batchId}`;
}

/** Đường dẫn danh sách lần nhập, giữ nguyên bộ lọc khi đổi trang. */
export function batchListHref(criteria: BatchListCriteria, page: number): string {
  const params = new URLSearchParams();
  if (criteria.status !== DEFAULT_BATCH_STATUS_FILTER) params.set("status", criteria.status);
  if (criteria.yearId !== DEFAULT_BATCH_YEAR_FILTER) params.set("year", criteria.yearId);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/imports?${query}` : "/imports";
}

/** Có bộ lọc nào đang bật không — quyết định trạng thái rỗng nói câu gì (`09` §9). */
export function hasActiveRowFilter(criteria: BatchRowCriteria): boolean {
  return criteria.status !== DEFAULT_ROW_STATUS_FILTER;
}

export function hasActiveBatchFilter(criteria: BatchListCriteria): boolean {
  return (
    criteria.status !== DEFAULT_BATCH_STATUS_FILTER || criteria.yearId !== DEFAULT_BATCH_YEAR_FILTER
  );
}

// ---------------------------------------------------------------------------
// D. Tên trường của biểu mẫu sửa hàng loạt — TO-BE 4
// ---------------------------------------------------------------------------

/**
 * Một biểu mẫu duy nhất mang **tất cả** dòng của trang, nên tên trường phải gắn
 * id dòng vào. Ba tiền tố này là hợp đồng giữa `BatchRowEditor` và `saveRowEdits`;
 * để chúng ở đây (file thuần) nghĩa là unit test đọc được cùng một hằng số với
 * mã chạy thật, thay vì chép tay chuỗi `"gender__"` ở ba chỗ.
 */
export const ROW_FIELD_PREFIX = {
  /** Ô đánh dấu để "Áp dụng Nam/Nữ cho các dòng đang chọn" biết áp cho ai. */
  pick: "pick__",
  gender: "gender__",
  action: "action__",
} as const;

/** Nút "Xác nhận dòng này" của một dòng nghi trùng chắc chắn — mang id dòng đó. */
export const CONFIRM_ROW_FIELD = "confirmRow";
/** Đường dự phòng khi chưa có JavaScript: "Áp dụng Nam/Nữ" gửi thẳng lên máy chủ. */
export const BULK_GENDER_FIELD = "bulkGender";

export interface RowEditEntry {
  rowId: string;
  /** `null` = người dùng chưa chọn gì cho dòng này. */
  gender: string | null;
  action: string | null;
  picked: boolean;
}

/**
 * Đọc `FormData` của biểu mẫu sửa hàng loạt thành danh sách quyết định từng dòng.
 *
 * Tách khỏi Server Action để kiểm được bằng unit test thường: đây là chỗ dễ sai
 * im lặng nhất của cả đợt (một tiền tố gõ nhầm thì biểu mẫu vẫn gửi, máy chủ vẫn
 * trả "đã lưu 0 dòng", và không ai biết vì sao).
 */
export function readRowEdits(formData: {
  entries: () => IterableIterator<[string, FormDataEntryValue]>;
}): RowEditEntry[] {
  const byId = new Map<string, RowEditEntry>();
  const ensure = (rowId: string): RowEditEntry => {
    const existing = byId.get(rowId);
    if (existing) return existing;
    const created: RowEditEntry = { rowId, gender: null, action: null, picked: false };
    byId.set(rowId, created);
    return created;
  };

  for (const [key, value] of formData.entries()) {
    if (typeof value !== "string") continue;
    if (key.startsWith(ROW_FIELD_PREFIX.pick)) {
      ensure(key.slice(ROW_FIELD_PREFIX.pick.length)).picked = true;
    } else if (key.startsWith(ROW_FIELD_PREFIX.gender)) {
      // Chuỗi rỗng là "— Chọn —", tức **chưa chọn**, không phải một giá trị.
      if (value !== "") ensure(key.slice(ROW_FIELD_PREFIX.gender.length)).gender = value;
      else ensure(key.slice(ROW_FIELD_PREFIX.gender.length));
    } else if (key.startsWith(ROW_FIELD_PREFIX.action)) {
      if (value !== "") ensure(key.slice(ROW_FIELD_PREFIX.action.length)).action = value;
      else ensure(key.slice(ROW_FIELD_PREFIX.action.length));
    }
  }

  return [...byId.values()];
}

/** Nhãn tiếng Việt của một quyết định dòng — dùng chung cho bảng và thẻ. */
export const ROW_ACTION_LABELS: Readonly<Record<RowAction, string>> = {
  create: "Tạo mới",
  merge: "Ghép hồ sơ có sẵn",
  skip: "Bỏ qua",
};
