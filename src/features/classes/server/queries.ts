import "server-only";

import { requireRouteAccess } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { canManageEnrollments } from "@/features/enrollments/permissions";
import { isOpenEnrollmentStatus, rosterSummary } from "@/features/enrollments/enrollment-status";
import { foldVietnamese } from "@/lib/text/fold-vietnamese";
import { isAcademicYearWritable } from "@/features/academic-years/year-lifecycle";
import { canWriteClass } from "./permissions";

/** Bao nhiêu em hiện ra trong ô chọn khi chưa gõ gì — BR-M03-N20. */
const AVAILABLE_STUDENT_LIMIT = 50;

function staffLabel(staff: { saint_name: string | null; full_name: string } | null): string {
  if (!staff) return "—";
  return staff.saint_name ? `${staff.saint_name} ${staff.full_name}` : staff.full_name;
}

export interface ClassCard {
  id: string;
  displayName: string;
  sectionCode: string | null;
  classKind: string;
  /** BR-M02-N12 — danh sách lớp phải nhìn ra được lớp không `active`. */
  status: string;
  studentCount: number;
  /**
   * **D-121** — số em đang tạm nghỉ, tách riêng khỏi `studentCount`. Con số "sĩ số"
   * cũ gộp cả hai nên nói sai: em tạm nghỉ thì không sinh hoạt.
   */
  pausedCount: number;
  representative: string;
  staffCount: number;
}

export interface SectorGroup {
  sectorId: string;
  /** `sectors.code` — vào `themeKeyFromSectorCode()` để thẻ lớp mang màu ngành (09 §4.4 #10). */
  code: string;
  name: string;
  shortName: string;
  classes: ClassCard[];
}

interface RawClassRow {
  id: string;
  display_name: string;
  section_code: string | null;
  class_kind: string;
  status: string;
  grade_levels: { sort_order: number; sectors: { id: string; code: string; name: string; short_name: string; sort_order: number } | null } | null;
  class_staff_assignments: Array<{ capacity: string; is_active: boolean; staff_profiles: { full_name: string; saint_name: string | null } | null }>;
  enrollments: Array<{ status: string }>;
}

function toCard(row: RawClassRow): ClassCard {
  const activeStaff = row.class_staff_assignments.filter((item) => item.is_active);
  const representative = activeStaff.find((item) => item.capacity === "representative");
  const summary = rosterSummary(row.enrollments.map((item) => item.status));
  return {
    id: row.id,
    displayName: row.display_name,
    sectionCode: row.section_code,
    classKind: row.class_kind,
    status: row.status,
    studentCount: summary.total,
    pausedCount: summary.paused,
    representative: representative ? staffLabel(representative.staff_profiles) : "Chưa có",
    staffCount: activeStaff.length,
  };
}

export async function getClassesPageData() {
  const context = await requireRouteAccess("/classes");
  const supabase = await createClient();

  const { data: year } = await supabase
    .from("academic_years")
    // `semester_1_end_date` (D-71) để trang biết đã qua mốc học kỳ 1 chưa mà cảnh
    // báo cho lớp Dự trưởng (D-115 — chỉ cảnh báo, không tự đóng lớp).
    .select("id, code, name, semester_1_end_date")
    .eq("status", "current")
    .maybeSingle();

  if (!year) {
    return { context, year: null, sectors: [] as SectorGroup[], trainees: [] as ClassCard[] };
  }

  const { data } = await supabase
    .from("classes")
    .select(
      "id, display_name, section_code, class_kind, status, grade_levels(sort_order, sectors(id, code, name, short_name, sort_order)), class_staff_assignments(capacity, is_active, staff_profiles(full_name, saint_name)), enrollments(status)",
    )
    .eq("academic_year_id", year.id)
    .order("display_name");

  const rows = (data ?? []) as unknown as RawClassRow[];
  const sectorMap = new Map<string, SectorGroup & { sortOrder: number }>();
  const trainees: ClassCard[] = [];

  for (const row of rows) {
    if (row.class_kind === "trainee" || !row.grade_levels?.sectors) {
      trainees.push(toCard(row));
      continue;
    }
    const sector = row.grade_levels.sectors;
    if (!sectorMap.has(sector.id)) {
      sectorMap.set(sector.id, { sectorId: sector.id, code: sector.code, name: sector.name, shortName: sector.short_name, sortOrder: sector.sort_order, classes: [] });
    }
    sectorMap.get(sector.id)!.classes.push(toCard(row));
  }

  const sectors = [...sectorMap.values()]
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((group): SectorGroup => ({
      sectorId: group.sectorId,
      code: group.code,
      name: group.name,
      shortName: group.shortName,
      classes: group.classes,
    }));

  return { context, year, sectors, trainees };
}

