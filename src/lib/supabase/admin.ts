import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Client SERVICE ROLE — chỉ dùng server-side cho Admin API
 * (tạo/reset/khóa account, tác vụ quản trị). Bỏ qua RLS nên phải tự authorize.
 *
 * `import "server-only"` khiến build THẤT BẠI nếu file này bị bundle cho browser
 * (docs/04 §5, AGENTS §5). Không bao giờ import vào Client Component.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
