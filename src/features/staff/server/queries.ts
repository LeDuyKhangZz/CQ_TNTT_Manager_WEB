import "server-only";

import { requireRouteAccess } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import {
  canManageAccounts,
  canReadStaffSensitive,
  staffAccountVisibility,
} from "@/features/auth/permissions";
import {
  isAppRole,
  SECTOR_ROLES,
  type AppRole,
} from "@/lib/permissions/roles";
import { grantableRolesForStaff } from "../grantable-roles";
import {
  paginateStaff,
  selectStaff,
  type AccountVisibility,
  type StaffDirectoryCriteria,
  type StaffDirectoryItem,
} from "../staff-directory";

export interface StaffListItem extends StaffDirectoryItem {
  hasAccount: boolean;
  /** Chỉ có ở mức `full` (Super Admin) — D-110. */
  username: string | null;
  /** `null` ở mức `basic`: người xem không đọc được `role_assignments` của người khác. */
  hasActiveRole: boolean | null;
}

/**
 * Dữ liệu cho `/staff` — TB-M04-04 + D-108 + D-110.
 *
 * Tải hết hồ sơ người xem được phép đọc rồi lọc/phân trang bằng hàm thuần
 * (`staff-directory.ts`) — xem ghi chú "vì sao lọc trong bộ nhớ" ở đầu file đó.
 */
export async function getStaffPageData(criteria: StaffDirectoryCriteria, page: number) {
  const context = await requireRouteAccess("/staff");
  const supabase = await createClient();
  const visibility: AccountVisibility = staffAccountVisibility(context.role);

  const [staffResult, yearResult] = await Promise.all([
    supabase
      .from("staff_profiles")
      .select(
        "id, staff_code, title, saint_name, full_name, phone, formation_level, service_status, profile_id, class_staff_assignments(id, capacity, starts_on, is_active, class_id, classes(display_name))",
      )
      .order("full_name"),
    supabase.from("academic_years").select("id, name").eq("status", "current").maybeSingle(),
  ]);

  // Ô chọn lớp CHỈ chứa lớp của năm học hiện hành (TB-M04-04). Ô gộp mọi năm là
  // cách chắc chắn để ai đó phân công vào một lớp của năm đã qua rồi không hiểu
  // vì sao người ấy vẫn "chưa có lớp" trên mọi màn hình khác.
  const classesResult = await supabase
    .from("classes")
    .select("id, display_name, academic_year_id")
    .eq("status", "active")
    .order("display_name");

  const rows = (staffResult.data ?? []) as unknown as Array<{
    id: string; staff_code: string; title: string; saint_name: string | null; full_name: string;
    phone: string; formation_level: string; service_status: string; profile_id: string | null;
    class_staff_assignments: Array<{
      id: string; capacity: string; starts_on: string; is_active: boolean; class_id: string;
      classes: { display_name: string } | null;
    }>;
  }>;

  // D-110 — khối tài khoản nạp theo MỨC người xem, không phải giấu trên giao
  // diện. Mức `basic` không chạy truy vấn nào, nên không có gì để rò.
  const profileIds = rows.map((row) => row.profile_id).filter((id): id is string => Boolean(id));
  const usernameById = new Map<string, string>();
  const roleByProfileId = new Set<string>();
  if (visibility !== "basic" && profileIds.length > 0) {
    const [rolesResult, profilesResult] = await Promise.all([
      supabase.from("role_assignments").select("profile_id").eq("is_active", true).in("profile_id", profileIds),
      visibility === "full"
        ? supabase.from("profiles").select("id, username").in("id", profileIds)
        : Promise.resolve({ data: [] as Array<{ id: string; username: string }> }),
    ]);
    for (const row of rolesResult.data ?? []) {
      if (row.profile_id) roleByProfileId.add(row.profile_id);
    }
    for (const row of profilesResult.data ?? []) usernameById.set(row.id, row.username);
  }

  const all = rows.map((row): StaffListItem => {
    const assignment = row.class_staff_assignments.find((item) => item.is_active);
    return {
      id: row.id,
      staffCode: row.staff_code,
      title: row.title,
      saintName: row.saint_name,
      fullName: row.full_name,
      phone: row.phone,
      formationLevel: row.formation_level,
      serviceStatus: row.service_status,
      assignment: assignment
        ? {
            id: assignment.id,
            capacity: assignment.capacity,
            classId: assignment.class_id,
            className: assignment.classes?.display_name ?? "Lớp",
          }
        : null,
      hasAccount: Boolean(row.profile_id),
      username: row.profile_id ? (usernameById.get(row.profile_id) ?? null) : null,
      hasActiveRole:
        visibility === "basic" || !row.profile_id ? null : roleByProfileId.has(row.profile_id),
    };
  });

  const { matched, hiddenByService } = selectStaff(all, criteria);
  const pageResult = paginateStaff(matched, page);
  const currentYearId = yearResult.data?.id ?? null;

  return {
    context,
    visibility,
    /** Trang hiện tại của danh sách — chỉ để hiển thị. */
    staff: pageResult.items,
    page: pageResult.page,
    pageCount: pageResult.pageCount,
    total: pageResult.total,
    hiddenByService,
    /** Tổng số hồ sơ đọc được, trước mọi bộ lọc — cho câu "đang xem N trong M". */
    totalUnfiltered: all.length,
    /**
     * Ô chọn "Nhân sự" của form phân công phải liệt kê TOÀN BỘ danh sách, không
     * phải trang đang xem: người ta lọc để tìm rồi phân công cho một người khác
     * là chuyện thường, và một ô chọn co lại theo bộ lọc là một ô chọn nói dối.
     */
    assignableStaff: all,
    classes: ((classesResult.data ?? []) as Array<{ id: string; display_name: string; academic_year_id: string }>)
      .filter((item) => !currentYearId || item.academic_year_id === currentYearId)
      .map((item) => ({ id: item.id, name: item.display_name })),
  };
}

