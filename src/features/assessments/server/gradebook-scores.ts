import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type GradebookScore = Pick<
  Database["public"]["Tables"]["assessment_scores"]["Row"],
  "assessment_id" | "enrollment_id" | "score" | "system_suggested_score" | "is_manual_override" | "note"
>;

/** Include archived columns when counting scores, without truncating large class registers. */
export async function readGradebookScores(supabase: SupabaseClient<Database>, classId: string) {
  const pageSize = 1000;
  const data: GradebookScore[] = [];
  for (let offset = 0; ; offset += pageSize) {
    const result = await supabase
      .from("assessment_scores")
      .select("assessment_id, enrollment_id, score, system_suggested_score, is_manual_override, note")
      .eq("class_id", classId)
      .order("id", { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (result.error) throw result.error;
    data.push(...result.data);
    if (result.data.length < pageSize) return { data };
  }
}
