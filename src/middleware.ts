import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Nếu chưa cấu hình Supabase (ví dụ chạy trước khi có .env.local),
  // bỏ qua để không làm hỏng mọi route trong quá trình dựng nền.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return;
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    // Bỏ qua static assets, file ảnh và tài nguyên PWA; áp dụng cho phần còn
    // lại. `sw.js`/`offline.html` phải nằm ngoài: chúng là file tĩnh không cần
    // phiên đăng nhập, và service worker được tải cả khi chưa có phiên.
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|offline.html|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
