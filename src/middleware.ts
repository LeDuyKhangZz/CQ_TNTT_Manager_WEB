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
    // Bỏ qua static assets và file ảnh; áp dụng cho phần còn lại.
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
