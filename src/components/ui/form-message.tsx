import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Dòng thông báo dưới ô nhập — docs/.../09 §6, 05 §3.1.
 *
 * Cơ chế tự đặt `role` theo `tone` là thiết kế TỐT của bản cũ và nằm trong danh
 * sách KHÔNG ĐƯỢC ĐỤNG (09 §11): mở rộng, không thay. Giai đoạn 2B chỉ thêm
 * `tone="info"`, ICON cho từng tone — màu không được là tín hiệu duy nhất
 * (điều cấm thứ 5) — và prop `id`.
 *
 * 🔴 `id` có mặt là để chỗ gọi **truyền thẳng câu lỗi làm children**, thay vì
 * bọc nó trong một `<span id="...">` cho `aria-describedby` trỏ vào. Bọc như vậy
 * làm `children` LUÔN truthy, nên nhánh `if (!children) return null` không bao
 * giờ chạy: mỗi ô nhập mang sẵn một dải lỗi rỗng. Trước Giai đoạn 2B nó vô hình
 * nên không ai thấy; từ khi mục 0.5 thêm icon thì trang đăng nhập hiện **hai
 * tam giác cảnh báo đỏ thường trực**, và trình đọc màn hình đọc "Lỗi:" hai lần
 * ngay khi vừa tải trang — trong khi người dùng chưa gõ gì.
 */

const TONES = {
  danger: { className: "text-danger", Icon: AlertTriangle, srLabel: "Lỗi:" },
  success: { className: "text-success", Icon: CheckCircle2, srLabel: "Thành công:" },
  info: { className: "text-info", Icon: Info, srLabel: "Thông tin:" },
  muted: { className: "text-ink-muted", Icon: null, srLabel: "" },
} as const;

export type FormMessageTone = keyof typeof TONES;

export function FormMessage({
  children,
  className,
  tone = "danger",
  id,
}: {
  children?: React.ReactNode;
  className?: string;
  tone?: FormMessageTone;
  /** Đích của `aria-describedby` ở ô nhập tương ứng. */
  id?: string;
}) {
  if (!children) return null;

  const { className: toneClassName, Icon, srLabel } = TONES[tone];

  return (
    <p
      id={id}
      className={cn("flex items-start gap-1.5 text-sm", toneClassName, className)}
      role={tone === "danger" ? "alert" : "status"}
    >
      {Icon ? (
        <Icon className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
      ) : null}
      {srLabel ? <span className="sr-only">{srLabel}</span> : null}
      <span>{children}</span>
    </p>
  );
}
