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
   * 🔴 P3-PERF-001 — ĐÃ THỬ `getSession()` VÀ ĐÃ TRẢ LẠI. Đừng "tối ưu" lại.
   *
   * Ý tưởng nghe rất hợp lý: `getUser()` gọi mạng **mọi lần**, kể cả khi token
   * còn hạn, nên nó là một trong 15–19 lượt đi–về Supabase của mỗi lần vào
   * trang; `getSession()` giải mã token tại chỗ và chỉ gọi mạng khi sắp hết
   * hạn. Đo bằng log Kong: đúng là bớt được một lượt.
   *
   * **Nhưng nó làm hỏng thứ khác, và đo được:** `attendance.spec.ts:517` (nút
   * "Tiếp quản" của buổi đã chốt) chuyển từ ổn định sang bấp bênh —
   * `getSession()`: **2/4 xanh**, hai lượt đỏ chạm trần 3 phút, lượt xanh mất
   * tới 31 giây; `getUser()`: **4/4 xanh**, cả bốn trong 6,7–8,6 giây. Nút kẹt
   * ở `disabled`, tức `pending` của Server Action không bao giờ hạ.
   *
   * Cơ chế chính xác thì **chưa truy ra** và phải ghi đúng như vậy. Giả thuyết
   * mạnh nhất: `getUser()` buộc phiên được đọc–kiểm–ghi lại trọn vẹn ở
   * middleware, nên Server Action đi sau luôn nhận đúng bộ cookie đã ổn định;
   * `getSession()` bỏ qua bước đó khi token còn hạn, và trong lượt xoay token
   * có một khoảng đua.
   *
   * Cái giá của việc trả lại **nay rất nhỏ**: sau khi hàm và cơ sở dữ liệu về
   * cùng vùng Singapore, một vòng đi–về chỉ còn vài mili giây thay vì ~200ms.
   * Đổi một lượt gọi rẻ tiền lấy rủi ro trên đường xác thực là món hời ngược.
   */
  await supabase.auth.getUser();

  return supabaseResponse;
}