export interface StaffDetailAssignment {
  id: string;
  classId: string;
  className: string;
  capacity: string;
  startsOn: string;
  endsOn: string | null;
  isActive: boolean;
  academicYearId: string | null;
}

export interface StaffDetail {
  id: string;
  staffCode: string;
  title: string;
  saintName: string | null;
  fullName: string;
  formationLevel: string;
  phone: string;
  serviceStatus: string;
  /** Chỉ có khi người xem đạt `can_global_read` (AC-01.7) — nếu không thì null. */
  sensitive: null | { dateOfBirth: string | null; address: string | null; email: string | null };
  /**
   * Hồ sơ có gắn tài khoản đăng nhập hay không. KHÔNG suy được từ `account` —
   * khối đó chỉ nạp cho `can_global_read` (D-104), nên người xem là Trưởng ngành
   * luôn thấy `account === null` dù người kia có tài khoản. Suy nhầm từ đó khiến
   * hộp thoại "Chuyển lớp" nói với Trưởng ngành rằng *"hồ sơ này chưa có tài
   * khoản nên không có vai trò nào bị đổi"* — sai, và sai đúng ở câu mà người ta
   * đọc để quyết định có bấm hay không. Bản thân sự TỒN TẠI của tài khoản không
   * nằm trong danh sách nhạy cảm của D-104 (ngày sinh · địa chỉ · email · trạng
   * thái tài khoản) và `/staff` đã hiện nó cho mọi người đọc được dòng.
   */
  hasAccount: boolean;
  /** Chỉ có khi người xem đạt `can_global_read` (trạng thái tài khoản là nhạy cảm). */
  account:
    | null
    | {
        profileId: string;
        username: string;
        accountStatus: string;
        mustChangePassword: boolean;
        role: AppRole | null;
        roleScopeLabel: string | null;
      };
  activeAssignment: StaffDetailAssignment | null;
  assignmentHistory: StaffDetailAssignment[];
}

