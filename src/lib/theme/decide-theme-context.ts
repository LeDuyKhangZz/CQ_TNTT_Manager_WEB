import { isUuid } from "./child-selection";
import {
  FALLBACK_BRANCH_NAME,
  FALLBACK_THEME_KEY,
  type ThemeKey,
} from "./sector-palette";
import type {
  AvailableThemeContext,
  ContextType,
  FallbackReason,
  ThemeContext,
  ThemeSource,
} from "./types";

/**
 * QUYẾT ĐỊNH THEME — thứ tự ưu tiên R3 đã duyệt (10 §3).
 *
 * Hàm này THUẦN: nhận dữ liệu đã tra sẵn, không chạm database, không đọc
 * cookie, không đọc `pathname`. Toàn bộ 30 unit test bắn thẳng vào đây.
 * Phần truy vấn nằm ở `resolve-theme-context.ts`.
 *
 * Bảo đảm tất định (10 §3): nhiều ứng viên mà không có tiêu chí chọn ⇒ KHÔNG
 * chọn, trả HUYNH_TRUONG. Thà trung tính còn hơn đoán sai.
 */

export type BranchRef = {
  /** `sectors.id`. */
  id: string;
  /** `sectors.name` — "Ấu Nhi". */
  name: string;
  themeKey: ThemeKey;
};

export type ClassFact = {
  classId: string;
  className: string;
  /** `classes.class_kind = 'trainee'` — lớp Dự trưởng không thuộc ngành nào. */
  isTrainee: boolean;
  branch: BranchRef | null;
};

export type ChildFact = {
  studentId: string;
  studentName: string;
  /** null khi em chưa được xếp lớp năm nay. */
  enrollment: ClassFact | null;
};

export type StaffFacts = {
  kind: "STAFF";
  /** `role_assignments.sector_id` — Trưởng/Phó ngành. */
  roleSectorBranch: BranchRef | null;
  /** `class_staff_assignments` — phân công công tác THẬT. */
  classAssignment: ClassFact | null;
  /** `role_assignments.class_id` — có thể lệch với dòng trên (lỗi M04-F06). */
  roleClass: ClassFact | null;
  /** Có một vai trò đang hiệu lực. */
  hasActiveRole: boolean;
  /** Vai trò phạm vi toàn hệ thống (Super Admin, Thư ký Xứ đoàn…). */
  hasGlobalRole: boolean;
};

export type ViewerFacts =
  | { kind: "NO_PROFILE" }
  | { kind: "STUDENT"; enrollment: ClassFact | null }
  | {
      kind: "GUARDIAN";
      /** Đã sắp xếp tất định ở tầng truy vấn; hàm này giữ nguyên thứ tự. */
      children: readonly ChildFact[];
      /** Giá trị thô đọc từ cookie — CHƯA kiểm. Hàm này kiểm bước 1 và 3. */
      selectedChildIdFromCookie: string | null;
    }
  | StaffFacts;

export type ScopeFacts =
  | { kind: "SYSTEM" }
  | { kind: "CROSS_BRANCH" }
  | { kind: "CLASS"; class: ClassFact | null }
  | { kind: "SECTOR"; branch: BranchRef | null }
  | { kind: "CHILD"; child: ChildFact | null }
  | { kind: "PERSONAL"; viewer: ViewerFacts };

export type DecideThemeInput = {
  /** null ⇒ chưa đặt năm học hiện hành (bước 0 của R3). */
  currentAcademicYear: { id: string; code: string } | null;
  scope: ScopeFacts;
  /** Trang đang mở dữ liệu của năm học nào (nếu cố tình xem năm cũ). */
  viewingAcademicYearId?: string | null;
};

function neutral(
  source: ThemeSource,
  fallbackReason: FallbackReason,
  contextType: ContextType,
) {
  return {
    themeKey: FALLBACK_THEME_KEY,
    branchId: null as string | null,
    branchName: FALLBACK_BRANCH_NAME,
    sourceOfTheme: source,
    contextType,
    fallbackReason,
  };
}

function fromBranch(
  branch: BranchRef,
  source: ThemeSource,
  contextType: ContextType,
  fallbackReason: FallbackReason = null,
) {
  return {
    themeKey: branch.themeKey,
    branchId: branch.id as string | null,
    branchName: branch.name,
    sourceOfTheme: source,
    contextType,
    fallbackReason,
  };
}