export interface ClassDetail {
  id: string;
  displayName: string;
  classKind: string;
  sectorName: string | null;
  /** Cài đặt lớp — TB-F08 / I6. */
  status: string;
  meetingLocation: string | null;
  notes: string | null;
  academicYearId: string;
  academicYearCode: string;
  /** BR-M02-N10 — trang phải nói rõ lớp thuộc năm nào và năm đó đang ở trạng thái gì. */
  academicYearName: string;
  academicYearStatus: string;
  /** D-71 — mốc kết thúc học kỳ 1; `null` là chưa khai báo (D-116). */
  semester1EndDate: string | null;
  /**
   * `staffProfileId` là `null` khi RLS không cho người xem đọc hồ sơ đó
   * (`app.can_access_staff`) — lúc ấy tên cũng không đọc được, nên trang hiện chữ
   * thường thay vì một liên kết dẫn tới trang trống (M04-C, đóng điểm trừ duy nhất
   * của M04-F09).
   */
  team: Array<{ id: string; staffProfileId: string | null; capacity: string; name: string; startsOn: string }>;
  roster: Array<{
    enrollmentId: string;
    studentId: string;
    studentCode: string;
    saintName: string;
    fullName: string;
    status: string;
    /** BR-M08-20 / D-158 — em đang có đề xuất chuyển lớp chờ duyệt. */
    pendingPromotion: boolean;
  }>;
  availableStudents: Array<{ id: string; studentCode: string; label: string }>;
}

/**
 * TB-F07 / BR-M02-N09,N10 — trang chi tiết lớp **neo vào năm học**.
 *
 * 🔴 Hai quyền trả về, cố ý tách riêng, vì chúng là hai nhóm vai trò khác nhau:
 *   · `canManage` — ghi danh và kết thúc ghi danh: sáu vai trò của
 *     `ENROLLMENT_WRITE_ROLES`, gồm cả Trưởng/Phó ngành.
 *   · `canManageClass` — cài đặt lớp (I6): bốn vai trò ghi toàn xứ đoàn, khớp
 *     `classes_update_global_write`. Trưởng ngành ghi danh được nhưng **không** đóng
 *     lớp được.
 * Gộp thành một cờ là hoặc cho Trưởng ngành đóng lớp (RLS sẽ chặn ⇒ nút bấm vào là
 * báo lỗi, đúng thứ SW-04 gọi là báo thành công giả nếu quên `.select`), hoặc cắt
 * mất quyền ghi danh của họ.
 *
 * **Cả hai đều bị năm học khoá lại**: năm `closed`/`archived` là quá khứ, không ghi
 * gì nữa. Đây là chốt chặn ở tầng ứng dụng — RLS vẫn chưa biết trạng thái năm học
 * (đó là I8, đợt M02-C), xem `year-lifecycle.ts`.
 */
