import type { AppRole } from "@/lib/permissions/roles";

/**
 * Ai ghi được hồ sơ thiếu nhi và người giám hộ — **D-63 / D-123** (chủ dự án
 * chốt 2026-07-28).
 *
 * 🔴 File THUẦN ở gốc feature, không `server-only`, cùng khuôn với
 * `enrollments/permissions.ts` và `auth/permissions.ts`. Guard nằm ở
 * `server/permissions.ts`. Tách như vậy để **kiểm được bằng unit test thường**:
 * một danh sách vai trò chỉ nằm trong module server thì bài test nào chạm vào
 * cũng chết ngay ở dòng `import "server-only"`.
 *
 * Danh sách này đi cùng `app.can_write_student()` ở
 * `20260728000100_student_directory_and_sector_write.sql`; hai bên lệch nhau là
 * người dùng bấm được nút rồi bị cơ sở dữ liệu từ chối bằng **0 dòng** — đúng
 * thứ M03-A đã đi diệt.
 *
 * Phạm vi **theo ngành** không nằm ở đây mà ở cơ sở dữ liệu
 * (`app.sector_managed_student_ids()`): danh sách vai trò chỉ trả lời "có được
 * bấm không", còn "được bấm lên em nào" là việc của RLS.
 */
export const STUDENT_WRITE_ROLES: readonly AppRole[] = [
  "super_admin",
  "group_leader",
  "deputy_group_leader",
  "secretary",
  "sector_leader",
  "sector_deputy",
];

/**
 * 🔴 **D-127 — Q-M03-02 đã chốt 2026-07-28: theo đúng bảng phân quyền.**
 *
 * `docs/05` §3 cho Trưởng/Phó ngành và Giáo lý viên (đại diện · lớp) quyền ✅📍
 * trên cả hai dòng "Sức khỏe" và "Bí tích"; từ Phase 2 tới M03-B mã nguồn chỉ
 * cho **đọc** — hẹp hơn matrix — và chênh lệch ấy là câu hỏi Q-M03-02 để ngỏ
 * suốt Giai đoạn 2B. Chủ dự án chốt theo matrix, với hai lý lẽ:
 *
 *   1. Người biết "em này dị ứng đậu phộng" là Giáo lý viên đứng lớp hằng tuần,
 *      không phải Thư ký ngồi bàn giấy. Bắt họ nhắn tin cho Thư ký để ghi một
 *      dòng dị ứng là cách chắc chắn nhất để dòng đó không bao giờ được ghi.
 *   2. Bốn vai trò này **đã đọc được** hai mục ấy từ trước (`SENSITIVE_READ_ROLES`),
 *      nên đây là mở quyền GHI, không phải mở thêm dữ liệu ra cho ai.
 *
 * 🔴 **Dự trưởng phụ tá KHÔNG có trong danh sách** — `docs/05` §3 cho họ 👁📍
 * (chỉ đọc) ở đúng hai dòng này, và họ là vai trò duy nhất trong nhóm lớp bị
 * giữ lại. Thêm họ vào cho "gọn danh sách" là tự đổi một dòng của bảng phân
 * quyền đã duyệt.
 *
 * Vẫn giữ **hai** danh sách chứ không gộp với `STUDENT_WRITE_ROLES`: hai nhóm
 * khác nhau thật, và khác ở hai đầu ngược nhau — Giáo lý viên ghi được sức khoẻ
 * nhưng **không** sửa được ngày sinh/địa chỉ của em.
 *
 * Đi cùng `app.can_write_student_sensitive()` ở
 * `20260728000200_student_lifecycle_and_fee_reads.sql`. Phạm vi "chỉ em trong
 * lớp/ngành mình" do RLS giữ (`app.class_scoped_student_ids()`), không phải do
 * danh sách này.
 */
export const STUDENT_SENSITIVE_WRITE_ROLES: readonly AppRole[] = [
  "super_admin",
  "group_leader",
  "deputy_group_leader",
  "secretary",
  "sector_leader",
  "sector_deputy",
  "class_representative",
  "class_teacher",
];

/**
 * **D-128 — xoá bản ghi bí tích, hẹp hơn quyền ghi một bậc** (Q-M03-05 chốt
 * 2026-07-28).
 *
 * Sửa sai thì lần sau sửa lại; xoá thì không. Ca buộc phải có nút xoá là ca
 * không sửa nổi: một bí tích lỡ thêm vào hồ sơ **nhầm em** thì không có đường
 * nào chuyển nó sang em đúng. Chỉ cho sửa, người dùng sẽ đổi nó thành một loại
 * bí tích khác để "dọn" — làm hỏng dữ liệu theo kiểu khó phát hiện hơn.
 */
