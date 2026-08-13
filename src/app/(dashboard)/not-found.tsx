import Link from "next/link";
import { Compass } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Trang "không tìm thấy" **bên trong vỏ ứng dụng** — M14 A-12, AC-C1.
 *
 * Trước đây chỉ có `src/app/not-found.tsx`, tức mọi `notFound()` của trang chi
 * tiết (mở một `/students/<uuid>` đã bị xoá, hoặc gõ nhầm một ký tự trong địa
 * chỉ) đều **thổi bay cả thanh bên lẫn thanh đầu trang**. Người dùng đứng giữa
 * một trang trắng có đúng một nút, mất hết ngữ cảnh mình đang ở đâu — đúng trục
 * C13 "lối thoát" của audit.
 *
 * 🔴 Câu chữ phải TRUNG TÍNH. Trang này cũng là nơi `/parent/children/<id>` của
 * con người khác rơi vào (`04_TO_BE_FLOWS.md`: `notFound()` thay vì "không có
 * quyền", để không lộ sự tồn tại của hồ sơ thiếu nhi — BR-25). Vì thế ba khả
 * năng được nêu cùng nhau và không khả năng nào được xác nhận: không tồn tại /
 * đã bị xoá / không thuộc phạm vi của bạn.
 *
 * Không dùng `EmptyState`: ba loại chuẩn của `09` §9 nói về **dữ liệu rỗng
 * trong một phạm vi**, còn đây là một địa chỉ không dẫn tới đâu.
 */
export default function DashboardNotFound() {
  return (
    <PageContainer>
      <PageHeader
        title="Không tìm thấy trang"
        description="Địa chỉ bạn vừa mở không dẫn tới nội dung nào."
      />
      <Card>
        <CardContent className="flex flex-col items-center gap-4 px-5 py-10 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-surface-muted text-ink-muted">
            <Compass className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
          </span>
          <p className="max-w-lg text-sm text-ink-muted">
            Nội dung có thể chưa từng tồn tại, đã được xoá, hoặc không nằm trong phạm vi bạn
            được phép xem. Nếu bạn mở từ một đường dẫn ai đó gửi, hãy nhờ người gửi kiểm tra lại.
          </p>
          <Link href="/dashboard" className={cn(buttonVariants({ variant: "primary" }))}>
            Về trang chủ
          </Link>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
