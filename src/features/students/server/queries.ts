import "server-only";

import { requireRouteAccess } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { foldVietnamese } from "@/lib/text/fold-vietnamese";
import type { ExistingStudent } from "@/lib/students/duplicate";
import {
  buildStudentQuery,
  clampStudentPage,
  STUDENT_PAGE_SIZE,
  type StudentDirectoryCriteria,
  type StudentDirectoryQuery,
} from "../student-directory";
import {
  canArchiveStudent,
  canDeleteSacrament,
  canViewSensitive,
  canWriteSensitive,
  canWriteStudents,
  mustPickClassOnCreate,
  readsFeeDirectory,
} from "./permissions";

export interface StudentListItem {
  id: string;
  studentCode: string;
  saintName: string;
  fullName: string;
  status: string;
  hardshipFlag: boolean;
  guardianName: string;
  guardianPhone: string;
  /** Rỗng khi em chưa xếp lớp trong năm hiện hành — đó là một tin, không phải lỗi. */
  className: string | null;
  sectorCode: string | null;
  sectorName: string | null;
}

export interface GuardianOption {
  id: string;
  fullName: string;
  /** Null từ IMP-BULK-002 — `list_guardian_options` trả thẳng cột đã nới. */
  phone: string | null;
}

export interface ClassOption {
  id: string;
  displayName: string;
  sectorId: string | null;
  sectorName: string | null;
}

export interface SectorOption {
  id: string;
  name: string;
}

/**
 * Bộ lọc dùng chung cho **cả hai** truy vấn của danh sách: một để đếm tổng, một
 * để lấy trang. Viết một lần vì hai bản chép tay của cùng một bộ lọc là cách
 * chắc chắn nhất để "trang 2" trỏ vào một tập kết quả khác với con số tổng.
 *
 * Kiểu tự quy chiếu `T extends StudentFilterable<T>` bám đúng hình dạng của bộ
 * dựng truy vấn PostgREST (mỗi phương thức lọc trả về chính nó), nên không cần
 * một dòng `as` nào.
 */
interface StudentFilterable<T> {
  eq(column: string, value: unknown): T;
  is(column: string, value: null): T;
  or(filters: string): T;
}

