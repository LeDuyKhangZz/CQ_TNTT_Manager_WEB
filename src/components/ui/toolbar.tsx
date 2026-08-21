import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { SearchInputControl } from "./search-input";

/**
 * Thanh công cụ của trang danh sách — REDESIGN 2C task **R2.2**
 * (`11_DESIGN_SYSTEM` N2, `07_DESKTOP_UX` §2, `03_MODULE_ANALYSIS` M-B).
 *
 * 🔴 Vấn đề nó sinh ra để chữa (`07` §1, đo trên máy thật 1366×768 của giáo xứ):
 * `FilterBar` là một khối **ba tầng** cao ~210px. Cộng header 64 + PageHeader
 * ~90 + đầu thẻ ~70, hàng dữ liệu đầu tiên của `/students` rơi xuống **y≈434**
 * — hơn nửa màn hình đã hết mà chưa thấy một em nào. Toolbar nén cả bộ lọc vào
 * **một hàng 48px**: hàng đầu lên ~y=250, thấy 10-11 hồ sơ thay vì 4.
 *
 * `FilterBar` KHÔNG bị xoá: nó vẫn đúng cho màn lọc phức tạp nhiều ô có nhãn
 * (trang Báo cáo). Toolbar là bản cho **trang danh sách** — `11` N2 ghi rõ hai
 * thứ chia nhau việc như vậy.
 *
 * ## Ba ràng buộc kiến trúc (đối chiếu CODE THẬT trước khi viết)
 *
 * 1. **Tệp này KHÔNG có `"use client"`.** Toolbar là `<form method="get">` thật
 *    — y như `FilterBar` và `Pagination`: đổi bộ lọc là đổi query string, nên
 *    kết quả **chép được, đánh dấu được, bấm Back đúng**, và chạy khi JS chưa
 *    tải (`09` §11 — máy yếu, mạng phòng học kém). Không state, không hook:
 *    `React.useId()` là hook nên cũng không dùng được ở đây; `id` của ô tìm
 *    kiếm suy ra từ `name` (tất định, không lệch giữa máy chủ và trình duyệt).
 *
 * 2. **`trailing` nằm NGOÀI `<form>`.** Chỗ ấy giữ menu "Cột"
 *    (`DataTableColumnToggle`) — một lựa chọn **hiển thị**, không phải một bộ
 *    lọc. Để nó trong form thì các ô tick của menu nằm chung `FormData` với bộ
 *    lọc, và `Enter` khi đang focus trong menu sẽ gửi cả form. Ranh giới đặt
 *    bằng chính thẻ `<form>`, không đặt bằng lời dặn.
 *
 * 3. **`sticky` chỉ áp từ `md` trở lên.** Trên điện thoại `08` §4 đã chốt bộ
 *    lọc đi vào sheet chứ không nằm thường trực; một thanh dính 48px trên màn
 *    360×800 là ăn mất 6% chiều cao còn lại.
 *
 * 🔴 **Sticky của vỏ ứng dụng từng chết im lặng** — xem `TOOLBAR_STICKY_TOP_CLASSNAME`.
 */

/**
 * Khoảng dính của Toolbar: **68px** = `AppHeader` (`min-h-16` = 64px) + dải màu
 * ngành 4px (`h-1`).
 *
 * 🔴 Hai điều phải nhớ cùng lúc, cả hai đều đã đo bằng Chromium chứ không đoán:
 *
 * 1. **`overflow-x: hidden` giết `position: sticky`.** CSS Overflow §3.5: một
 *    trục là `hidden` thì trục kia `visible` **tự tính thành `auto`** ⇒ phần tử
 *    ấy thành vùng cuộn, và sticky bên trong neo vào **vùng cuộn gần nhất** chứ
 *    không neo vào màn hình. Vỏ ứng dụng (`app-shell.tsx`) từng mang đúng lớp
 *    ấy, nên `sticky top-0` của `AppHeader` **không dính** — đo được: cuộn
 *    1200px thì header đi theo tới `top = -1200`. Nay vỏ dùng `.clip-x`
 *    (`overflow-x: clip`) — clip **không** tạo vùng cuộn, sticky sống lại.
 *    Ai đó đặt lại `overflow-x-hidden`/`overflow-hidden` lên một tổ tiên của
 *    trang là thanh này lặng lẽ hết dính, **không lỗi, không cảnh báo**.
 *
 * 2. Con số 68 bám vào chiều cao thật của header. `tests/unit/toolbar-facet-filter.test.tsx`
 *    canh `min-h-16` + `h-1` còn nguyên, nên đổi chiều cao header là bài kiểm đỏ
 *    ngay chứ không phải chờ ai đó nhìn thấy khe hở.
 */
export const TOOLBAR_STICKY_TOP_CLASSNAME = "md:top-[68px]";

export type ToolbarSearch = {
  /** Ví dụ "Tìm theo tên thiếu nhi". Bắt buộc — placeholder không phải nhãn. */
  label: string;
  /** Tham số truy vấn. Mặc định `q`. */
  name?: string;
  defaultValue?: string;
  placeholder?: string;
  /** Ghi đè `id` khi một trang có hai toolbar cùng `name`. */
  id?: string;
};

