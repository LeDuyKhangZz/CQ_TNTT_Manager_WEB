import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { canManageAccounts } from "@/features/auth/permissions";

describe("identity security boundaries", () => {
  it("reserves account administration for super admin", () => {
    expect(canManageAccounts("super_admin")).toBe(true);
    expect(canManageAccounts("group_leader")).toBe(false);
    expect(canManageAccounts("secretary")).toBe(false);
    expect(canManageAccounts(null)).toBe(false);
  });

  it("rejects invalid UUID inputs before a query", () => {
    expect(z.string().uuid().safeParse("not-a-uuid").success).toBe(false);
  });

  it("keeps service role in a server-only module", () => {
    const adminSource = readFileSync(resolve(process.cwd(), "src/lib/supabase/admin.ts"), "utf8");
    const browserSource = readFileSync(resolve(process.cwd(), "src/lib/supabase/client.ts"), "utf8");
    expect(adminSource).toContain('import "server-only"');
    expect(adminSource).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(browserSource).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(browserSource).not.toContain("@/lib/supabase/admin");
  });
});
