import type { ThemeKey } from "./sector-palette";

/**
 * Hợp đồng của theme động — docs/system-workflow-redesign/ui-redesign/
 * 13_THEME_CONTEXT_RESOLUTION_OPTIONS.md §1, đã duyệt ở 10 §5.
 *
 * Nguyên tắc bất di dịch (10 §2): theme là KẾT QUẢ SUY RA từ dữ liệu nghiệp vụ
 * đang có hiệu lực, không phải thuộc tính được lưu. Không có cột màu nào trong
 * database, không có ngành trong JWT/session/local storage.
 */

export type { ThemeKey };

export type ThemeSource =
  | "SELECTED_CHILD_BRANCH" // phụ huynh đang xem một người con cụ thể
  | "CURRENT_RECORD_BRANCH" // đang mở một lớp / buổi / bảng điểm cụ thể
  | "SELECTED_BRANCH_CONTEXT" // người dùng chọn ngành ở bộ chọn ngữ cảnh
  | "PRIMARY_ACTIVE_ASSIGNMENT" // phân công lớp/ngành đang hiệu lực
  | "SOLE_CHILD_BRANCH" // phụ huynh chỉ có một con (hoặc các con cùng ngành)
  | "OWN_ENROLLMENT_BRANCH" // thiếu nhi, ghi danh của chính em
  | "TRAINEE_CLASS_DEFAULT" // lớp Dự trưởng — không thuộc ngành nào
  | "SYSTEM_ADMIN_DEFAULT" // trang toàn hệ thống
  | "NO_ACTIVE_ASSIGNMENT_FALLBACK";

export type FallbackReason =
  | null
  | "NO_CURRENT_ACADEMIC_YEAR"
  | "NO_ACTIVE_ASSIGNMENT"
  | "NOT_ENROLLED_THIS_YEAR"
  | "PROFILE_NOT_LINKED"
  | "NO_LINKED_CHILDREN"
  | "MULTI_BRANCH_NO_SELECTION" // nhiều con khác ngành, chưa chọn
  | "CROSS_BRANCH_SCREEN" // màn hình đa ngành, cố ý dùng mặc định
  | "SELECTED_CONTEXT_INVALID" // cookie trỏ tới ngữ cảnh không còn hiệu lực
  | "SELECTED_CONTEXT_FORBIDDEN" // cookie trỏ tới ngữ cảnh ngoài quyền
  | "ROLE_CLASS_MISMATCH" // role.class_id ≠ class_staff_assignment.class_id
  | "ARCHIVED_YEAR_VIEW"; // đang xem dữ liệu năm cũ

export type ContextType =
  | "PERSONAL"
  | "CLASS"
  | "SECTOR"
  | "CHILD"
  | "CROSS_BRANCH"
  | "SYSTEM";

export type AvailableThemeContext = {
  key: ThemeKey;
  branchId: string | null;
  branchName: string;
  contextType: ContextType;
  /** id của con / lớp / ngành để đặt vào cookie khi người dùng chọn. */
  selectorValue: string;
  /** Nhãn đầy đủ: "Maria Nguyễn Thị A · Ấu 2A". */
  label: string;
};

export interface ThemeContext {
  themeKey: ThemeKey;
  /** `sectors.id` — null với HUYNH_TRUONG mặc định. */
  branchId: string | null;
  /** LUÔN hiển thị được, không bao giờ rỗng. */
  branchName: string;
  sourceOfTheme: ThemeSource;
  academicYearId: string | null;
  academicYearCode: string | null;
  contextType: ContextType;
  fallbackReason: FallbackReason;
  /**
   * Mọi ngữ cảnh người dùng ĐƯỢC PHÉP chuyển sang.
   * Rỗng hoặc 1 phần tử ⇒ KHÔNG hiện bộ chọn.
   * Giữ dạng mảng kể cả khi Q-01 = một lớp, để mở đường sau này (10 §5).
   */
  availableThemeContexts: ReadonlyArray<AvailableThemeContext>;
  /** Đang xem dữ liệu năm học đã lưu trữ. Shell KHÔNG đổi màu (10 §10). */
  isViewingArchivedData: boolean;
}

/**
 * Trang tự khai báo ngữ cảnh của mình; resolver quyết định màu.
 * Resolver KHÔNG giải mã `pathname` — đó chính là lỗi `navigation.ts` đang mắc.
 */
export type ThemeScopeInput =
  | { kind: "PERSONAL" }
  | { kind: "SYSTEM" }
  | { kind: "CROSS_BRANCH" }
  | { kind: "CLASS"; classId: string }
  | { kind: "SECTOR"; sectorId: string }
  | { kind: "CHILD"; studentId: string };

export interface ResolveThemeInput {
  scope: ThemeScopeInput;
  /**
   * Năm học của DỮ LIỆU đang xem, nếu trang cố tình mở dữ liệu năm cũ.
   * Khác năm hiện hành ⇒ `isViewingArchivedData = true` nhưng màu shell GIỮ
   * NGUYÊN (10 §10): màu là tín hiệu "tôi đang làm việc ở đâu", không phải
   * "tôi đang nhìn gì".
   */
  viewingAcademicYearId?: string | null;
}
