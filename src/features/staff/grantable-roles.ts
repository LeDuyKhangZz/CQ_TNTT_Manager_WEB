import {
  assignableRolesForActor,
  CLASS_ROLES,
  STAFF_PROFILE_ROLES,
  type AppRole,
} from "@/lib/permissions/roles";

/**
 * Vai trò cấp/đổi được tại `/staff/[staffId]` — hàm THUẦN để kiểm bằng unit test
 * thường, không phải dựng Supabase.
 *
 * D-111 (M04-C): sau khi `/admin` thu hẹp về tra cứu/ngoại lệ, trang hồ sơ là nơi
 * DUY NHẤT cấp tài khoản cho một hồ sơ Giáo lý viên. Bản M01-B chỉ cho chọn đúng
 * vai trò lớp khi hồ sơ đang có phân công, nên người vừa đứng lớp vừa làm Trưởng
 * ngành sẽ **không cấp được tài khoản ở đâu cả**. Nay danh sách gồm:
 *
 * - vai trò lớp suy từ `capacity` của phân công đang hoạt động (nếu có) — đứng
 *   đầu và là lựa chọn gợi ý, vì đó là trường hợp áp đảo;
 * - các vai trò nhân sự **không thuộc lớp** (toàn xứ đoàn + ngành).
 *
 * Vai trò lớp KHÔNG bao giờ xuất hiện khi hồ sơ chưa có phân công: trigger
 * `validate_role_assignment_scope` ném `ACTIVE_CLASS_ASSIGNMENT_REQUIRED`, tức ô
 * chọn sẽ mời người dùng làm một việc chắc chắn hỏng.
 *
 * Mọi nhánh đều đi qua trần vai trò D-102 (`assignableRolesForActor`).
 */

/** Capacity của một phân công lớp ⇒ vai trò lớp tương ứng (BR-A17). */
export function classRoleForCapacity(capacity: string | null): AppRole | null {
  if (capacity === "representative") return "class_representative";
  if (capacity === "member") return "class_teacher";
  if (capacity === "trainee") return "trainee_assistant";
  return null;
}

export interface GrantableRoles {
  /** Danh sách hiện trong ô chọn, giữ đúng thứ tự hiển thị. */
  roles: AppRole[];
  /** Vai trò chọn sẵn, hoặc `null` khi không có lựa chọn nào hiển nhiên đúng. */
  recommended: AppRole | null;
}

export function grantableRolesForStaff(
  actorRole: AppRole | null,
  activeCapacity: string | null,
): GrantableRoles {
  const ceiling = new Set(assignableRolesForActor(actorRole));
  const classRole = classRoleForCapacity(activeCapacity);
  const recommended = classRole && ceiling.has(classRole) ? classRole : null;

  const nonClassRoles = STAFF_PROFILE_ROLES.filter(
    (role) => !CLASS_ROLES.includes(role) && ceiling.has(role),
  );
  const roles = recommended ? [recommended, ...nonClassRoles] : nonClassRoles;

  return {
    roles,
    // Một lựa chọn duy nhất thì chọn sẵn luôn — không có gì để cân nhắc.
    recommended: recommended ?? (roles.length === 1 ? roles[0] : null),
  };
}
