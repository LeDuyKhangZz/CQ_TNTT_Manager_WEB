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
 * - **chức vụ bổ nhiệm** của hồ sơ, nếu sổ Ban Điều Hành có ghi (BDH-2025-002) —
 *   đứng đầu và được chọn sẵn, vì đó là câu trả lời đúng nhất mà hệ thống biết;
 * - vai trò lớp suy từ `capacity` của phân công đang hoạt động (nếu có);
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

/**
 * BDH-2025-002 — vai trò được phép nằm ở `staff_profiles.appointed_role`. Gương
 * soi của ràng buộc `staff_profiles_appointment_shape` trong cơ sở dữ liệu, và
 * nó CỐ Ý hẹp: vai trò lớp không ghi vào sổ bổ nhiệm (đã suy được từ phân công),
 * `super_admin` là trần tuyệt đối, còn Cha sở/Cha phó/phụ huynh/thiếu nhi không
 * phải chức vụ trong Ban Điều Hành.
 *
 * Hàm này canh cả trường hợp dữ liệu cũ hoặc một lượt ghi thẳng vào DB lách được
 * ràng buộc: một vai trò lớp lọt vào đây mà được chọn sẵn thì hộp thoại sẽ gửi
 * lên một vai trò lớp KHÔNG kèm `classId`, và người dùng nhận một lỗi khó hiểu.
 */
export function isAppointableRole(role: AppRole | null | undefined): role is AppRole {
  return (
    role !== null &&
    role !== undefined &&
    STAFF_PROFILE_ROLES.includes(role) &&
    !CLASS_ROLES.includes(role)
  );
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
  /**
   * BDH-2025-002 — `staff_profiles.appointed_role`. Mặc định `null` để mọi chỗ
   * gọi cũ (và bài kiểm cũ) giữ nguyên hành vi: không có sổ bổ nhiệm thì vẫn
   * gợi ý theo phân công lớp như trước.
   */
  appointedRole: AppRole | null = null,
): GrantableRoles {
  const ceiling = new Set(assignableRolesForActor(actorRole));
  const classRole = classRoleForCapacity(activeCapacity);
  const classChoice = classRole && ceiling.has(classRole) ? classRole : null;
  const appointedChoice =
    isAppointableRole(appointedRole) && ceiling.has(appointedRole) ? appointedRole : null;

  const nonClassRoles = STAFF_PROFILE_ROLES.filter(
    (role) => !CLASS_ROLES.includes(role) && ceiling.has(role),
  );

  // Thứ tự hiển thị: chức vụ bổ nhiệm → vai trò lớp → phần còn lại. `Set` giữ
  // thứ tự chèn nên nó vừa khử trùng vừa giữ đúng thứ tự trên.
  const roles = [...new Set([appointedChoice, classChoice, ...nonClassRoles].filter(
    (role): role is AppRole => role !== null,
  ))];

  return {
    roles,
    // Sổ bổ nhiệm thắng phân công lớp: một Xứ đoàn phó vẫn đang đứng lớp là
    // chuyện thường, và chính cái đó làm bản cũ chọn sẵn "Giáo lý viên lớp" cho
    // 14/20 người của Ban Điều Hành 2025-2026 (BDH-2025-002).
    // Một lựa chọn duy nhất thì chọn sẵn luôn — không có gì để cân nhắc.
    recommended: appointedChoice ?? classChoice ?? (roles.length === 1 ? roles[0] : null),
  };
}