export interface StaffDetailData {
  context: Awaited<ReturnType<typeof requireRouteAccess>>;
  staff: StaffDetail;
  canWrite: boolean;
  /**
   * Được thấy nút "Chuyển lớp" (D-105). Rộng hơn `canWrite` đúng hai vai trò
   * ngành. Chỉ quyết định việc HIỆN NÚT — ranh giới thật ("cả lớp cũ lẫn lớp mới
   * đều thuộc ngành mình") do `app.can_manage_class` trong RPC chốt, nên một
   * Trưởng ngành bấm nút cho người ngoài ngành vẫn nhận `42501`.
   */
  canTransfer: boolean;
  canManageAccount: boolean;
  /**
   * D-106/D-109 — được thấy khối "Xóa hồ sơ". Trùng đúng `canWrite` (4 vai trò
   * ghi toàn xứ đoàn = `app.can_global_write()`).
   */
  canDelete: boolean;
  /**
   * Các lý do khiến hồ sơ này KHÔNG xóa được, bằng tiếng Việt. Mảng rỗng = xóa
   * được. `null` khi người xem không có quyền xóa (không hỏi DB).
   *
   * Con số này do DB đếm (`staff_profile_delete_blockers`, `security definer`)
   * chứ KHÔNG do trang tự đếm: đếm ở đây là đếm dưới RLS của người xem, và một
   * phiếu mượn thiết bị mà người xem không được đọc sẽ biến mất khỏi phép đếm ⇒
   * màn hình hứa "xóa được" trước một RPC chắc chắn từ chối.
   */
  deleteBlockers: string[] | null;
  /** Vai trò người xem được cấp/đổi cho hồ sơ này, đã lọc theo trần + phân công. */
  grantableRoles: AppRole[];
  /** Vai trò chọn sẵn trong ô chọn (thường là vai trò lớp của phân công đang hoạt động). */
  recommendedRole: AppRole | null;
  currentAcademicYear: { id: string; name: string } | null;
  sectors: Array<{ id: string; name: string }>;
  classes: Array<{ id: string; name: string }>;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STAFF_WRITE_ROLES: readonly AppRole[] = ["super_admin", "group_leader", "deputy_group_leader", "secretary"];
/** D-105 — Trưởng/Phó ngành chuyển lớp được trong ngành mình (DB chốt phạm vi). */
const STAFF_TRANSFER_ROLES: readonly AppRole[] = [...STAFF_WRITE_ROLES, "sector_leader", "sector_deputy"];

/**
 * Chi tiết một hồ sơ GLV cho `/staff/[staffId]` (TB-01). Trả `null` nếu id không
 * phải UUID hoặc RLS không cho người xem đọc dòng đó ⇒ trang gọi `notFound()`
 * (không để 500 — S12). Trường nhạy cảm và khối tài khoản chỉ được nạp khi người
 * xem đạt `can_global_read` (AC-01.7): không select vào payload thì không rò được.
 */
export async function getStaffDetail(staffIdInput: string): Promise<StaffDetailData | null> {
  const context = await requireRouteAccess("/staff");
  if (!UUID_RE.test(staffIdInput)) return null;

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("staff_profiles")
    .select(
      "id, staff_code, title, saint_name, full_name, formation_level, phone, service_status, date_of_birth, address, email, profile_id, class_staff_assignments(id, class_id, capacity, starts_on, ends_on, is_active, classes(display_name, academic_year_id))",
    )
    .eq("id", staffIdInput)
    .maybeSingle();
  if (!row) return null;

  const canSensitive = canReadStaffSensitive(context.role);
  const canManageAccount = canManageAccounts(context.role);
  const canWrite = context.role !== null && STAFF_WRITE_ROLES.includes(context.role);
  const canTransfer = context.role !== null && STAFF_TRANSFER_ROLES.includes(context.role);

  const assignmentsRaw = (row.class_staff_assignments ?? []) as Array<{
    id: string; class_id: string; capacity: string; starts_on: string; ends_on: string | null; is_active: boolean;
    classes: { display_name: string; academic_year_id: string } | null;
  }>;
  const assignments: StaffDetailAssignment[] = assignmentsRaw
    .map((item) => ({
      id: item.id,
      classId: item.class_id,
      className: item.classes?.display_name ?? "Lớp",
      capacity: item.capacity,
      startsOn: item.starts_on,
      endsOn: item.ends_on,
      isActive: item.is_active,
      academicYearId: item.classes?.academic_year_id ?? null,
    }))
    .sort((a, b) => b.startsOn.localeCompare(a.startsOn));
  const activeAssignment = assignments.find((item) => item.isActive) ?? null;

  // Khối tài khoản — chỉ nạp khi được đọc dữ liệu nhạy cảm.
  let account: StaffDetail["account"] = null;
  if (canSensitive && row.profile_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, username, account_status, must_change_password, role_assignments(role, is_active, sector_id, class_id, sectors(name), classes(display_name))")
      .eq("id", row.profile_id)
      .maybeSingle();
    if (profile) {
      const activeRole = ((profile.role_assignments ?? []) as Array<{
        role: string; is_active: boolean; sector_id: string | null; class_id: string | null;
        sectors: { name: string } | null; classes: { display_name: string } | null;
      }>).find((item) => item.is_active);
      const role = isAppRole(activeRole?.role) ? activeRole.role : null;
      const scopeLabel = activeRole?.classes?.display_name ?? activeRole?.sectors?.name ?? null;
      account = {
        profileId: profile.id,
        username: profile.username,
        accountStatus: profile.account_status,
        mustChangePassword: profile.must_change_password,
        role,
        roleScopeLabel: scopeLabel,
      };
    }
  }

  // Vai trò cấp/đổi được (TB-01.3 + D-111): vai trò lớp theo capacity của phân
  // công đang hoạt động, CỘNG các vai trò toàn xứ đoàn/ngành. Luật ở hàm thuần
  // `grantableRolesForStaff` (có unit test), đã lọc qua trần vai trò D-102.
  const grantable = canManageAccount
    ? grantableRolesForStaff(context.role, activeAssignment?.capacity ?? null)
    : { roles: [] as AppRole[], recommended: null };
  const grantableRoles = grantable.roles;

  const [yearResult, sectorsResult, classesResult, blockersResult] = await Promise.all([
    supabase.from("academic_years").select("id, name").eq("status", "current").maybeSingle(),
    grantableRoles.some((role) => SECTOR_ROLES.includes(role))
      ? supabase.from("sectors").select("id, name").eq("is_active", true).order("sort_order")
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
    canWrite || canTransfer
      ? supabase.from("classes").select("id, display_name, academic_year_id").eq("status", "active").order("display_name")
      : Promise.resolve({ data: [] as Array<{ id: string; display_name: string; academic_year_id: string }> }),
    canWrite
      ? supabase.rpc("staff_profile_delete_blockers", { p_staff_id: staffIdInput })
      : Promise.resolve({ data: null }),
  ]);

  const staff: StaffDetail = {
    id: row.id,
    staffCode: row.staff_code,
    title: row.title,
    saintName: row.saint_name,
    fullName: row.full_name,
    formationLevel: row.formation_level,
    phone: row.phone,
    serviceStatus: row.service_status,
    sensitive: canSensitive
      ? { dateOfBirth: row.date_of_birth, address: row.address, email: row.email }
      : null,
    hasAccount: Boolean(row.profile_id),
    account,
    activeAssignment,
    assignmentHistory: assignments,
  };

  return {
    context,
    staff,
    canWrite,
    canTransfer,
    canManageAccount,
    canDelete: canWrite,
    deleteBlockers: canWrite ? ((blockersResult.data as string[] | null) ?? []) : null,
    grantableRoles,
    recommendedRole: grantable.recommended,
    currentAcademicYear: yearResult.data ? { id: yearResult.data.id, name: yearResult.data.name } : null,
    sectors: (sectorsResult.data ?? []) as Array<{ id: string; name: string }>,
    // Chỉ lớp của NĂM HỌC HIỆN HÀNH (TB-M04-04). Ô chọn gộp mọi năm là cách chắc
    // chắn để ai đó phân công vào một lớp của năm đã qua rồi không hiểu vì sao
    // người ấy vẫn "chưa có lớp" trên mọi màn hình khác. Lọc trong bộ nhớ vì
    // truy vấn năm học chạy song song, chưa có kết quả lúc dựng truy vấn lớp.
    classes: ((classesResult.data ?? []) as Array<{ id: string; display_name: string; academic_year_id: string }>)
      .filter((item) => !yearResult.data || item.academic_year_id === yearResult.data.id)
      .map((item) => ({ id: item.id, name: item.display_name })),
  };
}
