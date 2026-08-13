import { foldVietnamese } from "@/lib/text/fold-vietnamese";
import { assignableRolesForActor, STAFF_PROFILE_ROLES, type AppRole } from "@/lib/permissions/roles";
import type { AccountSummary } from "./server/queries";

/**
 * Lọc và phân trang danh sách tài khoản — TB-06 (F09).
 *
 * Hàm THUẦN, không "use client" và chỉ `import type` từ module server-only nên
 * chạy được cả trong panel (client) lẫn unit test. Tách ra khỏi component để
 * kiểm được đúng bất biến lọc mà không phải giả lập Server Action.
 */

export const ACCOUNTS_PAGE_SIZE = 8;

export type AccountRoleFilter = "all" | AppRole;
export type AccountStatusFilter = "all" | "active" | "disabled";

export interface AccountDirectoryCriteria {
  search: string;
  role: AccountRoleFilter;
  status: AccountStatusFilter;
}

/**
 * M04-B gom phép bỏ dấu về `@/lib/text/fold-vietnamese` — `/staff` cần đúng luật
 * so khớp này cho cả tìm kiếm lẫn dò trùng hồ sơ, và hai bản sao của một luật
 * chuẩn hóa chữ là hai chỗ để lệch nhau.
 */
const foldText = foldVietnamese;

export function filterAccounts(
  accounts: readonly AccountSummary[],
  criteria: AccountDirectoryCriteria,
): AccountSummary[] {
  const needle = foldText(criteria.search);
  return accounts.filter((account) => {
    if (criteria.role !== "all" && account.role !== criteria.role) return false;
    if (criteria.status !== "all" && account.status !== criteria.status) return false;
    if (!needle) return true;
    const haystack = `${foldText(account.username)} ${foldText(account.displayName)}`;
    return haystack.includes(needle);
  });
}

/**
 * Vai trò còn cấp được tại `/admin` — D-111 (M04-C).
 *
 * `/admin` thu hẹp về **tra cứu + xử lý ngoại lệ**: chỉ tài khoản của người
 * KHÔNG có hồ sơ Giáo lý viên (Cha sở · Cha phó · Phụ huynh · Thiếu nhi). Mọi vai
 * trò gắn hồ sơ nhân sự cấp tại `/staff/[staffId]`, nơi trang biết sẵn hồ sơ,
 * phân công và lớp — hai cửa cho cùng một việc là hai chỗ để lệch nhau.
 *
 * Lọc luôn qua trần vai trò D-102 nên `super_admin` không bao giờ có mặt: ô chọn
 * cũ liệt kê đủ 14 vai trò trong khi máy chủ **luôn** từ chối, tức mời người dùng
 * làm một việc chắc chắn hỏng.
 */
export function adminProvisionableRoles(actorRole: AppRole | null): AppRole[] {
  return assignableRolesForActor(actorRole).filter((role) => !STAFF_PROFILE_ROLES.includes(role));
}

export interface AccountPage {
  items: AccountSummary[];
  page: number;
  pageCount: number;
  total: number;
}

export function paginateAccounts(accounts: readonly AccountSummary[], page: number): AccountPage {
  const total = accounts.length;
  const pageCount = Math.max(1, Math.ceil(total / ACCOUNTS_PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * ACCOUNTS_PAGE_SIZE;
  return {
    items: accounts.slice(start, start + ACCOUNTS_PAGE_SIZE) as AccountSummary[],
    page: safePage,
    pageCount,
    total,
  };
}
