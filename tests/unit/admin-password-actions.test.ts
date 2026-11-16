// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { APP_ROLES, type AppRole } from "@/lib/permissions/roles";
import type { AuthContext } from "@/lib/auth/types";

const mocks = vi.hoisted(() => ({
  guard: vi.fn(),
  admin: vi.fn(),
  userClient: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); } }));
vi.mock("@/lib/auth/guards", () => ({ requireRouteAccess: mocks.guard, requireAuthContext: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.admin }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.userClient }));
vi.mock("@/features/auth/server/passwords", () => ({ generateTemporaryPassword: () => "test2345" }));

import {
  adminDeleteAccount,
  adminResetPassword,
  adminSetAccountStatus,
  adminSetPassword,
  adminUpdateUsername,
  assignPrimaryRole,
} from "@/features/auth/server/actions";

const actorId = "10000000-0000-4000-8000-000000000001";
const targetId = "10000000-0000-4000-8000-000000000002";
const actor: AuthContext = {
  userId: actorId, profileId: actorId, username: "KHANG.NHO", displayName: "Admin test",
  role: "super_admin", accountStatus: "active", mustChangePassword: false,
  audience: "staff", scopeKind: "global", academicYearId: null, sectorId: null, classId: null,
};

function fakeAdmin(targetRole: AppRole = "super_admin") {
  const lookup = vi.fn().mockResolvedValue({ data: {
    id: targetId, username: "MR.DAT", role_assignments: [{ role: targetRole, is_active: true }],
  }, error: null });
  const updateResult = vi.fn().mockResolvedValue({ data: { id: targetId }, error: null });
  const updateFilter = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: updateResult }) });
  const profileUpdate = vi.fn().mockReturnValue({ eq: updateFilter });
  const profiles = {
    select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: lookup }) }),
    update: profileUpdate,
  };
  const audit = vi.fn().mockResolvedValue({ error: null });
  const updateUser = vi.fn().mockResolvedValue({ data: { user: { id: targetId } }, error: null });
  const deleteUser = vi.fn();
  const client = {
    from: vi.fn((table: string) => {
      if (table === "profiles") return profiles;
      if (table === "account_audit_events") return { insert: audit };
      throw new Error(`Unexpected table ${table}`);
    }),
    auth: { admin: { updateUserById: updateUser, deleteUser } },
  };
  mocks.admin.mockReturnValue(client);
  return { lookup, profileUpdate, updateResult, updateFilter, audit, updateUser, deleteUser };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.guard.mockResolvedValue(actor);
});

describe("admin password boundary — direct server actions", () => {
  it.each([...APP_ROLES.filter(role => role !== "super_admin"), null])("rejects actor role %s before service-role access", async (role) => {
    mocks.guard.mockResolvedValue({ ...actor, role });
    await expect(adminResetPassword(targetId)).rejects.toThrow("REDIRECT:/access-denied");
    await expect(adminSetPassword(targetId, "secret1234")).rejects.toThrow("REDIRECT:/access-denied");
    expect(mocks.guard).toHaveBeenCalledWith("/admin");
    expect(mocks.admin).not.toHaveBeenCalled();
  });

  it("preserves expired-session redirect outside the action catch", async () => {
    mocks.guard.mockRejectedValue(new Error("REDIRECT:/login?next=%2Fadmin"));
    await expect(adminResetPassword(targetId)).rejects.toThrow("REDIRECT:/login");
    expect(mocks.admin).not.toHaveBeenCalled();
  });

  it("rejects self reset and manual password changes", async () => {
    expect(await adminResetPassword(actorId)).toMatchObject({ ok: false, code: "CONFLICT" });
    expect(await adminSetPassword(actorId, "secret1234")).toMatchObject({ ok: false, code: "CONFLICT" });
    expect(mocks.admin).not.toHaveBeenCalled();
  });

  it("rejects malformed identifiers before any privileged client is created", async () => {
    expect(await adminResetPassword("not-a-uuid")).toMatchObject({ ok: false });
    expect(mocks.admin).not.toHaveBeenCalled();
  });

  it("rejects missing target profiles without changing credentials", async () => {
    const backend = fakeAdmin();
    backend.lookup.mockResolvedValue({ data: null, error: null });
    expect(await adminResetPassword(targetId)).toMatchObject({ ok: false, code: "RESOURCE_NOT_FOUND" });
    expect(backend.profileUpdate).not.toHaveBeenCalled();
    expect(backend.updateUser).not.toHaveBeenCalled();
  });
});