/** Lớp Dự trưởng không có ngành ⇒ luôn về mặc định (10 §8). */
function fromClass(
  klass: ClassFact,
  source: ThemeSource,
  contextType: ContextType,
  fallbackReason: FallbackReason = null,
) {
  if (klass.isTrainee || !klass.branch) {
    return neutral("TRAINEE_CLASS_DEFAULT", fallbackReason, contextType);
  }
  return fromBranch(klass.branch, source, contextType, fallbackReason);
}

function childContexts(
  children: readonly ChildFact[],
): AvailableThemeContext[] {
  return children.map((child) => {
    const branch = child.enrollment?.isTrainee
      ? null
      : (child.enrollment?.branch ?? null);
    const className = child.enrollment?.className;
    return {
      key: branch?.themeKey ?? FALLBACK_THEME_KEY,
      branchId: branch?.id ?? null,
      branchName: branch?.name ?? FALLBACK_BRANCH_NAME,
      contextType: "CHILD" as const,
      selectorValue: child.studentId,
      label: className
        ? `${child.studentName} · ${className}`
        : child.studentName,
    };
  });
}

function decideGuardian(
  children: readonly ChildFact[],
  cookie: string | null,
): ReturnType<typeof neutral> {
  if (children.length === 0) {
    return neutral(
      "NO_ACTIVE_ASSIGNMENT_FALLBACK",
      "NO_LINKED_CHILDREN",
      "PERSONAL",
    );
  }

  const contexts = childContexts(children);
  const distinctKeys = new Set(contexts.map((context) => context.key));

  // Một con, hoặc nhiều con CÙNG ngành ⇒ không cần bộ chọn màu (D-64).
  if (distinctKeys.size === 1) {
    const only = contexts[0];
    if (only.branchId === null) {
      return neutral("SOLE_CHILD_BRANCH", null, "PERSONAL");
    }
    return {
      themeKey: only.key,
      branchId: only.branchId,
      branchName: only.branchName,
      sourceOfTheme: "SOLE_CHILD_BRANCH",
      contextType: "PERSONAL",
      fallbackReason: null,
    };
  }

  // Nhiều con KHÁC ngành: chỉ cookie mới phá được thế hoà.
  if (cookie === null) {
    return neutral(
      "NO_ACTIVE_ASSIGNMENT_FALLBACK",
      "MULTI_BRANCH_NO_SELECTION",
      "PERSONAL",
    );
  }

  // Bước 1 của quy trình xác thực cookie (10 §7): đúng dạng UUID?
  // Dùng CHUNG luật với `ChildSwitcher` (`child-selection.ts`) — hai bản sao
  // lệch nhau là bộ chọn ghi được thứ resolver vứt đi, im lặng.
  if (!isUuid(cookie)) {
    return neutral(
      "NO_ACTIVE_ASSIGNMENT_FALLBACK",
      "SELECTED_CONTEXT_INVALID",
      "PERSONAL",
    );
  }

  // Bước 3: người dùng CÓ QUYỀN với ngữ cảnh đó? Danh sách `children` đã đi qua
  // RLS — id không nằm trong đó là ngoài quyền. Sửa cookie thành id con người
  // khác KHÔNG được lộ gì; RLS vẫn là chốt chặn cuối.
  const selected = contexts.find((context) => context.selectorValue === cookie);
  if (!selected) {
    return neutral(
      "NO_ACTIVE_ASSIGNMENT_FALLBACK",
      "SELECTED_CONTEXT_FORBIDDEN",
      "PERSONAL",
    );
  }

  if (selected.branchId === null) {
    return neutral("SELECTED_CHILD_BRANCH", null, "PERSONAL");
  }

  return {
    themeKey: selected.key,
    branchId: selected.branchId,
    branchName: selected.branchName,
    sourceOfTheme: "SELECTED_CHILD_BRANCH",
    contextType: "PERSONAL",
    fallbackReason: null,
  };
}

function decideStaff(staff: StaffFacts): ReturnType<typeof neutral> {
  // Lệch dữ liệu M04-F06: lấy phân công công tác THẬT, ghi cảnh báo (10 §8).
  const mismatch: FallbackReason =
    staff.classAssignment &&
    staff.roleClass &&
    staff.roleClass.classId !== staff.classAssignment.classId
      ? "ROLE_CLASS_MISMATCH"
      : null;

  if (staff.roleSectorBranch) {
    return fromBranch(
      staff.roleSectorBranch,
      "PRIMARY_ACTIVE_ASSIGNMENT",
      "PERSONAL",
      mismatch,
    );
  }

  if (staff.classAssignment) {
    return fromClass(
      staff.classAssignment,
      "PRIMARY_ACTIVE_ASSIGNMENT",
      "PERSONAL",
      mismatch,
    );
  }

  if (staff.roleClass) {
    return fromClass(staff.roleClass, "PRIMARY_ACTIVE_ASSIGNMENT", "PERSONAL");
  }

  if (staff.hasGlobalRole) {
    return neutral("SYSTEM_ADMIN_DEFAULT", null, "PERSONAL");
  }

  return neutral(
    "NO_ACTIVE_ASSIGNMENT_FALLBACK",
    "NO_ACTIVE_ASSIGNMENT",
    "PERSONAL",
  );
}

