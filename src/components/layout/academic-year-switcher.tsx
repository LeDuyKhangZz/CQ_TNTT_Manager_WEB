import { CalendarDays } from "lucide-react";
import { Dropdown, DropdownLink } from "@/components/ui/dropdown";
import { cn } from "@/lib/utils";

/**
 * Năm học đang làm việc, trên thanh đầu trang — 13 §6, 05 §3.2.
 *
 * Bản cũ là một **nút chết**: `disabled`, chuỗi "Năm học 2026–2027" viết cứng
 * trong mã nguồn, và `hidden sm:flex` nên điện thoại không thấy gì. Nó nói sai
 * ngay khi xứ đoàn sang năm học khác, và nói sai ở chỗ nguy hiểm nhất — người
 * dùng lấy con số này để tin rằng mình đang ghi vào đúng năm.
 *
 * Nay: **hiện năm thật** lấy từ `academic_years` (trạng thái `current`), hiện ở
 * **mọi cỡ màn hình**, và chỉ trở thành bộ chọn khi có năm khác **kèm địa chỉ
 * để đi tới**. Hệ thống hiện chưa có luồng xem dữ liệu năm cũ (M02-F09), nên
 * mặc định nó là một nhãn tĩnh — thà một dòng chữ đúng còn hơn một bộ chọn dẫn
 * tới trang không tồn tại.
 *
 * ⚠️ Không dùng token ngành ở đây. Thanh năm học không nằm trong 12 nơi được
 * phép dùng `--theme-*` (09 §4.4); bản cũ tô icon bằng `text-primary` là nơi
 * thứ mười ba.
 */

export type AcademicYearOption = {
  id: string;
  /** `academic_years.code` — "2026-2027". Dùng cho màn hình hẹp. */
  code: string;
  /** `academic_years.name` — "Năm học 2026-2027". Dùng từ `sm` trở lên. */
  name: string;
  /** Địa chỉ mở dữ liệu của năm đó. **Không có ⇒ năm đó không chọn được.** */
  href?: string;
};

/**
 * Dưới `sm` là chữ trần, từ `sm` mới có khung. Ở 360px thanh đầu trang phải
 * chứa nút menu, breadcrumb, tên trang, chuông và menu tài khoản — thêm một cái
 * khung có viền và đệm 12px hai bên là bóp tên trang xuống còn vài ký tự.
 */
const SHELL =
  "flex min-h-11 items-center gap-2 rounded-md px-1 text-sm font-medium text-ink sm:border sm:border-line sm:bg-surface sm:px-3";

const ICON = "hidden h-4 w-4 shrink-0 sm:block";

function YearLabel({ year }: { year: AcademicYearOption }) {
  return (
    <>
      {/* 360px không đủ chỗ cho cả breadcrumb, tên trang và "Năm học 2026-2027".
          Màn hình hẹp rút gọn còn mã năm; câu đầy đủ dành cho trình đọc màn
          hình để nó không đọc trống trơn "2026-2027". */}
      <span className="sm:hidden">
        <span className="sr-only">Năm học hiện hành: </span>
        {year.code}
      </span>
      <span className="hidden sm:inline">{year.name}</span>
    </>
  );
}

export function AcademicYearSwitcher({
  current,
  others = [],
  className,
}: {
  /** Năm học `current`. `null` khi chưa đặt năm nào — nói thẳng, không bịa. */
  current: AcademicYearOption | null;
  /** Các năm khác. Chỉ năm có `href` mới hiện ra để chọn. */
  others?: readonly AcademicYearOption[];
  className?: string;
}) {
  if (!current) {
    return (
      <p className={cn(SHELL, "text-ink-muted", className)}>
        <CalendarDays className={ICON} strokeWidth={1.75} aria-hidden="true" />
        <span>Chưa đặt năm học</span>
      </p>
    );
  }

  const selectable = others.filter(
    (year): year is AcademicYearOption & { href: string } => Boolean(year.href),
  );

  if (selectable.length === 0) {
    return (
      <p className={cn(SHELL, className)}>
        <CalendarDays className={ICON} strokeWidth={1.75} aria-hidden="true" />
        <YearLabel year={current} />
      </p>
    );
  }

  return (
    <Dropdown
      className={className}
      ariaLabel="Chọn năm học"
      triggerClassName={SHELL}
      label={
        <>
          <CalendarDays className={ICON} strokeWidth={1.75} aria-hidden="true" />
          <YearLabel year={current} />
        </>
      }
    >
      {/* Năm hiện hành KHÔNG phải một mục bấm được: nó là chỗ đang đứng, và một
          `<a href="#">` trong menu là cái bẫy đưa người dùng bàn phím về đầu
          trang. Nó xuất hiện ở đây chỉ để menu tự nói ra mình đang ở đâu. */}
      <p className="px-3 py-2 text-2xs text-ink-muted">
        Đang xem: <span className="font-medium text-ink">{current.name}</span>
      </p>

      {selectable.map((year) => (
        <DropdownLink key={year.id} href={year.href}>
          {year.name}
        </DropdownLink>
      ))}
    </Dropdown>
  );
}
