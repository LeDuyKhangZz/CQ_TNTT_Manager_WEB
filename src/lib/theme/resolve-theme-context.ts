import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAcademicYearRow } from "@/lib/academic-year/current-year";
import { getAuthContext } from "@/lib/auth/session";
import { GLOBAL_ROLES, SECTOR_ROLES } from "@/lib/permissions/roles";
import {
  decideThemeContext,
  type BranchRef,
  type ChildFact,
  type ClassFact,
  type ScopeFacts,
  type StaffFacts,
  type ViewerFacts,
} from "./decide-theme-context";
import { THEME_CHILD_COOKIE } from "./child-selection";
import { isEffectiveAssignment, isEffectiveEnrollment, todayInVietnam } from "./effective";
import { themeKeyFromSectorCode } from "./sector-palette";
import type { ResolveThemeInput, ThemeContext } from "./types";

/**
 * Tầng truy vấn của theme động — docs/.../10_APPROVED_THEME_RULES.md §5–§7.
 *
 * Trang khai báo `scope`; hàm này tra dữ liệu rồi giao QUYẾT ĐỊNH cho
 * `decideThemeContext` (hàm thuần, có 46 unit test). Ở đây KHÔNG có luật màu.
 *
 * 🔴 `React.cache()` ⇒ 1 truy vấn/request, không có cache sống lâu hơn request.
 * Không đưa ngành vào session/JWT/local storage (10 §7).
 */

/** Chỉ lưu LỰA CHỌN ngữ cảnh (id con), không bao giờ lưu màu. */
export { THEME_CHILD_COOKIE } from "./child-selection";

type SectorRow = { id: string; code: string; name: string };
type GradeLevelJoin = { sectors: SectorRow | SectorRow[] | null } | null;

function firstOrNull<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function toBranch(sector: SectorRow | null): BranchRef | null {
  if (!sector) return null;
  return {
    id: sector.id,
    name: sector.name,
    themeKey: themeKeyFromSectorCode(sector.code),
  };
}

/** `classes` + `grade_levels` + `sectors` — dùng chung cho mọi nhánh. */
const CLASS_SELECT =
  "id, display_name, class_kind, academic_year_id, grade_levels(sectors(id, code, name))";

type ClassRow = {
  id: string;
  display_name: string;
  class_kind: string;
  academic_year_id: string;
  grade_levels: GradeLevelJoin | GradeLevelJoin[];
};

function toClassFact(row: ClassRow | null): ClassFact | null {
  if (!row) return null;
  const gradeLevel = firstOrNull(row.grade_levels as GradeLevelJoin[]);
  return {
    classId: row.id,
    className: row.display_name,
    isTrainee: row.class_kind === "trainee",
    branch: toBranch(firstOrNull(gradeLevel?.sectors)),
  };
}

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function loadClass(
  supabase: Supabase,
  classId: string,
  academicYearId: string,
): Promise<ClassFact | null> {
  const { data } = await supabase
    .from("classes")
    .select(CLASS_SELECT)
    .eq("id", classId)
    .eq("academic_year_id", academicYearId)
    .maybeSingle();
  return toClassFact(data as ClassRow | null);
}

async function loadSector(
  supabase: Supabase,
  sectorId: string,
): Promise<BranchRef | null> {
  const { data } = await supabase
    .from("sectors")
    .select("id, code, name")
    .eq("id", sectorId)
    .eq("is_active", true)
    .maybeSingle();
  return toBranch(data as SectorRow | null);
}

/**
 * Ghi danh đang mở của một em trong năm hiện hành.
 * RLS trả rỗng nếu người gọi không có quyền — đó là chốt chặn cuối (10 §7).
 */
async function loadOpenEnrollment(
  supabase: Supabase,
  studentId: string,
  academicYearId: string,
): Promise<ClassFact | null> {
  const { data } = await supabase
    .from("enrollments")
    .select(`status, enrolled_on, ended_on, classes(${CLASS_SELECT})`)
    .eq("student_id", studentId)
    .eq("academic_year_id", academicYearId)
    .is("ended_on", null)
    .in("status", ["active", "paused"])
    // Tất định: luôn có ORDER BY tường minh (10 §3).
    .order("enrolled_on", { ascending: false })
    .order("id", { ascending: true })
    .limit(1);

  const row = (data ?? [])[0] as
    | { status: string; enrolled_on: string; ended_on: string | null; classes: ClassRow | ClassRow[] | null }
    | undefined;
  if (!row || !isEffectiveEnrollment(row)) return null;
  return toClassFact(firstOrNull(row.classes));
}