export const SACRAMENT_DELETE_ROLES: readonly AppRole[] = [
  "super_admin",
  "group_leader",
  "deputy_group_leader",
  "secretary",
];

/**
 * **TB-F06 / `docs/05` §5** — *"Archive student: SA/global-write"*.
 *
 * D-63 nới quyền **tạo và sửa** hồ sơ cho vai trò ngành, **không** nới quyền
 * lưu trữ. Vai trò ngành vẫn đổi được `active` ⇄ `temporarily_inactive` — việc
 * mục vụ hằng ngày của họ — nhưng "Đã rút"/"Lưu trữ" đóng ghi danh và cắt quyền
 * đọc của Giáo lý viên lớp, nên nó ở lại với bốn vai trò xứ đoàn.
 */
export const STUDENT_ARCHIVE_ROLES: readonly AppRole[] = [
  "super_admin",
  "group_leader",
  "deputy_group_leader",
  "secretary",
];

// Roles allowed to view sensitive health/sacrament data (matrix docs/05 §3).
// Sector leaders/deputies and class staff see it only for students enrolled in
// their scope — the DB (app.can_view_student_sensitive) enforces the per-student
// check; this list only decides whether the tab renders at all.
export const SENSITIVE_READ_ROLES: readonly AppRole[] = [
  "super_admin",
  "parish_priest",
  "chaplain",
  "group_leader",
  "deputy_group_leader",
  "secretary",
  "sector_leader",
  "sector_deputy",
  "class_representative",
  "class_teacher",
  "trainee_assistant",
];

/**
 * D-123 — vai trò ngành **bắt buộc chọn lớp** khi tạo hồ sơ.
 *
 * Ngành của một em suy ra từ lớp em học, mà hồ sơ vừa tạo thì chưa có lớp nào ⇒
 * "chỉ trong ngành mình" không có gì để kiểm. Hàm
 * `public.create_student_with_enrollment` từ chối `p_class_id` rỗng với vai trò
 * ngành; giao diện hỏi trước để người dùng không phải chạm vào lỗi ấy.
 */
export function mustPickClassOnCreate(role: AppRole | null): boolean {
  return role === "sector_leader" || role === "sector_deputy";
}

export function canWriteStudents(role: AppRole | null): boolean {
  return role !== null && STUDENT_WRITE_ROLES.includes(role);
}

export function canWriteSensitive(role: AppRole | null): boolean {
  return role !== null && STUDENT_SENSITIVE_WRITE_ROLES.includes(role);
}

export function canViewSensitive(role: AppRole | null): boolean {
  return role !== null && SENSITIVE_READ_ROLES.includes(role);
}

export function canDeleteSacrament(role: AppRole | null): boolean {
  return role !== null && SACRAMENT_DELETE_ROLES.includes(role);
}

export function canArchiveStudent(role: AppRole | null): boolean {
  return role !== null && STUDENT_ARCHIVE_ROLES.includes(role);
}

/**
 * **D-67 / D-129 — Thủ quỹ đọc qua một cửa sổ hẹp, không qua danh sách chung.**
 *
 * Thủ quỹ không nằm trong `app.can_global_read()`, nên trước đợt này `/students`
 * của họ **trống trơn** — đúng như D-67 mô tả ("hiện Thủ quỹ không nằm trong bất
 * kỳ nhóm đọc nào, nên mọi trang đều trống"). Cửa sổ mới
 * (`public.list_students_for_fees`) trả đúng các cột đã duyệt: tên thánh · họ
 * tên · lớp · ngành · người giám hộ + số điện thoại · dấu hoàn cảnh khó khăn
 * (**D-129**). **Không** có ngày sinh, địa chỉ, ghi chú nội bộ, sức khoẻ, bí tích.
 *
 * Hàm này chỉ quyết định trang gọi đường nào; ranh giới thật nằm ở cơ sở dữ liệu
 * — bài pgTAP S-06 ("Thủ quỹ đọc `students` trả 0 dòng") **vẫn xanh** sau đợt này.
 */
export function readsFeeDirectory(role: AppRole | null): boolean {
  return role === "treasurer";
}
