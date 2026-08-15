import { RouteLoadingSignal } from "@/components/loading/route-loading-signal";
import { LoadingState } from "@/components/shared/loading-state";

/**
 * Màn hình chờ cho các route ngoài vỏ ứng dụng (đăng nhập, đổi mật khẩu…).
 *
 * `RouteLoadingSignal` ở đây thường là lệnh rỗng: `loading.tsx` cấp này thay chỗ
 * cho **cả** layout bên dưới, nên `LoadingProvider` chưa mount và hook trả về
 * API rỗng (đúng thiết kế — xem ghi chú "KHÔNG ném lỗi khi thiếu provider").
 * Vẫn để nó ở đây cho hai tệp `loading.tsx` cùng một khuôn, và để lúc nào có
 * provider bao ngoài thì nó tự chạy.
 */
export default function Loading() {
  return (
    <>
      <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6">
        <div className="w-full"><LoadingState label="Đang tải trang…" /></div>
      </main>
      <RouteLoadingSignal />
    </>
  );
}
