import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Tiêu đề của một trang nghiệp vụ.
 *
 * 🔴 `<h1>` của trang nằm ở đây (M14 D3.c, `05` §3.2). Bản cũ dùng `<h2>` vì
 * `AppHeader` đang giữ `<h1>` với **đúng chuỗi chữ đó**; nay `AppHeader` hạ
 * xuống `<p>` nên tiêu đề duy nhất và đúng cấp thuộc về trang.
 *
 * Thứ bậc chuẩn của một trang: `h1` ở đây › `h2` cho từng khối › `h3` là
 * `CardTitle` mặc định.
 *
 * `backHref` — M14 đợt C, khuyến nghị B7.1 (AC-B6). Trước đây mỗi trang chi
 * tiết tự đặt một link chữ nhỏ ở góc phải, cỡ chữ và vị trí mỗi nơi một khác,
 * và **không nơi nào đạt ngưỡng vùng chạm 44px**. Nay là một nút chuẩn nằm bên
 * trái tiêu đề, đúng nơi mắt tìm đường lùi.
 */
export function PageHeader({
  title,
  description,
  action,
  backHref,
  backLabel = "Quay lại",
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  /** Địa chỉ trang cha. Bỏ trống ⇒ không hiện nút quay lại. */
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {backHref ? (
          <Link
            href={backHref}
            className="-ml-2 mb-1 inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-ink-muted transition-colors duration-fast hover:bg-surface-muted hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            {backLabel}
          </Link>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {description ? <p className="mt-1 max-w-3xl text-sm text-ink-muted sm:text-base">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
