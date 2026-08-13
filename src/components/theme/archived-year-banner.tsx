import { Alert } from "@/components/ui/alert";
import type { ThemeContext } from "@/lib/theme/types";

/**
 * Dải "đang xem dữ liệu năm học đã lưu trữ" — 10 §10, 15 §6, 13 §6.
 *
 * Vỏ ứng dụng KHÔNG đổi màu khi xem năm cũ: màu là tín hiệu *"tôi đang làm việc
 * ở đâu"*, không phải *"tôi đang nhìn gì"*. Đổi màu thì người dùng tưởng đã
 * chuyển ngữ cảnh làm việc sang năm cũ và thao tác nhầm. Vì vỏ im lặng nên dải
 * chữ này là thứ DUY NHẤT nói cho họ biết — bỏ nó đi là bỏ luôn cảnh báo.
 *
 * 🔴 Nhãn năm học phải do trang truyền vào. `ThemeContext.academicYearCode` là
 * năm **hiện hành**, không phải năm đang xem — lấy nhầm nó là in ra một con số
 * đúng-về-kỹ-thuật nhưng sai-về-nghĩa ngay giữa câu cảnh báo.
 */
export function ArchivedYearBanner({
  theme,
  academicYearLabel,
  className,
}: {
  theme: Pick<ThemeContext, "isViewingArchivedData">;
  /** Nhãn của năm học ĐANG XEM, ví dụ "2025-2026". Thiếu thì câu bỏ trống chỗ đó. */
  academicYearLabel?: string | null;
  className?: string;
}) {
  if (!theme.isViewingArchivedData) return null;

  return (
    <Alert tone="warning" className={className}>
      {academicYearLabel
        ? `Đang xem dữ liệu năm học ${academicYearLabel} (đã lưu trữ). Không thể chỉnh sửa.`
        : "Đang xem dữ liệu năm học đã lưu trữ. Không thể chỉnh sửa."}
    </Alert>
  );
}
