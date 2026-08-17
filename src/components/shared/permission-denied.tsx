import Link from "next/link";
import { ShieldX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Trang "không có quyền truy cập" — luồng M14 F04, sửa theo `05` §3.2.
 *
 * 🔴 Nay NÓI RÕ VAI TRÒ HIỆN TẠI (AC-C5). Bản cũ chỉ bảo "liên hệ người quản
 * trị hệ thống" mà không cho người dùng thứ gì để mang theo khi gọi điện: quản
 * trị viên hỏi "anh đang đăng nhập bằng vai trò gì" và không ai trả lời được.
 * Với xứ đoàn có 14 vai trò, đó là một cuộc gọi đi vào ngõ cụt.
 *
 * Vai trò là thứ **người dùng vốn đã biết về chính mình**, không phải thông tin
 * nhạy cảm — in ra đây không lộ gì thêm. Cố ý KHÔNG nói route đó cần vai trò
 * nào: điều đó mới là vẽ đường cho người đi dò quyền.
 *
 * `<h1>` chứ không phải `<h2>`: trang này không dùng `PageHeader` nên tiêu đề
 * duy nhất của nó nằm ở đây (M14 D3.c).
 */
export function PermissionDenied({ roleLabel }: { roleLabel?: string }) {
  return (
    <div className="mx-auto flex min-h-72 max-w-lg flex-col items-center justify-center px-4 text-center">
      <span className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-warning-subtle text-warning">
        <ShieldX className="h-6 w-6" aria-hidden="true" />
      </span>
      <p className="text-sm font-semibold uppercase tracking-wider text-warning">Không có quyền truy cập</p>
      <h1 className="mt-2 text-xl font-semibold text-ink">Bạn không thể mở nội dung này</h1>
      {roleLabel ? (
        <p className="mt-2 text-sm text-ink-muted">
          Bạn đang đăng nhập với vai trò <span className="font-semibold text-ink">{roleLabel}</span>.
        </p>
      ) : null}
      <p className="mt-2 text-sm text-ink-muted">
        Nếu bạn cho rằng đây là nhầm lẫn, vui lòng liên hệ người quản trị hệ thống và cho biết vai trò trên.
      </p>
      <Link href="/dashboard" className={cn(buttonVariants({ variant: "primary" }), "mt-5")}>Về trang chủ</Link>
    </div>
  );
}
