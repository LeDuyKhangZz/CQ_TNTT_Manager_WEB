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

  /**
   * Làm mới token; không đặt logic phân quyền tại đây.
   *
   * 🔴 P3-PERF-001 — `getSession()`, KHÔNG phải `getUser()`, và lý do phải đọc
   * kỹ trước khi ai đó "sửa lại cho đúng tài liệu Supabase":
   *
   * `getUser()` gọi thẳng `GET /auth/v1/user` **mọi lần**, kể cả khi token còn
   * hạn — đo bằng log Kong thì đó là một trong 15–19 lượt đi–về Supabase của
   * mỗi lần vào trang, và middleware chạy cho **cả** lượt tải trang lẫn lượt
   * lấy payload RSC. `getSession()` giải mã token trong cookie tại chỗ và chỉ
   * gọi mạng khi token **sắp hết hạn** (lúc đó nó gọi `/auth/v1/token` để xoay,
   * rồi `setAll` ở trên ghi cookie mới) — tức đúng và chỉ đúng việc hàm này
   * sinh ra để làm.
   *
   * Vì sao KHÔNG mất an toàn: kết quả ở đây **bị bỏ đi**, không một quyết định
   * cho–hay–không–cho nào đọc nó (đúng như dòng ghi chú ngay trên và docs/04
   * §3). Người gác cổng thật vẫn là `getUser()` trong `getAuthContext()` — chỗ
   * đó hỏi thẳng máy chủ Auth và giữ nguyên. Token giả mạo hay đã thu hồi vẫn
   * chết ở đó, y như trước.
   *
   * ⚠️ Không được đọc `data.session.user` từ đây: auth-js bọc thuộc tính ấy
   * bằng một proxy cảnh báo, và cảnh báo ấy đúng — đó là dữ liệu chưa xác minh.
   */
  await supabase.auth.getSession();

  return supabaseResponse;
}
