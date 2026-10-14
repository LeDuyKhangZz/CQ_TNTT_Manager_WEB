import Image from "next/image";
import Link from "next/link";
import { LoadingProvider } from "@/components/loading/loading-provider";
import { getLoadingAssets } from "@/lib/loading/assets";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  // Đăng nhập cũng là một thao tác chậm (`17` §3.2): đổi mật khẩu tạm, tài khoản
  // bị khoá, mạng phòng học kém. Không có `ThemeScope` ở đây — màn hình chờ dùng
  // bộ token mặc định HUYNH_TRUONG của `:root`, đúng như phần còn lại của trang.
  const loadingAssets = getLoadingAssets();

  return (
    <LoadingProvider images={loadingAssets.images} verses={loadingAssets.verses}>
      <main className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md">
          <Link href="/login" className="mb-6 flex min-h-11 items-center gap-3">
            <Image src="/logo.png" alt="" width={44} height={44} className="h-11 w-11 shrink-0 object-contain" priority />
            <span>
              <span className="block text-sm text-ink-muted">Giáo xứ Chợ Quán</span>
              <span className="block text-base font-semibold text-ink">Thiếu Nhi Thánh Thể</span>
            </span>
          </Link>
          <section className="rounded-lg border border-line bg-surface p-5 sm:p-6">
            {children}
          </section>
        </div>
      </main>
    </LoadingProvider>
  );
}
