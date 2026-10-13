import { foldVietnamese } from "@/lib/text/fold-vietnamese";
import { UUID_PATTERN } from "@/lib/validation/uuid";

/**
 * Tham số của danh sách thiếu nhi — TB-F03 (đóng M03-F03, 59/75).
 *
 * 🔴 **Khác hẳn `staff-directory.ts` của M04, và khác có chủ đích.** Ở đó danh
 * sách nhân sự là hàng CHỤC dòng nên lọc trong bộ nhớ Node là rẻ. Ở đây là
 * **~900 em**: kéo cả bảng về rồi mới cắt trang chính là thứ TB-F03 sinh ra để
 * bỏ. Nên file này **chỉ đọc và kiểm tham số**; việc lọc, sắp xếp và cắt trang
 * xảy ra trong SQL trên khung nhìn `public.student_directory`.
 *
 * Vì thế đây là các hàm THUẦN quanh `searchParams`: chúng quyết định URL nào là
 * hợp lệ, và unit test canh được luật đó mà không phải dựng Supabase.
 */

/**
 * Hai mươi em một trang. Danh sách này là **thẻ** trên mobile và **bảng** trên
 * máy tính (`09` §11); hai mươi thẻ là khoảng hai lượt cuộn trên máy 360px, và
 * là con số làm cho một lớp đông nhất (~50 em) gọn trong ba trang.
 */
export const STUDENT_PAGE_SIZE = 20;
export const STUDENT_PAGE_SIZES = [20, 50] as const;
export const STUDENT_SORT_COLUMNS = { name: "full_name", class: "class_name" } as const;
export type StudentSortKey = keyof typeof STUDENT_SORT_COLUMNS;

/** `all` mọi trạng thái · còn lại là một giá trị của `student_status`. */
export const STUDENT_STATUS_FILTERS = [
  "active",
  "all",
  "temporarily_inactive",
  "withdrawn",
  "archived",
] as const;
export type StudentStatusFilter = (typeof STUDENT_STATUS_FILTERS)[number];

/**
 * Mặc định **chỉ hiện em đang sinh hoạt**. Hồ sơ đã rút và đã lưu trữ tích tụ
 * theo năm; để chúng lẫn vào danh sách mặc định là bắt người dùng lọc bằng mắt
 * mỗi lần tra cứu. Số hồ sơ bị ẩn phải được **nói ra trên màn hình** — cùng bài
 * học D-108 của M04: một danh sách tự ẩn bớt mà không nói gì khiến người dùng
 * tưởng hồ sơ đã biến mất.
 */
export const DEFAULT_STUDENT_STATUS_FILTER: StudentStatusFilter = "active";

export const STUDENT_STATUS_FILTER_LABELS: Readonly<Record<StudentStatusFilter, string>> = {
  active: "Đang sinh hoạt",
  all: "Tất cả trạng thái",
  temporarily_inactive: "Tạm nghỉ",
  withdrawn: "Đã rút",
  archived: "Đã lưu trữ",
};

export function parseStudentStatusFilter(value: string | undefined): StudentStatusFilter {
  return (STUDENT_STATUS_FILTERS as readonly string[]).includes(value ?? "")
    ? (value as StudentStatusFilter)
    : DEFAULT_STUDENT_STATUS_FILTER;
}

/** `all` mọi lớp · `none` chỉ em CHƯA xếp lớp năm nay · còn lại là id một lớp. */
export type StudentClassFilter = "all" | "none" | (string & {});

/** `all` mọi ngành · còn lại là id một ngành. Em chưa xếp lớp không có ngành. */
export type StudentSectorFilter = "all" | (string & {});

export interface StudentDirectoryCriteria {
  /** Chuỗi người dùng gõ, chưa bỏ dấu. */
  search: string;
  sectorId: StudentSectorFilter;
  classId: StudentClassFilter;
  status: StudentStatusFilter;
  page: number;
  pageSize: number;
  sectorIds: string[];
  classIds: string[];
  statuses: Exclude<StudentStatusFilter, "all">[];
  sort: StudentSortKey;
  direction: "asc" | "desc";
}

/**
 * Chỉ nhận `all`, `none`, hoặc một UUID thật. Chuỗi rác đi thẳng vào `eq()` cho
 * PostgREST một lỗi `22P02` khô khốc và trang **500** — đúng điều `AGENTS` §5
 * cấm ("Invalid UUID trả 404/validation error, không 500"), mà ở đây tham số
 * lại đến từ thanh địa chỉ nên ai cũng sửa được.
 */
function parseIdFilter(value: string | undefined, allowNone: boolean): string {
  if (value === undefined || value === "" || value === "all") return "all";
  if (allowNone && value === "none") return "none";
  return UUID_PATTERN.test(value) ? value : "all";
}

export function parseStudentPage(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? Math.min(parsed, 1_000_000) : 1;
}

