import { RouteLoadingOverlay } from "@/components/loading/route-loading-overlay";
import { LoadingState } from "@/components/shared/loading-state";

export default function Loading() {
  return (
    <>
      <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6">
        <div className="w-full"><LoadingState label="Đang tải trang…" /></div>
      </main>
      <RouteLoadingOverlay />
    </>
  );
}
