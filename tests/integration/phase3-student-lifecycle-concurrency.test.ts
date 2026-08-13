// @vitest-environment node
/**
 * Phase 3 / D-130 two-session regression.
 *
 * Run after `db:reset && seed:dev`:
 *   M03_DB=1 npx vitest run tests/integration/phase3-student-lifecycle-concurrency.test.ts
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

function loadEnvLocal() {
  const file = path.resolve(process.cwd(), ".env.local");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}
loadEnvLocal();

const enabled =
  process.env.M03_DB === "1" &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const describeDb = enabled ? describe : describe.skip;

type Client = SupabaseClient<any, any, any>;

describeDb("Phase 3 · D-130 lifecycle concurrency", () => {
  let first: Client;
  let second: Client;
  let actorId: string;
  let studentId: string;
  let enrollmentId: string;
  let originalGuardianId: string;
  let raceGuardianId: string;

  async function login(): Promise<Client> {
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const domain = process.env.INTERNAL_AUTH_DOMAIN || "choquan.internal";
    const result = await client.auth.signInWithPassword({
      email: `glv901@staff.${domain}`,
      password: "123456",
    });
    if (result.error) throw result.error;
    actorId = result.data.user!.id;
    return client;
  }

  async function restoreActive() {
    const result = await first.rpc("set_student_status", {
      p_student_id: studentId,
      p_status: "active",
      p_close_enrollment: false,
      p_reason: "withdrawn",
      p_ended_on: null,
    });
    expect(result.error).toBeNull();
  }

  beforeAll(async () => {
    first = await login();
    second = await login();

    const student = await first
      .from("students")
      .select("id, guardian_id, enrollments!inner(id, status)")
      .eq("full_name", "Nguyễn Minh An")
      .in("enrollments.status", ["active", "paused"])
      .limit(1)
      .single();
    if (student.error) throw student.error;
    studentId = student.data.id;
    originalGuardianId = student.data.guardian_id;
    enrollmentId = student.data.enrollments[0].id;

    const existingGuardian = await first
      .from("guardians")
      .select("id")
      .eq("phone", "0912888899")
      .maybeSingle();
    if (existingGuardian.error) throw existingGuardian.error;
    if (existingGuardian.data) {
      raceGuardianId = existingGuardian.data.id;
    } else {
      const createdGuardian = await first
        .from("guardians")
        .insert({
          full_name: "Phụ huynh race Phase 3",
          phone: "0912888899",
          status: "active",
          updated_by: actorId,
        })
        .select("id")
        .single();
      if (createdGuardian.error) throw createdGuardian.error;
      raceGuardianId = createdGuardian.data.id;
    }
    await restoreActive();
  });

  afterAll(async () => {
    if (first && studentId) {
      await first
        .from("guardians")
        .update({ status: "active", updated_by: actorId })
        .eq("id", raceGuardianId);
      await first
        .from("students")
        .update({ guardian_id: originalGuardianId, updated_by: actorId })
        .eq("id", studentId);
      await restoreActive();
    }
  });

  it("never commits temporarily_inactive + active under two concurrent sessions", async () => {
    for (let iteration = 0; iteration < 12; iteration += 1) {
      await restoreActive();
      const pause = await first
        .from("enrollments")
        .update({ status: "paused", ended_on: null, updated_by: actorId })
        .eq("id", enrollmentId)
        .select("id")
        .single();
      expect(pause.error).toBeNull();

      await Promise.allSettled([
        first
          .from("students")
          .update({ status: "temporarily_inactive", updated_by: actorId })
          .eq("id", studentId)
          .select("id"),
        second
          .from("enrollments")
          .update({ status: "active", ended_on: null, updated_by: actorId })
          .eq("id", enrollmentId)
          .select("id"),
      ]);

      const state = await first
        .from("students")
        .select("status, enrollments!inner(status)")
        .eq("id", studentId)
        .eq("enrollments.id", enrollmentId)
        .single();
      expect(state.error).toBeNull();
      expect(state.data).not.toBeNull();
      const current = state.data!;
      expect(
        current.status === "temporarily_inactive" &&
          current.enrollments[0].status === "active",
      ).toBe(false);
    }
  }, 60_000);

  it("never commits active student + inactive guardian under two concurrent sessions", async () => {
    for (let iteration = 0; iteration < 12; iteration += 1) {
      const guardianReset = await first
        .from("guardians")
        .update({ status: "active", updated_by: actorId })
        .eq("id", raceGuardianId)
        .select("id")
        .single();
      expect(guardianReset.error).toBeNull();

      const studentReset = await first
        .from("students")
        .update({ guardian_id: originalGuardianId, updated_by: actorId })
        .eq("id", studentId)
        .select("id")
        .single();
      expect(studentReset.error).toBeNull();

      await Promise.allSettled([
        first
          .from("guardians")
          .update({ status: "inactive", updated_by: actorId })
          .eq("id", raceGuardianId)
          .select("id"),
        second
          .from("students")
          .update({ guardian_id: raceGuardianId, updated_by: actorId })
          .eq("id", studentId)
          .select("id"),
      ]);

      const [guardian, student] = await Promise.all([
        first.from("guardians").select("status").eq("id", raceGuardianId).single(),
        first.from("students").select("status, guardian_id").eq("id", studentId).single(),
      ]);
      expect(guardian.error).toBeNull();
      expect(student.error).toBeNull();
      expect(
        guardian.data!.status === "inactive" &&
          student.data!.status === "active" &&
          student.data!.guardian_id === raceGuardianId,
      ).toBe(false);
    }
  }, 60_000);
});
