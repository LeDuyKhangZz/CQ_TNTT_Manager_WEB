import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { REQUEST_PATH_HEADER } from "@/lib/auth/login-redirect";
import type { Database } from "@/types/database";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Refresh session Supabase trong middleware để Server Component luôn nhận token
 * hợp lệ. KHÔNG dùng middleware làm lớp phân quyền duy nhất (docs/04 §3);
 * mỗi Server Action/Route vẫn tự authorize.
 *
 * Ngoài ra đặt `x-pathname` để `layout.tsx` biết request này thuộc route nào
 * (M14 A-04). Đây là **truyền ngữ cảnh**, không phải phân quyền — layout dùng nó
 * để dựng `?next=` cho đúng, còn việc cho hay không cho vẫn do guard của trang
 * quyết định.
 */
export async function updateSession(request: NextRequest) {
  /**
   * 🔴 Dựng LẠI header ở mỗi lần gọi, không chụp một lần rồi dùng chung.
   * `request.cookies.set()` trong `setAll` ghi đè header `cookie` của chính
   * `request` — đó là cách token vừa làm mới đi tiếp tới Server Component. Một
   * bản `Headers` chụp trước lúc đó sẽ mang **cookie cũ**, và hậu quả là mỗi
   * lần Supabase xoay token thì request đó thấy phiên hết hạn: người dùng bị
   * đá về `/login` giữa chừng, ngẫu nhiên, rất khó truy.
   *
   * ⚠️ `set`, không phải `append`: người dùng có thể tự gửi kèm `x-pathname`
   * để bơm một chuỗi tuỳ ý vào `?next=`. `set` ghi đè giá trị của họ. Hàng rào
   * thứ hai là `sanitizeNextPath` — chuỗi này vẫn luôn phải đi qua đó.
   */
  const forwardedHeaders = () => {
    const headers = new Headers(request.headers);
    headers.set(REQUEST_PATH_HEADER, `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return headers;
  };

  let supabaseResponse = NextResponse.next({ request: { headers: forwardedHeaders() } });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request: { headers: forwardedHeaders() } });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Làm mới token; không đặt logic phân quyền tại đây.
  await supabase.auth.getUser();

  return supabaseResponse;
}
