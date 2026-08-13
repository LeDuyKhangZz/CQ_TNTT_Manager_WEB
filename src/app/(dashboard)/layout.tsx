import { Suspense } from "react";
import { headers } from "next/headers";
import { AppShell } from "@/components/layout/app-shell";
import { NotificationBell } from "@/components/layout/notification-bell";
import { NotificationButton } from "@/components/layout/notification-button";
import { ContextIndicator } from "@/components/theme/context-indicator";
import { ThemeScope } from "@/components/theme/theme-scope";
import { UnassignedBanner } from "@/components/theme/unassigned-banner";
import { getCurrentAcademicYear } from "@/features/academic-years/server/queries";
import { requireAuthContext } from "@/lib/auth/guards";
import { DEFAULT_AFTER_LOGIN_PATH, REQUEST_PATH_HEADER } from "@/lib/auth/login-redirect";
import { toShellViewer } from "@/lib/auth/types";
import { resolveThemeContext } from "@/lib/theme/resolve-theme-context";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Layout không có cách nào khác để biết mình đang dựng cho route nào, nên bản
  // cũ gọi `requireAuthContext()` không tham số — và `?next=` vì thế **luôn** là
  // `/dashboard`. Mọi deep-link đều mất: link trong thông báo Zalo tới
  // `/attendance/<id>` đổ người dùng về trang tổng quan sau khi đăng nhập.
  // Middleware đặt sẵn đường dẫn thật vào header (M14 A-04).
  const requestPath = (await headers()).get(REQUEST_PATH_HEADER) ?? DEFAULT_AFTER_LOGIN_PATH;
  const authContext = await requireAuthContext(requestPath);
  // Năm học đọc ở máy chủ rồi truyền xuống: thanh đầu trang trước đây in một
  // chuỗi viết cứng, tức là nó nói sai ngay khi xứ đoàn sang năm học khác.
  const academicYear = await getCurrentAcademicYear();

  // 🔴 Vỏ ứng dụng luôn dùng scope `PERSONAL` — M14 đợt C, `10` §3 bước 6.
  //
  // Màu của vỏ là câu trả lời cho *"tôi đang làm việc ở đâu"* (`10` §10), tức
  // ngữ cảnh của chính người đang đăng nhập: ngành của lớp mình phụ trách,
  // ngành của con mình, hoặc trung tính Huynh Trưởng với vai trò toàn cục.
  // Những trang nói về **một bản ghi cụ thể** (`/classes/<id>`, `/reports` đã
  // lọc một ngành — `10` §9) tự khai scope riêng khi module của chúng được
  // thiết kế lại; ở đây không đoán hộ chúng bằng cách giải mã `pathname`, đó
  // đúng là lỗi mà `10` §5 cấm.
  const theme = await resolveThemeContext({ scope: { kind: "PERSONAL" } });

  return (
    <ThemeScope theme={theme} className="min-h-screen">
      <AppShell
        viewer={toShellViewer(authContext)}
        academicYear={academicYear}
        // M14 A-16 — truy vấn đếm chưa đọc KHÔNG còn nằm trên đường tới hạn của
        // mọi điều hướng. Nút chuông đi ra cùng phần vỏ, con số chảy về sau.
        // `AppShell` là client component nhưng vẫn nhận được nút này vì nó được
        // dựng ở đây (server) rồi truyền xuống dưới dạng prop `ReactNode`.
        notificationBell={
          <Suspense fallback={<NotificationButton />}>
            <NotificationBell />
          </Suspense>
        }
        // Hai node dưới đây cũng dựng ở máy chủ vì cả hai đọc `ThemeContext` —
        // truyền nguyên đối tượng đó xuống client là đi ngược lại NC-5.
        contextIndicator={<ContextIndicator theme={theme} />}
        unassignedBanner={<UnassignedBanner theme={theme} className="mx-4 mt-4 sm:mx-6 lg:mx-8" />}
      >
        {children}
      </AppShell>
    </ThemeScope>
  );
}
