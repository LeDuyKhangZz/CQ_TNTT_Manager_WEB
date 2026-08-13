import { foldVietnamese } from "@/lib/text/fold-vietnamese";

/**
 * Danh sách nhân sự dùng được — TB-M04-04 (đóng M04-F01) + D-108.
 *
 * Hàm THUẦN, không `"use client"`, không import gì từ tầng server: lọc và phân
 * trang kiểm được bằng unit test mà không phải dựng Supabase hay Server Action.
 *
 * 🔴 Vì sao lọc TRONG BỘ NHỚ chứ không đẩy xuống SQL — quyết định có chủ ý:
 * bảng `staff_profiles` của một xứ đoàn là hàng CHỤC dòng (không phải ~900 như
 * `students`), nên tải hết rồi lọc tốn không đáng kể. Đổi lại được hai thứ mà
 * `ilike` của Postgres không cho: tìm KHÔNG DẤU đúng luật tiếng Việt (gõ "tran"
 * ra "Trần"), và toàn bộ luật lọc nằm trong một hàm thuần kiểm được bằng test
 * thường. Nếu về sau danh sách phình lên thì chỗ phải sửa là đây, và các bài
 * test ở `tests/unit/staff-directory.test.ts` chính là đặc tả để viết lại bằng SQL.
 */

/** Mười thẻ một trang: danh sách này là THẺ (09 §11 "card thay vì bảng"), và
 *  mười thẻ vừa đúng một lượt cuộn trên máy 360px. */
export const STAFF_PAGE_SIZE = 10;

export const TITLE_LABELS: Readonly<Record<string, string>> = {
  anh: "Anh", chi: "Chị", di: "Dì", so: "Sơ", cha: "Cha", thay: "Thầy", other: "Khác",
};

/**
 * Trình độ huấn luyện bằng TIẾNG VIỆT (AC-M04-06). Trước M04-B danh sách in
 * `formationLevel.toUpperCase()` ⇒ người dùng đọc được chữ **`NONE`** trên màn
 * hình quản lý nhân sự của một xứ đoàn.
 */
export const FORMATION_LABELS: Readonly<Record<string, string>> = {
  none: "Chưa qua huấn luyện", i: "Cấp I", ii: "Cấp II", iii: "Cấp III", special: "Đặc biệt",
};

export const SERVICE_LABELS: Readonly<Record<string, string>> = {
  active: "Đang phục vụ", paused: "Tạm nghỉ", inactive: "Đã nghỉ",
};

export const CAPACITY_LABELS: Readonly<Record<string, string>> = {
  representative: "Giáo lý viên đại diện", member: "Giáo lý viên lớp", trainee: "Dự trưởng phụ tá",
};

/** Nhãn ngắn cho thẻ ở danh sách — chỗ hẹp, không đủ cho "Giáo lý viên đại diện". */
export const CAPACITY_SHORT_LABELS: Readonly<Record<string, string>> = {
  representative: "Đại diện", member: "Giáo lý viên", trainee: "Dự trưởng",
};

export function formationLabel(value: string): string {
  return FORMATION_LABELS[value] ?? value;
}

export function serviceLabel(value: string): string {
  return SERVICE_LABELS[value] ?? value;
}

/**
 * D-108 — bộ lọc trạng thái phục vụ.
 *
 * `serving` là MẶC ĐỊNH và gồm cả "Tạm nghỉ": người nghỉ sinh con hay đi học xa
 * vẫn phải nằm trong kế hoạch năm học, ẩn họ đi là làm hỏng chính việc mà bộ lọc
 * này sinh ra để giúp. Chỉ "Đã nghỉ" mới bị ẩn mặc định.
 */
export const SERVICE_FILTERS = ["serving", "active", "paused", "inactive", "all"] as const;
export type ServiceFilter = (typeof SERVICE_FILTERS)[number];
export const DEFAULT_SERVICE_FILTER: ServiceFilter = "serving";

export const SERVICE_FILTER_LABELS: Readonly<Record<ServiceFilter, string>> = {
  serving: "Đang phục vụ và tạm nghỉ",
  active: "Chỉ đang phục vụ",
  paused: "Chỉ tạm nghỉ",
  inactive: "Chỉ đã nghỉ",
  all: "Tất cả",
};

export function parseServiceFilter(value: string | undefined): ServiceFilter {
  return (SERVICE_FILTERS as readonly string[]).includes(value ?? "")
    ? (value as ServiceFilter)
    : DEFAULT_SERVICE_FILTER;
}

/** `all` mọi lớp · `none` chỉ người chưa phân lớp · còn lại là id một lớp. */
export type ClassFilter = "all" | "none" | (string & {});

export interface StaffDirectoryItem {
  id: string;
  staffCode: string;
  title: string;
  saintName: string | null;
  fullName: string;
  phone: string;
  formationLevel: string;
  serviceStatus: string;
  assignment: null | { id: string; capacity: string; classId: string; className: string };
}

