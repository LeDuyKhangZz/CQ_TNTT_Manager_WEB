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
}
