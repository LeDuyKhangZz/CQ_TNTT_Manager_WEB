import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:px-6">
      <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-secondary/45" aria-hidden="true" />
      <div className="absolute -bottom-32 -right-20 h-80 w-80 rounded-full bg-accent/55" aria-hidden="true" />
      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-card shadow-xl lg:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
          <Link href="/login" className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-card/20 text-sm font-bold">CQ</span>
            <span><span className="block text-xs font-semibold uppercase tracking-widest">Giáo xứ Chợ Quán</span><span className="block text-lg font-semibold">Thiếu Nhi Thánh Thể</span></span>
          </Link>
          <div>
            <p className="text-3xl font-semibold leading-tight">Đồng hành và chăm sóc các em trong một mái nhà chung.</p>
            <p className="mt-4 text-sm leading-6 text-primary-foreground/85">Không gian quản lý nội bộ dành cho Giáo xứ Chợ Quán.</p>
          </div>
          <p className="text-xs text-primary-foreground/75">Giao diện nền tảng · P0-T2</p>
        </section>
        <section className="p-6 sm:p-10 lg:p-12">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">CQ</span>
            <div><p className="text-xs font-semibold uppercase tracking-wider text-primary">Giáo xứ Chợ Quán</p><p className="font-semibold text-foreground">Thiếu Nhi Thánh Thể</p></div>
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}