export type ToolbarProps = {
  /** Nhãn của nhóm lọc cho trình đọc màn hình, ví dụ "Lọc danh sách thiếu nhi". */
  label: string;
  /** Đích form. Mặc định gửi về chính trang hiện tại. */
  action?: string;
  /** Ô tìm kiếm bên trái. Bỏ trống khi trang chỉ lọc bằng facet. */
  search?: ToolbarSearch;
  /** Các `FacetFilter` (và ô lọc khác) đứng cạnh ô tìm kiếm. */
  children?: React.ReactNode;
  /** Slot phải — menu "Cột". **Nằm ngoài `<form>`**, xem ràng buộc 2. */
  trailing?: React.ReactNode;
  /**
   * Tham số cần giữ lại tuy không thuộc bộ lọc (`sort`, `dir`, `size`).
   *
   * 🔴 Form GET **xoá sạch** query string cũ khi gửi — không có mấy ô ẩn này
   * thì mỗi lần lọc là mất luôn thứ tự sắp xếp người dùng vừa chọn. `page` thì
   * cố ý KHÔNG giữ: lọc xong mà còn ở trang 7 của tập kết quả mới là bảng trống.
   */
  keepParams?: Readonly<Record<string, string | undefined>>;
  submitLabel?: string;
  /** Dính dưới header khi cuộn (từ `md`). Mặc định bật — `07` §2. */
  sticky?: boolean;
  stickyTopClassName?: string;
  className?: string;
};

export function Toolbar({
  label,
  action,
  search,
  children,
  trailing,
  keepParams,
  submitLabel = "Lọc",
  sticky = true,
  stickyTopClassName = TOOLBAR_STICKY_TOP_CLASSNAME,
  className,
}: ToolbarProps) {
  const searchName = search?.name ?? "q";
  const searchId = search?.id ?? `toolbar-search-${searchName}`;

  return (
    <div
      data-toolbar="true"
      className={cn(
        "flex flex-wrap items-center gap-2",
        // Nền ĐẶC khi dính: bài học của `AppHeader` (`app-header.tsx`) — token
        // màu là `var()` trần nên Tailwind không sinh nổi bổ ngữ độ mờ, và một
        // thanh dính trong suốt là chữ chồng lên chữ.
        sticky && ["md:sticky md:z-sticky md:bg-page md:py-2", stickyTopClassName],
        className,
      )}
    >
      <form
        method="get"
        action={action}
        className="flex min-w-0 flex-1 flex-wrap items-center gap-2"
      >
        {/* `<fieldset>`/`<legend>` theo `09` §6: không có nó thì trình đọc màn
            hình đọc từng ô rời rạc mà không biết chúng cùng một bộ lọc. Bọc
            hàng flex trong `<div>` con vì `<fieldset>` là phần tử có hành vi
            dựng hình riêng ở vài trình duyệt. */}
        <fieldset className="min-w-0 flex-1 border-0 p-0">
          <legend className="sr-only">{label}</legend>
          <div className="flex flex-wrap items-center gap-2">
            {search ? (
              <div className="min-w-0 flex-1 basis-56 sm:basis-72">
                <label htmlFor={searchId} className="sr-only">
                  {search.label}
                </label>
                <SearchInputControl
                  id={searchId}
                  name={searchName}
                  defaultValue={search.defaultValue}
                  placeholder={search.placeholder}
                />
              </div>
            ) : null}

            {children}

            <Button type="submit" variant="secondary">
              {submitLabel}
            </Button>
          </div>
        </fieldset>

        {keepParams
          ? Object.entries(keepParams)
              .filter(([, value]) => value !== undefined && value !== "")
              .map(([name, value]) => (
                <input key={name} type="hidden" name={name} value={value} />
              ))
          : null}
      </form>

      {trailing ? <div className="flex shrink-0 items-center gap-2">{trailing}</div> : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export type ToolbarSummaryProps = {
  /** Câu tóm tắt, ví dụ `747 hồ sơ · đang lọc "Đang sinh hoạt"`. */
  children: React.ReactNode;
  /** Địa chỉ trang khi bỏ hết bộ lọc. Có thì hiện "Xoá lọc". */
  resetHref?: string;
  resetLabel?: string;
  className?: string;
};

/**
 * Dòng tóm tắt kết quả, đứng giữa Toolbar và bảng — `07` §2.
 *
 * 🔴 Đây là nơi **duy nhất** của "Xoá lọc" ở trang danh sách (D-R8 "một kiểu
 * cho một việc"). `FilterBar` đặt nút ấy trong khối lọc vì khối ấy cao ba tầng;
 * toolbar một hàng thì chỗ đúng của nó là cạnh con số nó vừa làm thay đổi —
 * người dùng đọc "12 hồ sơ" rồi mới nghĩ "trả lại 747 em".
 *
 * Con số phải nói ra **bằng chữ** chứ không chỉ bằng độ dài bảng: đó là cách
 * duy nhất người dùng biết bảng đang bị lọc chứ không phải hệ thống mất dữ liệu
 * (bài học D-108 của M04).
 */
export function ToolbarSummary({
  children,
  resetHref,
  resetLabel = "Xoá lọc",
  className,
}: ToolbarSummaryProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm text-ink-muted",
        className,
      )}
    >
      <p className="min-w-0">{children}</p>
      {resetHref ? (
        <Link
          href={resetHref}
          className="-my-2 inline-flex min-h-11 items-center rounded-md px-2 font-medium text-theme-accent-text hover:bg-surface-muted"
        >
          {resetLabel}
        </Link>
      ) : null}
    </div>
  );
}
