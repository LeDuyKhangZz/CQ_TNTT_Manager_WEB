import { RouteLoadingSignal } from "@/components/loading/route-loading-signal";
import { PageContainer } from "@/components/layout/page-container";
import { LoadingState } from "@/components/shared/loading-state";

/**
 * Màn hình chờ khi chuyển module — kế hoạch 17 Đợt A, sửa lại 2026-08-15.
 *
 * `LoadingState` giữ nguyên: nó nằm trong luồng nội dung nên vỏ ứng dụng không
 * sụp khung trong lúc chờ, và nó là thứ duy nhất còn lại nếu `public/loading/`
 * rỗng.
 *
 * 🔴 Ở đây **không dựng overlay nữa** — chỉ phát tín hiệu cho `LoadingProvider`.
 * Bản cũ dựng overlay riêng, làm một lần chuyển module hiện hiệu ứng **hai lần**,
 * và lần thứ hai luôn ra cùng một ảnh cùng một câu vì nó được Next dựng sẵn từ
 * lúc build. Xem `route-loading-signal.tsx`.
 */
export default function DashboardLoading() {
  return (
    <>
      <PageContainer>
        <LoadingState />
      </PageContainer>
      <RouteLoadingSignal />
    </>
  );
}