function applyStudentFilters<T extends StudentFilterable<T>>(
  builder: T,
  plan: StudentDirectoryQuery,
): T {
  let query = builder;
  if (plan.status !== "all") query = query.eq("status", plan.status);
  if (plan.sectorId !== "all") query = query.eq("sector_id", plan.sectorId);
  if (plan.classId === "none") query = query.is("class_id", null);
  else if (plan.classId !== "all") query = query.eq("class_id", plan.classId);

  if (plan.foldedName !== "") {
    // Trong cú pháp `or` của PostgREST, dấu phẩy tách các nhánh và ngoặc gom
    // nhóm — một dấu phẩy lọt vào chuỗi tìm kiếm làm hỏng cả biểu thức. Người
    // dùng gõ gì vào ô tìm kiếm cũng được, kể cả dấu câu.
    const safe = plan.foldedName.replace(/[(),*"]/g, " ").trim();
    if (safe !== "") {
      const branches = [`search_name.ilike.*${safe}*`, `student_code.ilike.*${safe}*`];
      // `docs/06` §8 — tìm theo số điện thoại người giám hộ. Chỉ so chữ số nên
      // "0901 234 567" và "0901234567" ra cùng một em.
      if (plan.phoneDigits !== "") branches.push(`guardian_phone.ilike.*${plan.phoneDigits}*`);
      query = query.or(branches.join(","));
    }
  }
  return query;
}

export interface StudentsPageData {
  context: Awaited<ReturnType<typeof requireRouteAccess>>;
  canWrite: boolean;
  requiresClassOnCreate: boolean;
  students: StudentListItem[];
  guardians: GuardianOption[];
  /** Lớp của năm hiện hành mà người đang đăng nhập ghi danh được. */
  classes: ClassOption[];
  sectors: SectorOption[];
  page: number;
  pageSize: number;
  totalItems: number;
  /**
   * **D-67/D-129** — trang đang đọc qua **cửa sổ hẹp của Thủ quỹ**, nên nó thiếu
   * một số cột và **không mở được hồ sơ chi tiết**. Trang phải nói ra điều đó
   * thay vì để người dùng bấm vào một cái tên rồi nhận 404.
   */
  feeScope: boolean;
}

/**
 * TB-F03 — danh sách thiếu nhi có tìm kiếm, lọc và phân trang (đóng M03-F03).
 *
 * 🔴 Trước đợt này hàm nhận **không tham số nào** và đổ thẳng ~900 em ra một
 * trang: muốn tìm một em phải Ctrl+F, và trên máy 360px của Giáo lý viên đứng
 * lớp thì đó là màn hình không dùng được (5W-F03).
 *
 * Ba điều cần nhớ về cách cài:
 *
 *   1. **Lọc và cắt trang xảy ra trong SQL**, trên khung nhìn
 *      `public.student_directory` (`security_invoker` ⇒ RLS vẫn theo người
 *      đăng nhập). Kéo cả bảng về Node rồi cắt như `staff-directory` của M04 là
 *      đúng thứ TB-F03 sinh ra để bỏ — ở đó vài chục dòng, ở đây ~900.
 *   2. **Tìm không dấu (D-126)** so trên cột sinh sẵn `search_name`, cộng thêm
 *      hai nhánh: mã `CQxxxx` và số điện thoại người giám hộ (`docs/06` §8).
 *   3. `count: "exact"` để phân trang biết tổng — và để **nói ra con số** thay
 *      vì để người dùng đoán danh sách còn bao nhiêu em nữa.
 */
export async function getStudentsPageData(
  criteria: StudentDirectoryCriteria,
): Promise<StudentsPageData> {
  const context = await requireRouteAccess("/students");
  const supabase = await createClient();
  const canWrite = canWriteStudents(context.role);
  const plan = buildStudentQuery(criteria);

  /*
    🔴 **D-67/D-129 — Thủ quỹ đi một đường khác, không đi qua khung nhìn chung.**

    Thủ quỹ không nằm trong `app.can_global_read()`, nên `student_directory` trả
    **0 dòng** cho họ — đúng như D-67 mô tả ("mọi trang đều trống"). Đường mới là
    một cửa sổ hẹp trả đúng các cột đã duyệt.

    Vì sao không thêm một nhánh `treasurer` vào `students_select_scope` cho gọn:
    RLS lọc theo **dòng**, không theo **cột**. Mở dòng ra là Thủ quỹ đọc được
    ngày sinh, địa chỉ nhà và ghi chú nội bộ qua Data API bằng chính JWT của họ,
    bất kể giao diện hiện gì — mà D-67 liệt kê đích danh ba thứ đó vào nhóm
    "KHÔNG được xem".
  */
  if (readsFeeDirectory(context.role)) {
    return loadFeeDirectoryPage(context, criteria, plan);
  }

  // Đếm trước để biết trang yêu cầu có tồn tại không. Dấu trang cũ `?page=40`
  // sau khi danh sách ngắn lại phải rơi về trang cuối, không phải một trang
  // trống không giải thích.
  const { count } = await applyStudentFilters(
    supabase.from("student_directory").select("id", { count: "exact", head: true }),
    plan,
  );
  const totalItems = count ?? 0;
  const page = clampStudentPage(criteria.page, totalItems);
  const from = (page - 1) * STUDENT_PAGE_SIZE;

  const { data: rows } = await applyStudentFilters(
    supabase
      .from("student_directory")
      .select(
        "id, student_code, saint_name, full_name, status, hardship_flag, guardian_name, guardian_phone, class_name, sector_code, sector_name",
      ),
    plan,
  )
    .order("full_name", { ascending: true })
    .range(from, from + STUDENT_PAGE_SIZE - 1);

  const students = ((rows ?? []) as Array<{
    id: string;
    student_code: string;
    saint_name: string | null;
    full_name: string;
    status: string;
    hardship_flag: boolean;
    guardian_name: string | null;
    guardian_phone: string | null;
    class_name: string | null;
    sector_code: string | null;
    sector_name: string | null;
  }>).map((row): StudentListItem => ({
    id: row.id,
    studentCode: row.student_code,
    saintName: row.saint_name ?? "",
    fullName: row.full_name,
    status: row.status,
    hardshipFlag: row.hardship_flag,
    // D-124 — vai trò ngành nay đọc được người giám hộ của em trong ngành mình.
    // Dấu "—" chỉ còn xuất hiện khi hồ sơ thật sự nằm ngoài phạm vi.
    guardianName: row.guardian_name ?? "—",
    guardianPhone: row.guardian_phone ?? "—",
    className: row.class_name,
    sectorCode: row.sector_code,
    sectorName: row.sector_name,
  }));

  const [guardians, classes, sectors] = await Promise.all([
    loadGuardianOptions(canWrite),
    // 🔴 KHÔNG gán theo `canWrite`. Danh sách lớp phục vụ **hai** việc: ô chọn
    // của biểu mẫu tạo hồ sơ (chỉ người ghi được thấy) và **bộ lọc lớp** của
    // danh sách (ai đọc được trang cũng cần). Gộp làm một là để Giáo lý viên mở
    // trang và thấy ô "Lọc theo lớp" rỗng trơn — một bộ lọc không lọc được gì.
    // RLS đã giới hạn đúng phạm vi lớp của từng người.
    loadEnrollableClasses(),
    loadSectorOptions(),
  ]);

  return {
    context,
    canWrite,
    requiresClassOnCreate: mustPickClassOnCreate(context.role),
    students,
    guardians,
    classes,
    sectors,
    page,
    pageSize: STUDENT_PAGE_SIZE,
    totalItems,
    feeScope: false,
  };
}

/**
 * **D-67/D-129 — trang danh sách của Thủ quỹ.**
 *
 * Dùng lại **nguyên vẹn** `buildStudentQuery`/`clampStudentPage` của TB-F03 nên
 * ô tìm, bộ lọc và phân trang cư xử giống hệt mọi vai trò khác — chỉ nguồn dữ
 * liệu là khác. Viết một bộ tham số thứ hai cho riêng Thủ quỹ là dựng một màn
 * hình song song sẽ lệch dần theo từng đợt.
 *
 * `total_count` đi kèm từng dòng (`count(*) over ()` trong SQL) nên chỉ cần một
 * lượt gọi: hai lượt với hai bộ lọc chép tay là cách chắc chắn nhất để "trang 2"
 * trỏ vào một tập khác với con số tổng.
 *
 * Trang rỗng thì `total_count` không tồn tại ⇒ tổng = 0, và `clampStudentPage`
 * kéo `?page=40` về trang 1 y như đường chính.
 */
async function loadFeeDirectoryPage(
  context: Awaited<ReturnType<typeof requireRouteAccess>>,
  criteria: StudentDirectoryCriteria,
  plan: StudentDirectoryQuery,
): Promise<StudentsPageData> {
  const supabase = await createClient();
  const filters = {
    p_search: criteria.search || undefined,
    p_sector_id: plan.sectorId === "all" ? undefined : plan.sectorId,
    p_class_id: plan.classId === "all" || plan.classId === "none" ? undefined : plan.classId,
    p_unassigned: plan.classId === "none",
    p_status: plan.status === "all" ? undefined : plan.status,
  };

  // Một lượt gọi rẻ chỉ để lấy tổng, **trước khi** kẹp số trang. Đường chính
  // cũng đếm trước vì đúng lý do đó: dấu trang cũ `?page=40` sau khi danh sách
  // ngắn lại phải rơi về trang cuối, không phải một trang trống không giải thích.
  const { data: head } = await supabase.rpc("list_students_for_fees", {
    ...filters,
    p_limit: 1,
    p_offset: 0,
  });
  const totalItems = Number((head ?? [])[0]?.total_count ?? 0);
  const page = clampStudentPage(criteria.page, totalItems);

  const { data } = await supabase.rpc("list_students_for_fees", {
    ...filters,
    p_limit: STUDENT_PAGE_SIZE,
    p_offset: (page - 1) * STUDENT_PAGE_SIZE,
  });
  const rows = data ?? [];

  const students = rows.map((row): StudentListItem => ({
    id: row.id,
    studentCode: row.student_code,
    saintName: row.saint_name ?? "",
    fullName: row.full_name,
    status: row.status,
    hardshipFlag: row.hardship_flag,
    guardianName: row.guardian_name ?? "—",
    guardianPhone: row.guardian_phone ?? "—",
    className: row.class_name,
    sectorCode: row.sector_code,
    sectorName: row.sector_name,
  }));

  const [classes, sectors] = await Promise.all([loadEnrollableClasses(), loadSectorOptions()]);

  return {
    context,
    // D-67: *"Thủ quỹ KHÔNG ghi được gì — kể cả ghi chú."*
    canWrite: false,
    requiresClassOnCreate: false,
    students,
    guardians: [],
    classes,
    sectors,
    page,
    pageSize: STUDENT_PAGE_SIZE,
    totalItems,
    feeScope: true,
  };
}

/**
 * D-124 — cửa sổ hẹp chỉ tên + số điện thoại (`public.list_guardian_options`).
 *
 * Vì sao không `select` thẳng bảng `guardians` như trước: Trưởng/Phó ngành
 * **không đọc được bảng đó**, nên trước M03-B ô chọn phụ huynh của họ rỗng
 * trơn — và nếu D-63 mở quyền tạo hồ sơ mà không mở đường chọn, họ sẽ tạo phụ
 * huynh mới cho một gia đình đã có, tức là nhân bản đúng lỗi F01.
 */
async function loadGuardianOptions(canWrite: boolean): Promise<GuardianOption[]> {
  if (!canWrite) return [];
  const supabase = await createClient();
  const { data } = await supabase.rpc("list_guardian_options", {});
  return (data ?? []).map((item): GuardianOption => ({
    id: item.id,
    fullName: item.full_name,
    phone: item.phone,
  }));
}

/**
 * D-123 / BR-M03-N21 — chỉ lớp **đang hoạt động** của năm **hiện hành**.
 *
 * Không lọc theo ngành ở đây: RLS đã lọc đúng (`classes_select_scope`), và lọc
 * lần thứ hai trong mã là dựng bản chép tay thứ hai của luật ngành.
 */
async function loadEnrollableClasses(): Promise<ClassOption[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("classes")
    .select("id, display_name, status, academic_years!inner(status), grade_levels(sector_id, sectors(name))")
    .eq("status", "active")
    .eq("academic_years.status", "current")
    .order("display_name");
  return ((data ?? []) as unknown as Array<{
    id: string;
    display_name: string;
    grade_levels: { sector_id: string | null; sectors: { name: string } | null } | null;
  }>).map((row): ClassOption => ({
    id: row.id,
    displayName: row.display_name,
    sectorId: row.grade_levels?.sector_id ?? null,
    sectorName: row.grade_levels?.sectors?.name ?? null,
  }));
}

/**
 * TB-F13 pha một — tìm hồ sơ nghi trùng trước khi tạo (AC-F13-01).
 *
 * 🔴 **Chạy dưới RLS của người thao tác, tuyệt đối không dùng service role**
 * (AC-F13-03). Nếu hồ sơ nghi trùng nằm ngoài phạm vi người đó, họ sẽ không
 * thấy — cảnh báo hụt còn hơn là biến chính màn hình cảnh báo thành một cửa rò
 * hồ sơ thiếu nhi. Khung nhìn `student_directory` là `security_invoker` nên
 * điều này đúng theo thiết kế chứ không phải nhờ cẩn thận.
 *
 * Không quét cả bảng: hai truy vấn hẹp (trùng tên đã bỏ dấu · trùng số điện
 * thoại người giám hộ) rồi để hàm thuần chấm mức. Ứng viên "tên gần giống" đều
 * đòi trùng số điện thoại nên nhánh thứ hai phủ hết.
 */
export async function findStudentDuplicateCandidates(input: {
  fullName: string;
  guardianId: string | null;
}): Promise<{ candidates: ExistingStudent[]; guardianPhone: string | null }> {
  const folded = foldVietnamese(input.fullName);
  const supabase = await createClient();

  // Số điện thoại của người giám hộ vừa chọn — cần cho hai mức cảnh báo `high`
  // và `low`. Đọc qua cửa sổ hẹp vì đó là nguồn duy nhất mà cả vai trò xứ đoàn
  // lẫn vai trò ngành cùng đọc được (D-124).
  let guardianPhone: string | null = null;
  if (input.guardianId) {
    const { data } = await supabase.rpc("list_guardian_options", {});
    guardianPhone = (data ?? []).find((item) => item.id === input.guardianId)?.phone ?? null;
  }
  if (folded === "") return { candidates: [], guardianPhone };

  const columns = "id, student_code, full_name, date_of_birth, guardian_phone, class_name";
  const byName = await supabase
    .from("student_directory")
    .select(columns)
    .eq("search_name", folded)
    .limit(25);
  const byPhone = guardianPhone
    ? await supabase
        .from("student_directory")
        .select(columns)
        .eq("guardian_phone", guardianPhone)
        .limit(25)
    : { data: [] };

  const seen = new Map<string, ExistingStudent>();
  for (const row of [...(byName.data ?? []), ...(byPhone.data ?? [])]) {
    const item = row as {
      id: string;
      student_code: string;
      full_name: string;
      // IMP-BULK-002 — hình dạng gõ tay ở đây phải nói THẬT về cột đã nới, nếu
      // không thì `tsc` im lặng đúng chỗ cần nó lên tiếng nhất.
      date_of_birth: string | null;
      guardian_phone: string | null;
      class_name: string | null;
    };
    seen.set(item.id, {
      id: item.id,
      studentCode: item.student_code,
      fullName: item.full_name,
      dateOfBirth: item.date_of_birth,
      guardianPhone: item.guardian_phone,
      className: item.class_name,
    });
  }
  return { candidates: [...seen.values()], guardianPhone };
}

/**
 * BR-M03-N09 — ứng viên trùng cho hồ sơ **người giám hộ**.
 *
 * Đọc qua cửa sổ hẹp `list_guardian_options` vì đó là nguồn duy nhất mà cả vai
 * trò xứ đoàn lẫn vai trò ngành cùng đọc được (D-124). Một cảnh báo trùng chỉ
 * nhìn thấy nửa dữ liệu là một cảnh báo nói dối.
 */
export async function findGuardianDuplicateCandidates(input: {
  fullName: string;
  phone: string;
}): Promise<Array<{ id: string; fullName: string; phone: string | null; reason: string }>> {
  const folded = foldVietnamese(input.fullName);
  const digits = input.phone.replace(/\D/g, "");
  if (folded === "" && digits === "") return [];

  const supabase = await createClient();
  const { data } = await supabase.rpc("list_guardian_options", {});

  const suspects: Array<{ id: string; fullName: string; phone: string | null; reason: string }> = [];
  for (const item of data ?? []) {
    // 🔴 IMP-BULK-002 — `item.phone` có thể là null từ đợt nới ràng buộc, và
    // `null.replace()` là một lượt ném lỗi giữa luồng tạo hồ sơ phụ huynh chứ
    // không phải một cảnh báo hụt. Kiểu sinh từ RPC vẫn khai `string` nên trình
    // biên dịch KHÔNG bắt được chỗ này — phải chặn bằng tay.
    const samePhone = digits !== "" && (item.phone ?? "").replace(/\D/g, "") === digits;
    const sameName = folded !== "" && foldVietnamese(item.full_name) === folded;
    if (!samePhone && !sameName) continue;
    suspects.push({
      id: item.id,
      fullName: item.full_name,
      phone: item.phone,
      reason: samePhone && sameName
        ? "trùng cả họ tên và số điện thoại"
        : samePhone
          ? "trùng số điện thoại"
          : "trùng họ tên",
    });
  }
  return suspects;
}

async function loadSectorOptions(): Promise<SectorOption[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sectors")
    .select("id, name, sort_order")
    .eq("is_active", true)
    .order("sort_order");
  return (data ?? []).map((row): SectorOption => ({ id: row.id, name: row.name }));
}

export interface StudentDetail {
  id: string;
  studentCode: string;
  saintName: string;
  fullName: string;
  /** Null từ IMP-BULK-002 — sổ SYLL của giáo xứ không có cột giới tính. */
  gender: string | null;
  /** Null từ IMP-BULK-002 — sổ lên lớp nhiều em chỉ có tên. */
  dateOfBirth: string | null;
  patronFeastDate: string | null;
  address: string | null;
  phone: string | null;
  hardshipFlag: boolean;
  status: string;
  generalNotes: string | null;
  guardian: { id: string; fullName: string; phone: string | null; address: string | null } | null;
  health: {
    allergies: string | null;
    medicalConditions: string | null;
    medications: string | null;
    emergencyNotes: string | null;
  } | null;
  sacraments: Array<{
    id: string;
    sacramentType: string;
    sacramentName: string | null;
    sacramentDate: string | null;
    place: string | null;
    godparentName: string | null;
    registryNumber: string | null;
    notes: string | null;
  }>;
  enrollments: Array<{
    id: string;
    status: string;
    enrolledOn: string;
    endedOn: string | null;
    className: string;
    academicYearCode: string;
  }>;
}

export async function getStudentDetail(studentId: string): Promise<{
  context: Awaited<ReturnType<typeof requireRouteAccess>>;
  canWrite: boolean;
  /**
   * **D-127** — sức khoẻ và bí tích nay mở cho vai trò ngành và Giáo lý viên,
   * nhưng **không** cho Dự trưởng phụ tá (`docs/05` §3 cho họ 👁📍). Vì thế nó
   * vẫn là một cờ riêng, không phải `canWrite`.
   */
  canWriteSensitive: boolean;
  canViewSensitive: boolean;
  /** **D-128** — xoá bí tích hẹp hơn ghi một bậc. */
  canDeleteSacrament: boolean;
  /** **TB-F06** — `docs/05` §5: "Archive student: SA/global-write". */
  canArchive: boolean;
  student: StudentDetail | null;
  /**
   * BR-M03-N19 — lớp để mời ghi danh khi em **chưa xếp lớp** năm nay. Rỗng khi
   * em đã có lớp, khi người xem không ghi được, hoặc khi không có năm hiện hành.
   */
  enrollableClasses: ClassOption[];
  /**
   * **TB-F06/AC-F06-01** — tên lớp của ghi danh **đang mở**. Hộp xác nhận phải
   * nêu nó bằng tên riêng, và ô "Đồng thời kết thúc ghi danh" chỉ hiện khi có.
   */
  openEnrollmentClassName: string | null;
  /** **TB-F12/BR-M03-N16** — cửa sổ hẹp để chọn người giám hộ khác (D-124). */
  guardianOptions: GuardianOption[];
}> {
  const context = await requireRouteAccess(`/students/${studentId}`);
  const supabase = await createClient();

  const { data } = await supabase
    .from("students")
    .select(
      "id, student_code, saint_name, full_name, gender, date_of_birth, patron_feast_date, address, phone, hardship_flag, status, general_notes, guardians(id, full_name, phone, address)",
    )
    .eq("id", studentId)
    .maybeSingle();

  if (!data) {
    return {
      context,
      canWrite: canWriteStudents(context.role),
      canWriteSensitive: canWriteSensitive(context.role),
      canViewSensitive: false,
      canDeleteSacrament: canDeleteSacrament(context.role),
      canArchive: canArchiveStudent(context.role),
      student: null,
      enrollableClasses: [],
      openEnrollmentClassName: null,
      guardianOptions: [],
    };
  }

  const row = data as unknown as {
    id: string;
    student_code: string;
    saint_name: string;
    full_name: string;
    // IMP-BULK-002 — ba cột dưới đây nay có thể trống ở cơ sở dữ liệu.
    gender: string | null;
    date_of_birth: string | null;
    patron_feast_date: string | null;
    address: string | null;
    phone: string | null;
    hardship_flag: boolean;
    status: string;
    general_notes: string | null;
    guardians: { id: string; full_name: string; phone: string | null; address: string | null } | null;
  };

  const { data: enrollmentRows } = await supabase
    .from("enrollments")
    .select(
      "id, status, enrolled_on, ended_on, classes(display_name), academic_years(code, status)",
    )
    .eq("student_id", studentId)
    .order("enrolled_on", { ascending: false });
  const enrollmentSource = (enrollmentRows ?? []) as unknown as Array<{
    id: string;
    status: string;
    enrolled_on: string;
    ended_on: string | null;
    classes: { display_name: string } | null;
    academic_years: { code: string; status: string } | null;
  }>;
  const enrollments = enrollmentSource.map((item) => ({
    id: item.id,
    status: item.status,
    enrolledOn: item.enrolled_on,
    endedOn: item.ended_on,
    className: item.classes?.display_name ?? "—",
    academicYearCode: item.academic_years?.code ?? "—",
  }));

  // BR-M03-N19 — chỉ mời ghi danh khi em **chưa có ghi danh mở trong năm hiện
  // hành**. Ràng buộc "một ghi danh mở mỗi em mỗi năm" nằm ở cơ sở dữ liệu
  // (`enrollments_one_open_per_student_year_idx`); hiện biểu mẫu khi đã có lớp
  // là mời người dùng đi vào một lỗi `23505`.
  const canWrite = canWriteStudents(context.role);
  const hasOpenEnrollmentThisYear = enrollmentSource.some(
    (item) =>
      (item.status === "active" || item.status === "paused") &&
      item.academic_years?.status === "current",
  );
  const enrollableClasses =
    canWrite && !hasOpenEnrollmentThisYear ? await loadEnrollableClasses() : [];

  /*
    TB-F06 — ghi danh **đang mở**, bất kể năm nào. Cố ý KHÔNG lọc theo năm hiện
    hành như `hasOpenEnrollmentThisYear` ở trên: lưới an toàn
    `students_status_needs_closed_enrollment` cũng không lọc, nên lọc ở đây là
    để giao diện nói "em không có ghi danh nào" rồi cơ sở dữ liệu từ chối bằng
    `STUDENT_HAS_OPEN_ENROLLMENT` — một câu người dùng không hiểu vì màn hình
    vừa nói ngược lại.
  */
  const openEnrollment = enrollmentSource.find(
    (item) => item.status === "active" || item.status === "paused",
  );
  const guardianOptions = await loadGuardianOptions(canWrite);

  const sensitive = canViewSensitive(context.role);
  let health: StudentDetail["health"] = null;
  let sacraments: StudentDetail["sacraments"] = [];

  if (sensitive) {
    const [healthResult, sacramentsResult] = await Promise.all([
      supabase
        .from("student_health_profiles")
        .select("allergies, medical_conditions, medications, emergency_notes")
        .eq("student_id", studentId)
        .maybeSingle(),
      supabase
        .from("student_sacraments")
        .select("id, sacrament_type, sacrament_name, sacrament_date, place, godparent_name, registry_number, notes")
        .eq("student_id", studentId)
        .order("sacrament_date", { nullsFirst: false }),
    ]);
    if (healthResult.data) {
      health = {
        allergies: healthResult.data.allergies,
        medicalConditions: healthResult.data.medical_conditions,
        medications: healthResult.data.medications,
        emergencyNotes: healthResult.data.emergency_notes,
      };
    }
    sacraments = (sacramentsResult.data ?? []).map((item) => ({
      id: item.id,
      sacramentType: item.sacrament_type,
      sacramentName: item.sacrament_name,
      sacramentDate: item.sacrament_date,
      place: item.place,
      godparentName: item.godparent_name,
      registryNumber: item.registry_number,
      notes: item.notes,
    }));
  }

  return {
    context,
    canWrite,
    canWriteSensitive: canWriteSensitive(context.role),
    canViewSensitive: sensitive,
    canDeleteSacrament: canDeleteSacrament(context.role),
    canArchive: canArchiveStudent(context.role),
    enrollableClasses,
    openEnrollmentClassName: openEnrollment?.classes?.display_name ?? null,
    guardianOptions,
    student: {
      id: row.id,
      studentCode: row.student_code,
      saintName: row.saint_name,
      fullName: row.full_name,
      gender: row.gender,
      dateOfBirth: row.date_of_birth,
      patronFeastDate: row.patron_feast_date,
      address: row.address,
      phone: row.phone,
      hardshipFlag: row.hardship_flag,
      status: row.status,
      generalNotes: row.general_notes,
      guardian: row.guardians
        ? {
            id: row.guardians.id,
            fullName: row.guardians.full_name,
            phone: row.guardians.phone,
            address: row.guardians.address,
          }
        : null,
      health,
      sacraments,
      enrollments,
    },
  };
}