function decidePersonal(viewer: ViewerFacts): ReturnType<typeof neutral> {
  switch (viewer.kind) {
    case "NO_PROFILE":
      return neutral(
        "NO_ACTIVE_ASSIGNMENT_FALLBACK",
        "PROFILE_NOT_LINKED",
        "PERSONAL",
      );

    case "STUDENT":
      if (!viewer.enrollment) {
        return neutral(
          "NO_ACTIVE_ASSIGNMENT_FALLBACK",
          "NOT_ENROLLED_THIS_YEAR",
          "PERSONAL",
        );
      }
      return fromClass(viewer.enrollment, "OWN_ENROLLMENT_BRANCH", "PERSONAL");

    case "GUARDIAN":
      return decideGuardian(viewer.children, viewer.selectedChildIdFromCookie);

    case "STAFF":
      return decideStaff(viewer);
  }
}

export function decideThemeContext(input: DecideThemeInput): ThemeContext {
  const { currentAcademicYear, scope } = input;

  const availableThemeContexts: readonly AvailableThemeContext[] =
    scope.kind === "PERSONAL" && scope.viewer.kind === "GUARDIAN"
      ? childContexts(scope.viewer.children)
      : [];

  // Bước 0 — chưa đặt năm học hiện hành. Mọi phân công đều vô nghĩa.
  if (!currentAcademicYear) {
    return {
      ...neutral(
        "NO_ACTIVE_ASSIGNMENT_FALLBACK",
        "NO_CURRENT_ACADEMIC_YEAR",
        scope.kind === "PERSONAL" ? "PERSONAL" : scope.kind,
      ),
      academicYearId: null,
      academicYearCode: null,
      availableThemeContexts: [],
      isViewingArchivedData: false,
    };
  }

  const isViewingArchivedData =
    input.viewingAcademicYearId != null &&
    input.viewingAcademicYearId !== currentAcademicYear.id;

  const decided = (() => {
    switch (scope.kind) {
      // Bước 1
      case "SYSTEM":
        return neutral("SYSTEM_ADMIN_DEFAULT", null, "SYSTEM");

      // Bước 2 — màn hình đa ngành. CẤM lấy màu bản ghi đầu tiên (10 §9).
      case "CROSS_BRANCH":
        return neutral(
          "SYSTEM_ADMIN_DEFAULT",
          "CROSS_BRANCH_SCREEN",
          "CROSS_BRANCH",
        );

      // Bước 3
      case "CLASS":
        if (!scope.class) {
          return neutral(
            "NO_ACTIVE_ASSIGNMENT_FALLBACK",
            "SELECTED_CONTEXT_INVALID",
            "CLASS",
          );
        }
        return fromClass(scope.class, "CURRENT_RECORD_BRANCH", "CLASS");

      // Bước 4
      case "SECTOR":
        if (!scope.branch) {
          return neutral(
            "NO_ACTIVE_ASSIGNMENT_FALLBACK",
            "SELECTED_CONTEXT_INVALID",
            "SECTOR",
          );
        }
        return fromBranch(scope.branch, "CURRENT_RECORD_BRANCH", "SECTOR");

      // Bước 5
      case "CHILD":
        if (!scope.child?.enrollment) {
          return neutral(
            "NO_ACTIVE_ASSIGNMENT_FALLBACK",
            scope.child ? "NOT_ENROLLED_THIS_YEAR" : "SELECTED_CONTEXT_FORBIDDEN",
            "CHILD",
          );
        }
        return fromClass(
          scope.child.enrollment,
          "SELECTED_CHILD_BRANCH",
          "CHILD",
        );

      // Bước 6
      case "PERSONAL":
        return decidePersonal(scope.viewer);
    }
  })();

  return {
    ...decided,
    academicYearId: currentAcademicYear.id,
    academicYearCode: currentAcademicYear.code,
    // Cờ lưu trữ không được nuốt mất lý do dự phòng đã có.
    fallbackReason:
      decided.fallbackReason ??
      (isViewingArchivedData ? "ARCHIVED_YEAR_VIEW" : null),
    availableThemeContexts,
    isViewingArchivedData,
  };
}
