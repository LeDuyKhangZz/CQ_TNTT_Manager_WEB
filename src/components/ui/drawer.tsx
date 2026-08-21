import * as React from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DrawerBehavior } from "./drawer-behavior";

/**
 * Panel trượt từ mép phải cho form **một thực thể** — REDESIGN 2C task **R2.4**
 * (`11_DESIGN_SYSTEM` N6, `07_DESKTOP_UX` §6, `08_MOBILE_UX` §4, D-R7).
 *
 * ## 1. Vì sao mở bằng URL chứ không bằng `useState`
 *
 * `11` N6 và `07` §6 mô tả đường lùi không-JS là "`?new=1` render **trang form
 * riêng**". Đối chiếu code thật thì bản ấy thừa một tầng: nếu **chính drawer**
 * do máy chủ dựng khi URL có `?new=1`, thì lúc JS chưa tải người dùng đã có
 * nguyên cái form ngay trên trang danh sách — không cần trang thứ hai, và
 * không phải nuôi hai bản của cùng một form (bản trong drawer + bản trang
 * riêng lệch nhau là chuyện của thời gian).
 *
 * Lý do thứ hai nặng hơn: **mọi** consumer thật của N6 đều cần dữ liệu dựng ở
 * máy chủ và Server Action —
 *
 *   - R4.2 "Thêm thiếu nhi" 2 bước (giám hộ → em)
 *   - R5.4 "Ghi danh" (tìm-chọn: mỗi lần gõ là một truy vấn máy chủ)
 *   - R7.3 onboard nhân sự 3 bước
 *
 * Bước đang đứng của một wizard **phải sống trong URL** thì mới sống qua được
 * một vòng Server Action, mới share được, mới Back được. Drawer giữ state ở
 * React thì bước 2 sẽ bốc hơi đúng lúc người ta bấm "Lưu và tiếp tục".
 *
 * ## 2. Ranh giới với `Dialog` — một kiểu cho một việc (D-R8)
 *
 * | | `Dialog` (05 §3.3) | `Drawer` (đây) |
 * |---|---|---|
 * | Mở bằng | `useState` ở client | tham số URL, máy chủ dựng |
 * | Dùng cho | xác nhận, form ≤3 field, hộp thoại trong một màn hình đang có state | form một thực thể, wizard nhiều bước, panel cần share/Back |
 * | Hình dáng | hộp giữa màn (mobile: dán đáy) | panel phải (mobile: full-screen sheet) |
 *
 * 25 chỗ đang dùng `ConfirmDialog` và 5 chỗ dùng `Dialog` **không đụng tới**.
 * `Dialog` vẫn là câu trả lời đúng cho "hỏi rồi làm ngay tại chỗ".
 *
 * ## 3. Ba đường đóng, cùng một luật `replace`
 *
 * Nút ✕, lớp phủ, và `Escape` đều đưa về `closeHref` bằng **`replace`** chứ
 * không `push`. Nếu `push`: mở drawer (một mục lịch sử) → `Escape` (mục thứ
 * hai) → bấm Back thì drawer **mở lại**. Người dùng bấm Back để thoát mà nó
 * quay vào. Với `replace`, lịch sử còn đúng hai mục: trang trước và trang danh
 * sách — Back thoát hẳn, đúng thứ họ vừa yêu cầu.
 *
 * Ngược lại, cú **mở** là `push` bình thường: nhờ vậy Back cũng đóng được
 * drawer, kể cả khi JS chưa tải.
 *
 * ## 4. Không có slot `footer` — cố ý
 *
 * Bài học R2.2 (slot `trailing` của `Toolbar` phải nằm NGOÀI `<form>`) lần này
 * lật ngược: một slot `footer` do khung dựng sẽ nằm **ngoài** `<form>` của
 * consumer, và một nút "Lưu" ngoài form là **nút chết** — bấm không có gì xảy
 * ra, không có lỗi nào để lần ra. Nên khung không nhận nút: `children` là form
 * thật và nó tự mang hàng nút của nó. Muốn hàng nút dính đáy thì đặt
 * `sticky bottom-0` bên trong chính form ấy.
 *
 * ## 5. Không có hoạt ảnh ĐÓNG
 *
 * `10` §3 xin "drawer/sheet 200ms ease-out, exit nhanh hơn enter". Vào có
 * (`.drawer-enter`); ra thì **tức thì**, vì đóng là một cú điều hướng: panel
 * biến mất cùng lúc trang mới về, không có khoảnh khắc nào để React giữ nó lại
 * mà chạy hoạt ảnh. "Exit nhanh hơn enter" vẫn đúng theo nghĩa đen. Đổi lấy
 * điều đó là toàn bộ mục 1 — đáng.
 *
 * ## 6. Lớp phủ là `<a aria-hidden tabIndex={-1}>`
 *
 * Luật của `modal-behavior.ts` là "lớp phủ phải là `div aria-hidden`, KHÔNG
 * phải `<button>`" — lý do của luật ấy là trình đọc màn hình không được gặp
 * "một cái nút khổng lồ" chen giữa header và nội dung. Một `<a>` mang
 * `aria-hidden` + `tabIndex={-1}` thoả đúng lý do đó (cây a11y không thấy,
 * bàn phím không tới), mà lại đóng được **khi JS chưa tải** — thứ một `<div>`
 * + `onClick` không làm được. Nút ✕ trong panel mới là đường đóng chính thức
 * của bàn phím và trình đọc màn hình.
 */