export async function getClassDetail(
  classId: string,
  /** BR-M03-N20 — chuỗi người dùng gõ ở ô tìm em để ghi danh. */
  studentSearch?: string,
): Promise<{
  context: Awaited<ReturnType<typeof requireRouteAccess>>;
  canManage: boolean;
  canManageClass: boolean;
  classDetail: ClassDetail | null;
  /** Đã cắt bớt kết quả hay chưa — phải NÓI RA, không im lặng cắt (`11` §5). */
  availableStudentsTruncated: boolean;
}> {
  const context = await requireRouteAccess(`/classes/${classId}`);
  const supabase = await createClient();
  let availableStudentsTruncated = false;

  const { data } = await supabase
    .from("classes")
    .select(
      // M08-B / BR-M08-20: đề xuất chuyển lớp **nhúng vào cùng lượt gọi này**,
      // không thành một truy vấn thứ hai — trang chi tiết lớp đang chạy đúng một
      // lượt cho cả roster và đó là điều M03-B vừa sửa được.
      //
      // 🔴 **Phải gọi ĐÍCH DANH khoá ngoại, và đây là một lỗi thật đã xảy ra rồi
      // được E2E bắt.** `promotion_reviews` có **hai** khoá ngoại trỏ về
      // `enrollments` — `source_enrollment_id` và `created_enrollment_id`
      // (`20260722000700_promotions.sql:5, 21`) — nên `promotion_reviews(...)`
      // trần là **nhập nhằng**: PostgREST từ chối cả câu truy vấn, `data` về
      // `null`, và trang chi tiết lớp **404 toàn bộ**. Không cửa kiểm nào trong
      // `lint`/`typecheck`/`test`/`build` bắt được vì chuỗi truy vấn là một chuỗi
      // ký tự; `class-settings.spec.ts` đỏ ngay bài đầu. Cùng khuôn `actions.ts`
      // của module này đã dùng cho `classes!promotion_reviews_source_class_id_fkey`.
      "id, display_name, class_kind, status, meeting_location, notes, academic_year_id, academic_years(code, name, status, semester_1_end_date), grade_levels(sectors(name)), class_staff_assignments(id, capacity, starts_on, is_active, staff_profiles(id, full_name, saint_name)), enrollments(id, status, students(id, student_code, saint_name, full_name), promotion_reviews!promotion_reviews_source_enrollment_id_fkey(final_status))",
    )
    .eq("id", classId)
    .maybeSingle();

  if (!data) {
    return {
      context,
      canManage: false,
      canManageClass: false,
      classDetail: null,
      availableStudentsTruncated: false,
    };
  }

  const row = data as unknown as {
    id: string;
    display_name: string;
    class_kind: string;
    status: string;
    meeting_location: string | null;
    notes: string | null;
    academic_year_id: string;
    academic_years: { code: string; name: string; status: string; semester_1_end_date: string | null } | null;
    grade_levels: { sectors: { name: string } | null } | null;
    class_staff_assignments: Array<{ id: string; capacity: string; starts_on: string; is_active: boolean; staff_profiles: { id: string; full_name: string; saint_name: string | null } | null }>;
    enrollments: Array<{
      id: string;
      status: string;
      students: { id: string; student_code: string; saint_name: string; full_name: string } | null;
      promotion_reviews: Array<{ final_status: string }> | null;
    }>;
  };

  // Năm học không đọc được (dữ liệu hỏng) coi như KHÔNG ghi được: mở khoá vì thiếu
  // thông tin là đúng hướng sai trong một chốt chặn.
  const yearWritable = isAcademicYearWritable(row.academic_years?.status);
  const canManage = canManageEnrollments(context.role) && yearWritable;
  const canManageClass = canWriteClass(context.role) && yearWritable;

  const roster = row.enrollments
    .filter((item) => isOpenEnrollmentStatus(item.status) && item.students)
    .map((item) => ({
      enrollmentId: item.id,
      studentId: item.students!.id,
      studentCode: item.students!.student_code,
      saintName: item.students!.saint_name,
      fullName: item.students!.full_name,
      status: item.status,
      // BR-M08-20 / D-158. `source_enrollment_id` là **unique** nên mảng này có
      // tối đa một phần tử; dùng `some` thay vì `[0]` để không phụ thuộc vào điều
      // đó — một ràng buộc ở bảng khác không phải chỗ để đặt niềm tin của trang này.
      pendingPromotion: (item.promotion_reviews ?? []).some((review) => review.final_status === "pending"),
    }))
    .sort((left, right) => left.fullName.localeCompare(right.fullName, "vi"));

  /**
   * BR-M03-N20 (M03-B) — ô chọn em để ghi danh phải **tìm kiếm được**.
   *
   * 🔴 Bản cũ kéo **toàn bộ bảng `students`** về Node rồi lọc bằng `Set`
   * (F09, C11/C12 = 2): với ~900 em đó là một ô `<select>` chín trăm dòng, và
   * mỗi lần mở trang chi tiết lớp lại tải lại cả bảng. Nay lọc trong SQL và
   * **cắt còn 50 kết quả**; muốn thêm ai khác thì gõ tên vào ô tìm.
   *
   * Tìm **không dấu** (D-126) qua cột `search_name`, cùng luật với `/students`
   * — người dùng không phải nhớ trang nào gõ kiểu nào.
   */
  let availableStudents: ClassDetail["availableStudents"] = [];
  if (canManage) {
    const folded = foldVietnamese(studentSearch ?? "");
    const safe = folded.replace(/[(),*"]/g, " ").trim();
    let candidates = supabase
      .from("student_directory")
      .select("id, student_code, saint_name, full_name")
      .eq("status", "active");
    if (safe !== "") {
      candidates = candidates.or(`search_name.ilike.*${safe}*,student_code.ilike.*${safe}*`);
    }
    const [openResult, studentsResult] = await Promise.all([
      supabase
        .from("enrollments")
        .select("student_id, status")
        .eq("academic_year_id", row.academic_year_id)
        .in("status", ["active", "paused"]),
      candidates.order("full_name").limit(AVAILABLE_STUDENT_LIMIT),
    ]);
    const enrolled = new Set((openResult.data ?? []).map((item) => item.student_id));
    // Cột của một khung nhìn luôn sinh ra kiểu cho phép `null` phía TypeScript
    // (Postgres không suy được tính không-rỗng qua `left join`), nên phải lọc
    // tường minh thay vì khẳng định bằng `!`.
    availableStudents = (studentsResult.data ?? [])
      .filter((item): item is typeof item & { id: string; student_code: string; full_name: string } =>
        item.id !== null && item.student_code !== null && item.full_name !== null,
      )
      .filter((item) => !enrolled.has(item.id))
      .map((item) => ({
        id: item.id,
        studentCode: item.student_code,
        label: `${item.saint_name ?? ""} ${item.full_name}`.trim(),
      }));
    availableStudentsTruncated =
      (studentsResult.data ?? []).length >= AVAILABLE_STUDENT_LIMIT;
  }

  return {
    context,
    canManage,
    canManageClass,
    availableStudentsTruncated,
    classDetail: {
      id: row.id,
      displayName: row.display_name,
      classKind: row.class_kind,
      sectorName: row.grade_levels?.sectors?.name ?? null,
      status: row.status,
      meetingLocation: row.meeting_location,
      notes: row.notes,
      academicYearId: row.academic_year_id,
      academicYearCode: row.academic_years?.code ?? "",
      academicYearName: row.academic_years?.name ?? "",
      academicYearStatus: row.academic_years?.status ?? "",
      semester1EndDate: row.academic_years?.semester_1_end_date ?? null,
      team: row.class_staff_assignments
        .filter((item) => item.is_active)
        .map((item) => ({
          id: item.id,
          staffProfileId: item.staff_profiles?.id ?? null,
          capacity: item.capacity,
          name: staffLabel(item.staff_profiles),
          startsOn: item.starts_on,
        })),
      roster,
      availableStudents,
    },
  };
}
