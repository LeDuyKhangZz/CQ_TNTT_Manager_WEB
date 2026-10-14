import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { readGradebookScores } from "@/features/assessments/server/gradebook-scores";

vi.mock("server-only", () => ({}));

function fixture(count: number, failAt?: number) {
  const rows = Array.from({ length: count }, (_, index) => ({
    assessment_id: index === count - 1 ? "annual-total" : `archived-${index}`,
    enrollment_id: `enrollment-${index}`,
    score: index === count - 1 ? 8.75 : index === 0 ? null : 5,
    system_suggested_score: null,
    is_manual_override: false,
    note: null,
  }));
  const error = { message: "Later page failed", code: "503" };
  const range = vi.fn(async (start: number, end: number) => start === failAt
    ? { data: null, error }
    : { data: rows.slice(start, end + 1), error: null });
  const order = vi.fn(() => ({ range }));
  const eq = vi.fn(() => ({ order }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  return { client: { from } as unknown as SupabaseClient<Database>, rows, range, eq, order, error };
}

describe("large gradebook score reads", () => {
  it("retains the annual total after more than 2,000 archived scores, and preserves nulls", async () => {
    const f = fixture(2451);
    const result = await readGradebookScores(f.client, "class-a");
    expect(result.data).toEqual(f.rows);
    expect(result.data.at(-1)).toMatchObject({ assessment_id: "annual-total", score: 8.75 });
    expect(result.data[0].score).toBeNull();
    expect(f.eq.mock.calls).toEqual(Array.from({ length: 3 }, () => ["class_id", "class-a"]));
    expect(f.order.mock.calls).toEqual(Array.from({ length: 3 }, () => ["id", { ascending: true }]));
  });

  it("finishes an exact page boundary without duplicating rows", async () => {
    const f = fixture(1000);
    expect((await readGradebookScores(f.client, "class-b")).data).toEqual(f.rows);
    expect(f.range).toHaveBeenCalledTimes(2);
  });

  it("rejects a later-page error instead of returning an incomplete gradebook", async () => {
    const f = fixture(1500, 1000);
    await expect(readGradebookScores(f.client, "class-a")).rejects.toEqual(f.error);
  });
});