/** `id` của panel. Cố định được vì cùng lúc chỉ có một drawer mở (nó là modal). */
export const DRAWER_PANEL_ID = "drawer-panel";

/**
 * Bề rộng panel — `07` §6 (480-560px desktop), `08` §7 (tablet 400px),
 * `08` §4 (mobile full-screen sheet).
 */
export const DRAWER_PANEL_WIDTH_CLASSNAME = "w-full md:w-[400px] lg:w-[520px]";

export type DrawerProps = {
  /** Trang tự tính từ `searchParams`, ví dụ `searchParams.new === "1"`. */
  open: boolean;
  /** Tiêu đề nhìn thấy được, cũng là `aria-labelledby` của panel. */
  title: string;
  /**
   * Địa chỉ khi đóng — URL hiện tại đã gỡ tham số mở drawer. Dựng bằng
   * `drawerHref` để không đánh rơi bộ lọc đang áp.
   */
  closeHref: string;
  description?: React.ReactNode;
  /** Nội dung — thường là **một `<form>`** kèm hàng nút của chính nó (mục 4). */
  children: React.ReactNode;
  closeLabel?: string;
  /** Đổi khi một trang cần hai drawer khai báo sẵn (hiếm). */
  id?: string;
  panelClassName?: string;
};

export function Drawer({
  open,
  title,
  closeHref,
  description,
  children,
  closeLabel = "Đóng",
  id = DRAWER_PANEL_ID,
  panelClassName,
}: DrawerProps) {
  if (!open) return null;

  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;

  return (
    <div className="fixed inset-0 z-drawer flex justify-end">
      {/* Mục 6. */}
      <Link
        href={closeHref}
        replace
        aria-hidden="true"
        tabIndex={-1}
        className="drawer-overlay-enter absolute inset-0 bg-overlay"
      />

      <div
        id={id}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          "drawer-enter relative flex h-full flex-col bg-surface shadow-md outline-none",
          DRAWER_PANEL_WIDTH_CLASSNAME,
          panelClassName,
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          <div className="min-w-0 py-1">
            <h2 id={titleId} className="text-lg font-semibold text-ink">
              {title}
            </h2>
            {description ? (
              <div id={descriptionId} className="mt-1 text-sm text-ink-muted">
                {description}
              </div>
            ) : null}
          </div>

          {/* Link chứ không phải `<Button>`: đóng là điều hướng, và nó phải
              đóng được khi JS chưa tải. Vùng chạm 44px (09 §10 điều 7). */}
          <Link
            href={closeHref}
            replace
            aria-label={closeLabel}
            className={cn(
              "-mr-2 inline-flex h-11 min-h-11 w-11 shrink-0 items-center justify-center rounded-md",
              "text-ink transition-colors duration-fast ease-out hover:bg-surface-muted",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring focus-visible:ring-offset-2",
            )}
          >
            <X className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          </Link>
        </div>

        {/* Vùng cuộn là ĐÂY, không phải cả panel: header ở trên đứng yên mà
            không cần `sticky` — mà `sticky` trong một panel `overflow-y-auto`
            là đúng cái bẫy R2.2 vừa gỡ ở vỏ ứng dụng. */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">{children}</div>
      </div>

      {/* Đặt NGOÀI panel: nó không dựng gì cả, nhưng nằm trong panel là thêm
          một nút vào danh sách phần tử bấm được mà bẫy focus phải đi qua. */}
      <DrawerBehavior panelId={id} closeHref={closeHref} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/** Kiểu `searchParams` mà Next 15 đưa cho trang, hoặc `URLSearchParams` sẵn có. */
export type DrawerSearchParams =
  | URLSearchParams
  | Readonly<Record<string, string | string[] | undefined>>;

/**
 * Dựng địa chỉ mở/đóng drawer, **giữ nguyên mọi tham số khác của URL**.
 *
 * 🔴 Lý do nó tồn tại thay vì để mỗi trang tự ghép chuỗi: `href="?new=1"` xoá
 * sạch query hiện tại. Người dùng lọc còn 12 em, bấm "Thêm thiếu nhi", đóng
 * drawer ra — 747 em quay lại và bộ lọc biến mất. Cùng một họ lỗi với
 * `keepParams` của `Toolbar` (R2.2).
 *
 * 🔴 Và nó phải giữ được **tham số lặp**: `FacetFilter` gửi `?sector=au&sector=thieu`.
 * Bộ dựng nào gộp mảng thành một giá trị là âm thầm ăn mất một ngành.
 *
 * `null` = gỡ hẳn tham số (mọi lần xuất hiện). Chuỗi = đặt một giá trị.
 */
export function drawerHref(
  pathname: string,
  searchParams: DrawerSearchParams,
  changes: Readonly<Record<string, string | null>>,
): string {
  const params = new URLSearchParams();

  if (searchParams instanceof URLSearchParams) {
    searchParams.forEach((value, key) => params.append(key, value));
  } else {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value === undefined) continue;
      if (Array.isArray(value)) {
        for (const item of value) params.append(key, item);
      } else {
        params.append(key, value);
      }
    }
  }

  for (const [key, value] of Object.entries(changes)) {
    // `delete` gỡ MỌI lần xuất hiện; `set` thay lần đầu và gỡ phần còn lại,
    // giữ nguyên vị trí — nên thứ tự tham số trên thanh địa chỉ không nhảy.
    if (value === null) params.delete(key);
    else params.set(key, value);
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
