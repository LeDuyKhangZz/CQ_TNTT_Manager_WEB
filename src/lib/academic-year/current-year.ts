import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type CurrentAcademicYearRow = Pick<Tables<"academic_years">, "id" | "code" | "name">;

/**
 * Năm học hiện hành — **một truy vấn cho cả request**, dùng chung cho mọi phía.
 *
 * 🔴 P3-PERF-001. Trước đây có **hai** hàm cùng hỏi đúng một câu hỏi, mỗi hàm
 * `cache()` riêng nên `cache()` không gộp được chúng lại:
 *   · `features/academic-years/server/queries.ts` → `getCurrentAcademicYear()`
 *     (thanh đầu trang cần cả `name`);
 *   · `lib/theme/resolve-theme-context.ts` → `loadCurrentAcademicYear()`
 *     (chỉ cần `id`, `code`).
 * Đo bằng log của Kong: **mỗi lần vào trang gọi `/rest/v1/academic_years` 2–3
 * lượt** — cùng vị ngữ `status = 'current'`, cùng `maybeSingle()`, chỉ khác danh
 * sách cột. Trên Vercel mỗi lượt là một vòng đi–về qua Thái Bình Dương.
 *
 * Nay cả hai gọi hàm này. Cột lấy theo bản **rộng hơn** (`id, code, name`) nên
 * không phía nào mất dữ liệu, và vị ngữ giữ **nguyên văn** — đây là phép gộp
 * thuần, không đổi một hành vi nào.
 *
 * Hàm này KHÔNG gọi guard: chốt chặn là policy `academic_years_select_scope`
 * (D-70). Xem ghi chú dài ở `getCurrentAcademicYear` để biết vì sao.
 */
export const getCurrentAcademicYearRow = cache(
  async (): Promise<CurrentAcademicYearRow | null> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("academic_years")
      .select("id, code, name")
      .eq("status", "current")
      .maybeSingle();
    return data ?? null;
  },
);
