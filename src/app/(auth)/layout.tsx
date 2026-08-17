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
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:px-6">
        {/* 🔴 Đợt E V9 — hai đốm này CHƯA TỪNG HIỆN RA, và đó là một lỗi chứ
            không phải một khác biệt về token. Bản cũ viết `bg-secondary/45` và
            `bg-accent/55`; token màu của dự án là `var()` **trần**, nên Tailwind
            không sinh nổi lớp có bổ ngữ độ mờ — grep `.next/static/css` cho
            **0** kết quả với cả `\/45` lẫn `\/55`. Đây là bản sinh đôi của lỗi
            `.bg-background\/95` ở `app-header.tsx`. Dùng token đặc
            `--theme-soft`/`--theme-tint` (đúng hai bậc pastel `09` §4.2 dành
            cho mảng nền lớn) thì lớp có thật và hai đốm mới thật sự vẽ ra. */}
        <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-theme-soft" aria-hidden="true" />
        <div className="absolute -bottom-32 -right-20 h-80 w-80 rounded-full bg-theme-tint" aria-hidden="true" />
        {/* 09 §12 A5 — `rounded-2xl` + `shadow-xl` nằm NGOÀI thang đã duyệt (4 mức
            bo, 2 mức bóng). Về đúng `rounded-xl` (20px, mức dialog) + `shadow-md`. */}
        <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-xl border border-line bg-surface shadow-md lg:grid-cols-[0.9fr_1.1fr]">
          <section className="hidden flex-col justify-between bg-theme-primary p-10 text-theme-on-primary lg:flex">
            <Link href="/login" className="flex items-center gap-3">
              {/* Logo có nền trắng nên đặt trên nền cam phải là một ô trắng bo
                  góc, không phải ảnh trong suốt — khăn quàng trắng của ngành
                  Chiên Con sẽ mất viền nếu khử nền. */}
              <Image src="/logo.png" alt="" width={48} height={48} className="h-12 w-12 rounded-xl bg-surface object-contain p-1" priority />
              <span><span className="block text-xs font-semibold uppercase tracking-widest">Giáo xứ Chợ Quán</span><span className="block text-lg font-semibold">Thiếu Nhi Thánh Thể</span></span>
            </Link>
            <div>
              <p className="text-3xl font-semibold leading-tight">Đồng hành và chăm sóc các em trong một mái nhà chung.</p>
              <p className="mt-4 text-sm leading-6 text-theme-on-primary">Không gian quản lý nội bộ dành cho Giáo xứ Chợ Quán.</p>
            </div>
            <p className="text-xs text-theme-on-primary">Xứ đoàn Thiếu Nhi Thánh Thể · Giáo xứ Chợ Quán</p>
          </section>
          <section className="p-6 sm:p-10 lg:p-12">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <Image src="/logo.png" alt="" width={44} height={44} className="h-11 w-11 rounded-xl object-contain" priority />
              <div><p className="text-xs font-semibold uppercase tracking-wider text-theme-primary">Giáo xứ Chợ Quán</p><p className="font-semibold text-ink">Thiếu Nhi Thánh Thể</p></div>
            </div>
            {children}
          </section>
        </div>
      </main>
    </LoadingProvider>
  );
}
