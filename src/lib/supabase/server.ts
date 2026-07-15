import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Supabase client cho Server Component / Server Action / Route Handler.
 * Dùng session của người dùng (anon key + cookies), luôn chịu RLS.
 * KHÔNG dùng service role ở đây (docs/04 §7).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Được gọi từ Server Component: bỏ qua an toàn khi middleware
            // đã đảm nhiệm việc refresh session.
          }
        },
      },
    },
  ) as unknown as SupabaseClient<Database, "public">;
}