async function loadStudentViewer(
  supabase: Supabase,
  profileId: string,
  academicYearId: string,
): Promise<ViewerFacts> {
  const { data: student } = await supabase
    .from("students")
    .select("id, status")
    .eq("profile_id", profileId)
    .maybeSingle();

  // Điều kiện 5 của 10 §4: hồ sơ đã lưu trữ thì không lấy ngành.
  if (!student || student.status === "archived") {
    return { kind: "STUDENT", enrollment: null };
  }

  return {
    kind: "STUDENT",
    enrollment: await loadOpenEnrollment(supabase, student.id, academicYearId),
  };
}

async function loadGuardianViewer(
  supabase: Supabase,
  profileId: string,
  academicYearId: string,
  cookieValue: string | null,
): Promise<ViewerFacts> {
  const { data: guardian } = await supabase
    .from("guardians")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (!guardian) {
    return { kind: "GUARDIAN", children: [], selectedChildIdFromCookie: cookieValue };
  }

  const { data: students } = await supabase
    .from("students")
    .select("id, full_name")
    .eq("guardian_id", guardian.id)
    .neq("status", "archived")
    // Tất định (10 §3).
    .order("full_name", { ascending: true })
    .order("id", { ascending: true });

  const children: ChildFact[] = await Promise.all(
    (students ?? []).map(async (student) => ({
      studentId: student.id,
      studentName: student.full_name,
      enrollment: await loadOpenEnrollment(supabase, student.id, academicYearId),
    })),
  );

  return { kind: "GUARDIAN", children, selectedChildIdFromCookie: cookieValue };
}

async function loadStaffViewer(
  supabase: Supabase,
  profileId: string,
  academicYearId: string,
): Promise<ViewerFacts> {
  const today = todayInVietnam();

  // 🔴 P3-PERF-001 — BA ĐỢT, không phải năm lượt nối đuôi.
  //
  // Bản cũ `await` liên tiếp năm truy vấn, mà chỉ **hai** ràng buộc thứ tự là
  // có thật: `class_staff_assignments` cần `staff_profiles.id`, còn `classes`
  // và `sectors` cần `role_assignments`. Ba lượt kia chờ nhau **không vì lý do
  // gì**. Ở máy nhà mỗi lượt là 2ms nên không ai thấy; trên Vercel mỗi lượt là
  // một vòng đi–về sang Supabase, và chuỗi ấy là phần lớn cái lag người dùng
  // báo. Vị ngữ, thứ tự sắp xếp và mọi phép lọc dưới đây giữ **nguyên văn** —
  // đây là phép xếp lại lịch chạy, không phải phép đổi truy vấn.
  const [{ data: roleRow }, { data: staffProfile }] = await Promise.all([
    supabase
      .from("role_assignments")
      .select("role, sector_id, class_id, is_active, starts_on, ends_on")
      .eq("profile_id", profileId)
      .eq("is_active", true)
      .is("ends_on", null)
      .lte("starts_on", today)
      .maybeSingle(),
    supabase
      .from("staff_profiles")
      .select("id, service_status")
      .eq("profile_id", profileId)
      .maybeSingle(),
  ]);

  const role = roleRow && isEffectiveAssignment(roleRow) ? roleRow : null;

  // Điều kiện 5 của 10 §4. `staff_service_status` không có 'archived';
  // 'inactive' là trạng thái nghỉ hẳn. 'paused' vẫn giữ ngành — cùng lý lẽ với
  // ghi danh `paused`: người đó vẫn thuộc lớp, chỉ tạm nghỉ.
  const loadClassAssignment = async (): Promise<ClassFact | null> => {
    if (!staffProfile || staffProfile.service_status === "inactive") return null;
    const { data: assignments } = await supabase
      .from("class_staff_assignments")
      .select(`class_id, is_active, starts_on, ends_on, classes(${CLASS_SELECT})`)
      .eq("staff_profile_id", staffProfile.id)
      .eq("is_active", true)
      .is("ends_on", null)
      .lte("starts_on", today)
      // Tất định: một GLV = một lớp (Q-01), nhưng vẫn ORDER BY tường minh.
      .order("starts_on", { ascending: false })
      .order("id", { ascending: true })
      .limit(1);

    const row = (assignments ?? [])[0] as
      | { is_active: boolean; starts_on: string; ends_on: string | null; classes: ClassRow | ClassRow[] | null }
      | undefined;
    if (!row || !isEffectiveAssignment(row)) return null;
    const klass = toClassFact(firstOrNull(row.classes));
    // Chỉ nhận lớp của năm hiện hành.
    return klass && firstOrNull(row.classes)?.academic_year_id === academicYearId ? klass : null;
  };

  const [classAssignment, roleClass, roleSectorBranch] = await Promise.all([
    loadClassAssignment(),
    role?.class_id ? loadClass(supabase, role.class_id, academicYearId) : null,
    role?.sector_id && SECTOR_ROLES.includes(role.role)
      ? loadSector(supabase, role.sector_id)
      : null,
  ]);

  const staff: StaffFacts = {
    kind: "STAFF",
    roleSectorBranch,
    classAssignment,
    roleClass,
    hasActiveRole: role !== null,
    hasGlobalRole: role !== null && GLOBAL_ROLES.includes(role.role),
  };
  return staff;
}

