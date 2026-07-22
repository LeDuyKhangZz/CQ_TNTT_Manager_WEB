import "server-only";

import type { AuthContext } from "@/lib/auth/types";
import type { AppRole } from "@/lib/permissions/roles";

/** WF-12: chỉ global-write lập Ban và chức vụ Ban. */
const COMMITTEE_ADMIN_ROLES: readonly AppRole[] = [
  "super_admin",
  "group_leader",
  "deputy_group_leader",
  "secretary",
];

export function canManageCommittees(context: AuthContext): boolean {
  return context.role !== null && COMMITTEE_ADMIN_ROLES.includes(context.role);
}

/**
 * Ẩn nút không phải authorization (AGENTS §5): mọi thao tác vẫn bị RLS chặn ở
 * DB. Hàm này chỉ để UI không mời người dùng bấm vào thứ họ chắc chắn bị từ chối.
 */
export function canWriteCommitteeContent(
  context: AuthContext,
  myPosition: string | null,
): boolean {
  return canManageCommittees(context) || myPosition === "leader" || myPosition === "deputy";
}