export interface StaffDirectoryCriteria {
  search: string;
  classId: ClassFilter;
  service: ServiceFilter;
}

function matchesService(status: string, filter: ServiceFilter): boolean {
  if (filter === "all") return true;
  if (filter === "serving") return status === "active" || status === "paused";
  return status === filter;
}

function matchesClass(item: StaffDirectoryItem, filter: ClassFilter): boolean {
  if (filter === "all") return true;
  if (filter === "none") return item.assignment === null;
  return item.assignment?.classId === filter;
}

function matchesSearch(item: StaffDirectoryItem, needle: string): boolean {
  if (!needle) return true;
  const haystack = foldVietnamese(
    `${item.fullName} ${item.saintName ?? ""} ${item.staffCode} ${item.phone}`,
  );
  return haystack.includes(needle);
}

export interface StaffSelection<T> {
  /** Đã lọc đủ ba tiêu chí, chưa cắt trang. */
  matched: T[];
  /**
   * D-108 — số người bị BỘ LỌC TRẠNG THÁI ẩn đi, tính sau khi đã áp tìm kiếm và
   * lọc lớp. Phải hiện con số này lên màn hình: một danh sách tự ẩn bớt người mà
   * không nói gì là một danh sách khiến người dùng tưởng hồ sơ đã biến mất.
   */
  hiddenByService: number;
}

export function selectStaff<T extends StaffDirectoryItem>(
  items: readonly T[],
  criteria: StaffDirectoryCriteria,
): StaffSelection<T> {
  const needle = foldVietnamese(criteria.search);
  const scoped = items.filter(
    (item) => matchesClass(item, criteria.classId) && matchesSearch(item, needle),
  );
  const matched = scoped.filter((item) => matchesService(item.serviceStatus, criteria.service));
  return { matched, hiddenByService: scoped.length - matched.length };
}

export interface StaffPage<T> {
  items: T[];
  page: number;
  pageCount: number;
  total: number;
}

export function paginateStaff<T>(items: readonly T[], page: number): StaffPage<T> {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / STAFF_PAGE_SIZE));
  const safePage = Math.min(Math.max(1, Number.isFinite(page) ? Math.trunc(page) : 1), pageCount);
  const start = (safePage - 1) * STAFF_PAGE_SIZE;
  return { items: items.slice(start, start + STAFF_PAGE_SIZE) as T[], page: safePage, pageCount, total };
}

export function parsePage(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

/** Họ tên đầy đủ có danh xưng và tên thánh — dùng chung cho danh sách và trang chi tiết. */
export function staffDisplayName(item: {
  title: string;
  saintName: string | null;
  fullName: string;
}): string {
  return [TITLE_LABELS[item.title] ?? "", item.saintName ?? "", item.fullName]
    .filter((part) => part !== "")
    .join(" ")
    .trim();
}

/**
 * D-110 — ba mức hiển thị tình trạng tài khoản trên danh sách (chủ dự án chốt
 * 2026-07-24).
 *
 *   · `full`     Super Admin: thấy TÊN ĐĂNG NHẬP + cảnh báo "chưa gán vai trò"
 *   · `warning`  vai trò quản trị xứ đoàn khác: CHỈ cảnh báo, không thấy tên
 *                đăng nhập của người khác
 *   · `basic`    còn lại (Trưởng ngành, GLV cùng lớp): chỉ "Đã có / Chưa có"
 *
 * Cảnh báo "⚠ Chưa gán vai trò" là trạng thái zombie của 5W-06: tài khoản đăng
 * nhập được nhưng không mang vai trò nào ⇒ vào hệ thống rồi không thấy lớp nào.
 * Trước M04-B không màn hình nào nói ra điều đó.
 */
export type AccountVisibility = "full" | "warning" | "basic";

export interface StaffAccountInfo {
  hasAccount: boolean;
  /** Chỉ có ở mức `full`. */
  username: string | null;
  /** Chỉ đáng tin ở mức `full`/`warning`; mức `basic` không đọc được vai trò. */
  hasActiveRole: boolean | null;
}

export interface StaffAccountBadge {
  text: string;
  tone: "success" | "warning" | "muted";
}

export function staffAccountBadge(
  info: StaffAccountInfo,
  visibility: AccountVisibility,
): StaffAccountBadge {
  if (!info.hasAccount) return { text: "Chưa có tài khoản", tone: "muted" };
  if (visibility !== "basic" && info.hasActiveRole === false) {
    return { text: "⚠ Chưa gán vai trò", tone: "warning" };
  }
  if (visibility === "full" && info.username) {
    return { text: `Đã có ${info.username}`, tone: "success" };
  }
  return { text: "Đã có tài khoản", tone: "success" };
}