export function parseStudentCriteria(
  params: Readonly<Record<string, string | string[] | undefined>>,
): StudentDirectoryCriteria {
  const one = (key: string): string | undefined => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const many = (key: string): string[] => {
    const value = params[key];
    return [...new Set(Array.isArray(value) ? value : value === undefined ? [] : [value])];
  };
  const sectorIds = many("sector").filter(value => UUID_PATTERN.test(value));
  const classIds = many("class").filter(value => value === "none" || UUID_PATTERN.test(value));
  const statusValues = params.status === undefined && one("statusMode") === "facet" ? ["all"] : many("status");
  const statuses = statusValues.includes("all") ? [] : statusValues.filter(
    (value): value is Exclude<StudentStatusFilter, "all"> => value !== "all" && (STUDENT_STATUS_FILTERS as readonly string[]).includes(value),
  );
  if (!statusValues.includes("all") && statuses.length === 0) statuses.push(DEFAULT_STUDENT_STATUS_FILTER as "active");
  return {
    search: (one("q") ?? "").trim(),
    sectorId: parseIdFilter(sectorIds[0], false),
    classId: parseIdFilter(classIds[0], true),
    status: statuses[0] ?? "all",
    page: parseStudentPage(one("page")),
    pageSize: one("size") === "50" ? 50 : STUDENT_PAGE_SIZE,
    sectorIds,
    classIds,
    statuses,
    sort: one("sort") === "class" ? "class" : "name",
    direction: one("dir") === "desc" ? "desc" : "asc",
  };
}

/** The fee RPC supports one value per facet and a fixed, global name order. */
export function feeStudentCriteria(criteria: StudentDirectoryCriteria): StudentDirectoryCriteria {
  return {
    ...criteria,
    sectorIds: criteria.sectorIds.slice(0, 1),
    classIds: criteria.classIds.slice(0, 1),
    statuses: criteria.statuses.slice(0, 1),
    sort: "name",
    direction: "asc",
  };
}

/**
 * Chuỗi để so trong SQL. Bỏ dấu bằng **đúng luật** mà `app.fold_vietnamese()`
 * dùng cho cột `students.search_name` (D-126) — hai bên lệch nhau thì ô tìm
 * kiếm im lặng không ra kết quả nào.
 */
export function foldSearchTerm(search: string): string {
  return foldVietnamese(search);
}

/** Chỉ giữ chữ số, để tìm theo số điện thoại người giám hộ bất kể cách gõ. */
export function searchDigits(search: string): string {
  return search.replace(/\D/g, "");
}

export interface StudentDirectoryQuery {
  /** Bỏ trống nghĩa là không lọc theo tên. */
  foldedName: string;
  phoneDigits: string;
  sectorId: StudentSectorFilter;
  classId: StudentClassFilter;
  status: StudentStatusFilter;
  sectorIds: string[];
  classIds: string[];
  statuses: Exclude<StudentStatusFilter, "all">[];
  /** Chỉ số dòng đầu, đếm từ 0 — hợp với `range()` của PostgREST. */
  from: number;
  to: number;
}

export function buildStudentQuery(criteria: StudentDirectoryCriteria): StudentDirectoryQuery {
  const from = (criteria.page - 1) * criteria.pageSize;
  return {
    foldedName: foldSearchTerm(criteria.search),
    phoneDigits: searchDigits(criteria.search),
    sectorId: criteria.sectorId,
    classId: criteria.classId,
    status: criteria.status,
    sectorIds: criteria.sectorIds,
    classIds: criteria.classIds,
    statuses: criteria.statuses,
    from,
    to: from + criteria.pageSize - 1,
  };
}

/**
 * Trang cuối cùng có nghĩa với một tổng số cho trước.
 *
 * Cần thiết vì trang được đọc từ thanh địa chỉ: xoá bớt vài em rồi bấm lại dấu
 * trang cũ `?page=40` sẽ cho một trang **trống không giải thích**. Trang nào
 * vượt quá thì kéo về trang cuối.
 */
export function clampStudentPage(page: number, totalItems: number, pageSize = STUDENT_PAGE_SIZE): number {
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  return Math.min(Math.max(1, page), pageCount);
}

/** Có bộ lọc nào đang bật không — quyết định trạng thái rỗng nói câu gì (`09` §9). */
export function hasActiveStudentFilter(
  criteria: StudentDirectoryCriteria,
  defaultStatus: StudentStatusFilter = DEFAULT_STUDENT_STATUS_FILTER,
): boolean {
  return (
    criteria.search !== "" ||
    criteria.sectorIds.length > 0 ||
    criteria.classIds.length > 0 ||
    (defaultStatus === "all" ? criteria.statuses.length > 0 : criteria.statuses.length !== 1 || criteria.statuses[0] !== defaultStatus)
  );
}

/** Đường dẫn giữ nguyên bộ lọc khi đổi trang. */
export function studentListHref(
  criteria: StudentDirectoryCriteria,
  page: number,
  defaultStatus: StudentStatusFilter = DEFAULT_STUDENT_STATUS_FILTER,
): string {
  const params = new URLSearchParams();
  if (criteria.search) params.set("q", criteria.search);
  criteria.sectorIds.forEach(value => params.append("sector", value));
  criteria.classIds.forEach(value => params.append("class", value));
  if (criteria.statuses.length === 0) {
    if (defaultStatus !== "all") params.set("status", "all");
  } else if (criteria.statuses.length !== 1 || criteria.statuses[0] !== defaultStatus) {
    criteria.statuses.forEach(value => params.append("status", value));
  }
  if (criteria.sort !== "name") params.set("sort", criteria.sort);
  if (criteria.direction !== "asc") params.set("dir", criteria.direction);
  if (criteria.pageSize !== STUDENT_PAGE_SIZE) params.set("size", String(criteria.pageSize));
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/students?${query}` : "/students";
}