describe("resetting another administrator", () => {
  it.each(["super_admin", "class_teacher"] as const)("resets %s and requires password change before issuing the temporary password", async (role) => {
    const backend = fakeAdmin(role);
    expect(await adminResetPassword(targetId)).toEqual({ ok: true, data: { temporaryPassword: "test2345" } });
    expect(backend.profileUpdate).toHaveBeenCalledWith({ must_change_password: true });
    expect(backend.updateFilter).toHaveBeenCalledWith("id", targetId);
    expect(backend.updateUser).toHaveBeenCalledWith(targetId, { password: "test2345" });
    expect(backend.updateResult.mock.invocationCallOrder[0]).toBeLessThan(backend.updateUser.mock.invocationCallOrder[0]);
    expect(backend.audit).toHaveBeenCalledWith({
      actor_profile_id: actorId, actor_username: "KHANG.NHO",
      target_profile_id: targetId, target_username: "MR.DAT", action: "reset_password", detail: null,
    });
    expect(JSON.stringify(backend.audit.mock.calls)).not.toContain("test2345");
    expect(mocks.revalidate).toHaveBeenCalledWith("/admin");
  });

  it("allows explicit password setting for another SA with the same safeguards", async () => {
    const backend = fakeAdmin();
    expect(await adminSetPassword(targetId, "explicit123")).toMatchObject({ ok: true });
    expect(backend.updateUser).toHaveBeenCalledWith(targetId, { password: "explicit123" });
    expect(backend.audit).toHaveBeenCalledWith(expect.objectContaining({ action: "set_password", target_profile_id: targetId }));
    expect(JSON.stringify(backend.audit.mock.calls)).not.toContain("explicit123");
  });

  it("rejects invalid explicit passwords without setting the change flag or mutating Auth", async () => {
    const backend = fakeAdmin();
    expect(await adminSetPassword(targetId, "short")).toMatchObject({ ok: false });
    expect(backend.profileUpdate).not.toHaveBeenCalled();
    expect(backend.updateUser).not.toHaveBeenCalled();
  });

  it.each(["reset", "manual"] as const)("does not change Auth when profile update fails (%s)", async (mode) => {
    const backend = fakeAdmin();
    backend.updateResult.mockResolvedValue({ data: null, error: { code: "PGRST116" } });
    const result = mode === "reset" ? await adminResetPassword(targetId) : await adminSetPassword(targetId, "explicit123");
    expect(result).toMatchObject({ ok: false, code: "CONFLICT" });
    expect(backend.updateUser).not.toHaveBeenCalled();
    expect(backend.audit).not.toHaveBeenCalled();
  });

  it("does not reveal a password or record success when Auth rejects the reset", async () => {
    const backend = fakeAdmin();
    backend.updateUser.mockResolvedValue({ data: null, error: { status: 500 } });
    const result = await adminResetPassword(targetId);
    expect(result).toMatchObject({ ok: false, code: "CONFLICT" });
    expect(JSON.stringify(result)).not.toContain("test2345");
    expect(backend.audit).not.toHaveBeenCalled();
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
});

describe("SA password exception does not widen other administrator operations", () => {
  const operations = [
    ["rename", () => adminUpdateUsername(targetId, "NEW.NAME")],
    ["disable", () => adminSetAccountStatus(targetId, "disabled")],
    ["delete", () => adminDeleteAccount(targetId)],
    ["change role", () => assignPrimaryRole({ profileId: targetId, role: "secretary", startsOn: "2026-11-16" })],
  ] as const;

  it.each(operations)("still blocks %s of another SA", async (_name, operation) => {
    const backend = fakeAdmin();
    expect(await operation()).toMatchObject({ ok: false, code: "FORBIDDEN" });
    expect(backend.updateUser).not.toHaveBeenCalled();
    expect(backend.deleteUser).not.toHaveBeenCalled();
    expect(backend.profileUpdate).not.toHaveBeenCalled();
    expect(mocks.userClient).not.toHaveBeenCalled();
  });
});
