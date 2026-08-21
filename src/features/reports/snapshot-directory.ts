import { REPORT_SCOPES, REPORT_TYPES, type ReportScope, type ReportType } from "./filters";
import { UUID_PATTERN } from "@/lib/validation/uuid";

/**
 * TB-06 — kho bản chốt phải **khai thác được**, không chỉ tồn tại.
 *
 * 🔴 `03_AUDIT_RESULTS` §4.6 đo đúng khoảng cách: tầng dữ liệu làm rất chắc
 * (bất biến · checksum · có `scope_type`/`scope_id`/`generated_by`), còn giao
 * diện thì `limit(20)` không phân trang, không lọc, và tiêu đề chỉ gồm loại +
 * khoảng ngày. Với chính sách lưu **5 năm** — 5 × (tuần/tháng/năm × 2 loại × 19
 * lớp) ⇒ hàng nghìn bản — cái danh sách ấy trở thành một kho không có cửa.
 *
 * Bộ lọc nằm trên URL (không phải state): người dùng phải chép được đường dẫn
 * trang 3, mở tab mới và bấm Back (`09` §11).
 */
export const SNAPSHOT_PAGE_SIZE = 20;

export interface SnapshotCriteria {
  /** `null` = mọi năm học. */
  academicYearId: string | null;
  reportType: ReportType | null;
  scopeType: ReportScope | null;
  /** Đếm từ 1. */
  page: number;
}

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = params[key];
  const first = Array.isArray(value) ? value[0] : value;
  return first === undefined || first === "" || first === "all" ? undefined : first;
}

/**
 * Tham số hỏng ở đây **không** cần một dải cảnh báo như `/reports`: bộ lọc kho
 * chỉ thu hẹp một danh sách mà RLS đã giới hạn sẵn, nên bỏ qua một giá trị rác
 * là **nới danh sách về mặc định "tất cả"** — vẫn nằm trọn trong phạm vi đọc của
 * người dùng. Khác hẳn `/reports`, nơi `scopeType` hỏng từng âm thầm nhảy từ
 * "lớp mình" sang "toàn xứ đoàn".
 */
export function parseSnapshotCriteria(
  params: Record<string, string | string[] | undefined>,
): SnapshotCriteria {
  const rawYear = readParam(params, "year");
  const rawType = readParam(params, "reportType");
  const rawScope = readParam(params, "scopeType");
  const rawPage = Number.parseInt(readParam(params, "page") ?? "1", 10);

  return {
    academicYearId: rawYear && UUID_PATTERN.test(rawYear) ? rawYear : null,
    reportType: rawType && (REPORT_TYPES as readonly string[]).includes(rawType)
      ? rawType as ReportType
      : null,
    scopeType: rawScope && (REPORT_SCOPES as readonly string[]).includes(rawScope)
      ? rawScope as ReportScope
      : null,
    page: Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1,
  };
}

export function snapshotListHref(criteria: SnapshotCriteria, page = criteria.page): string {
  const params = new URLSearchParams();
  if (criteria.academicYearId) params.set("year", criteria.academicYearId);
  if (criteria.reportType) params.set("reportType", criteria.reportType);
  if (criteria.scopeType) params.set("scopeType", criteria.scopeType);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/reports/snapshots?${query}` : "/reports/snapshots";
}

export function hasActiveSnapshotFilter(criteria: SnapshotCriteria): boolean {
  return criteria.academicYearId !== null
    || criteria.reportType !== null
    || criteria.scopeType !== null;
}

/** Khoảng dòng cho `range()` của Supabase, suy từ số trang. */
export function snapshotPageRange(page: number): { from: number; to: number } {
  const from = (Math.max(page, 1) - 1) * SNAPSHOT_PAGE_SIZE;
  return { from, to: from + SNAPSHOT_PAGE_SIZE - 1 };
}
