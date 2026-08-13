import type { AppAudience, AppRole, AppScopeKind } from "@/lib/permissions/roles";

export interface AuthContext {
  userId: string;
  profileId: string;
  username: string;
  displayName: string;
  accountStatus: "active" | "locked" | "disabled";
  mustChangePassword: boolean;
  role: AppRole | null;
  audience: AppAudience | null;
  scopeKind: AppScopeKind | null;
  academicYearId: string | null;
  sectorId: string | null;
  classId: string | null;
  /**
   * D-25 / M13-A — tài khoản nhân sự có đồng thời một hồ sơ người giám hộ.
   *
   * Vai trò chính của họ vẫn là nhân sự, nhưng cờ này cho phép vỏ hiện đúng
   * mục "Con của tôi" mà không gửi id người giám hộ hay id của con xuống
   * trình duyệt.
   */
  hasGuardianProfile?: boolean;
}

/**
 * Năm trường mà **vỏ ứng dụng** thật sự đọc — M14 NC-5 + M13-A/D-25.
 *
 * `AppShell` là client component, nên mọi thứ truyền vào nó đều được nối tiếp
 * xuống trình duyệt ở **mọi** trang. Bản cũ truyền nguyên `AuthContext` 12
 * trường: `userId`, `profileId`, `accountStatus`, `academicYearId`, `sectorId`,
 * `classId` đi theo mà vỏ không dùng đến một cái nào.
 *
 * Không phải lỗ hổng — dữ liệu đó là của chính người đang đăng nhập, không phải
 * của người khác. Nhưng máy phòng học là máy dùng chung, và thứ không cần gửi
 * thì không gửi.
 */
export interface ShellViewer {
  displayName: string;
  role: AppRole | null;
  audience: AppAudience | null;
  scopeKind: AppScopeKind | null;
  /** Optional để các caller/test cũ mặc định an toàn là `false`. */
  hasGuardianProfile?: boolean;
}

export function toShellViewer(context: AuthContext): ShellViewer {
  return {
    displayName: context.displayName,
    role: context.role,
    audience: context.audience,
    scopeKind: context.scopeKind,
    hasGuardianProfile: context.hasGuardianProfile ?? false,
  };
}