async function loadScopeFacts(
  supabase: Supabase,
  input: ResolveThemeInput,
  academicYearId: string,
): Promise<ScopeFacts> {
  const { scope } = input;

  switch (scope.kind) {
    case "SYSTEM":
      return { kind: "SYSTEM" };

    case "CROSS_BRANCH":
      return { kind: "CROSS_BRANCH" };

    case "CLASS":
      return { kind: "CLASS", class: await loadClass(supabase, scope.classId, academicYearId) };

    case "SECTOR":
      return { kind: "SECTOR", branch: await loadSector(supabase, scope.sectorId) };

    case "CHILD": {
      const { data: student } = await supabase
        .from("students")
        .select("id, full_name")
        .eq("id", scope.studentId)
        .maybeSingle();

      if (!student) return { kind: "CHILD", child: null };
      return {
        kind: "CHILD",
        child: {
          studentId: student.id,
          studentName: student.full_name,
          enrollment: await loadOpenEnrollment(supabase, student.id, academicYearId),
        },
      };
    }

    case "PERSONAL": {
      const auth = await getAuthContext();
      if (!auth) return { kind: "PERSONAL", viewer: { kind: "NO_PROFILE" } };

      const cookieStore = await cookies();
      const cookieValue = cookieStore.get(THEME_CHILD_COOKIE)?.value ?? null;

      switch (auth.audience) {
        case "student":
          return {
            kind: "PERSONAL",
            viewer: await loadStudentViewer(supabase, auth.profileId, academicYearId),
          };
        case "guardian":
          return {
            kind: "PERSONAL",
            viewer: await loadGuardianViewer(supabase, auth.profileId, academicYearId, cookieValue),
          };
        case "staff":
          return {
            kind: "PERSONAL",
            viewer: await loadStaffViewer(supabase, auth.profileId, academicYearId),
          };
        default:
          return { kind: "PERSONAL", viewer: { kind: "NO_PROFILE" } };
      }
    }
  }
}

const NEUTRAL_WHEN_NO_YEAR = (input: ResolveThemeInput): ThemeContext =>
  decideThemeContext({
    currentAcademicYear: null,
    scope:
      input.scope.kind === "PERSONAL"
        ? { kind: "PERSONAL", viewer: { kind: "NO_PROFILE" } }
        : input.scope.kind === "CLASS"
          ? { kind: "CLASS", class: null }
          : input.scope.kind === "SECTOR"
            ? { kind: "SECTOR", branch: null }
            : input.scope.kind === "CHILD"
              ? { kind: "CHILD", child: null }
              : { kind: input.scope.kind },
    viewingAcademicYearId: input.viewingAcademicYearId,
  });

export const resolveThemeContext = cache(
  async (input: ResolveThemeInput): Promise<ThemeContext> => {
    // Trang đăng nhập và môi trường chưa cấu hình Supabase vẫn phải dựng được.
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NEUTRAL_WHEN_NO_YEAR(input);
    }

    const supabase = await createClient();
    // 🔴 P3-PERF-001 — dùng chung hàm `cache()` với thanh đầu trang thay vì hỏi
    // lại `academic_years` bằng một hàm riêng. Xem `lib/academic-year/current-year.ts`.
    const currentAcademicYear = await getCurrentAcademicYearRow();
    if (!currentAcademicYear) return NEUTRAL_WHEN_NO_YEAR(input);

    return decideThemeContext({
      currentAcademicYear,
      scope: await loadScopeFacts(supabase, input, currentAcademicYear.id),
      viewingAcademicYearId: input.viewingAcademicYearId,
    });
  },
);
