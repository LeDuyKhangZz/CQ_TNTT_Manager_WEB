import { RouteLoadingOverlay } from "@/components/loading/route-loading-overlay";
import { PageContainer } from "@/components/layout/page-container";
import { LoadingState } from "@/components/shared/loading-state";

/**
 * Màn hình chờ khi chuyển module — kế hoạch 17 Đợt A.
 *
 * Giữ nguyên `LoadingState` bên dưới: nó nằm trong luồng nội dung nên vỏ ứng
 * dụng không bị sụp khung trong lúc chờ, và nó là thứ duy nhất còn lại nếu
 * `public/loading/` rỗng. `RouteLoadingOverlay` phủ lên trên và **tự hoãn 1 giây
 * bằng CSS** — chuyển trang nhanh thì không ai thấy nó.
 */
export default function DashboardLoading() {
  return (
    <>
      <PageContainer>
        <LoadingState />
      </PageContainer>
      <RouteLoadingOverlay />
    </>
  );
}
