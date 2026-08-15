"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { inputBaseClassName } from "./input";
import {
  collectSelectOptions,
  edgeEnabledIndex,
  findByTypeAhead,
  nextEnabledIndex,
  type SelectOptionItem,
} from "./select-options";

/**
 * Ô chọn — `05` §3.3 #1, nâng lên listbox tự dựng ở `17` §4 (Đợt B).
 *
 * ## API không đổi một chữ
 *
 * Vẫn nhận `<option>`/`<optgroup>` làm children, vẫn `name`/`value`/
 * `defaultValue`/`onChange`/`disabled`/`required`/`placeholder`, `ref` vẫn trỏ
 * vào một `HTMLSelectElement` thật ⇒ **74 chỗ gọi không phải sửa một dòng nào.**
 *
 * ## Tăng tiến (`09` §12 A1)
 *
 * | Thời điểm | Người dùng thấy |
 * |---|---|
 * | Trước hydration, và khi tắt JS | `<select>` native đã styled — y như bản cũ |
 * | Sau hydration | Mặt tiền tự vẽ + tấm listbox tự vẽ |
 *
 * ## 🔴 Quyết định cài đặt then chốt: `<select>` THẬT vẫn là control duy nhất
 *
 * Bản kế hoạch `17` §4.1 đề nghị thay `<select>` bằng nút `role="combobox"` cộng
 * một `<input type="hidden">`. **Không làm theo**, và lý do phải ghi lại:
 *
 * 1. **A11y.** Một nút `role="combobox"` tự dựng phải tự gánh `aria-expanded`,
 *    `aria-controls`, `aria-activedescendant`, roving focus… — chép lại thứ mà
 *    `<select>` đã làm đúng sẵn, và chép sai thì không ai phát hiện.
 * 2. **Nhãn.** Mọi chỗ gọi đang viết `<Label htmlFor={id}>` + `<Select id={id}>`.
 *    Nếu nút mới cũng mang tên ấy thì trang có **hai** phần tử cùng nhãn; nếu
 *    không mang thì ô chọn mất tên. Giữ `<select>` là chỗ duy nhất đeo nhãn thì
 *    không có câu hỏi nào phải trả lời.
 * 3. **Bộ kiểm.** `getByLabel(...).selectOption(...)` xuất hiện **43 lần** trong
 *    13 tệp E2E và `selectOptions` trong **12** tệp unit. Thay bằng nút + hidden
 *    input là bắt cả bộ kiểm ấy viết lại **trong cùng phiên** đang đổi hai
 *    component lớn — mất luôn khả năng phân biệt "đỏ vì hồi quy" với "đỏ vì bài
 *    kiểm chưa viết lại".
 * 4. **`required`, `form.reset()`, ràng buộc gốc** của trình duyệt giữ nguyên,
 *    không phải dựng lại bằng tay.
 *
 * Cách làm: `<select>` nằm **đè lên** mặt tiền, `opacity-0`, nên nó nhận mọi cú
 * bấm và mọi lượt focus. Trình duyệt định mở listbox của hệ điều hành ở
 * `pointerdown` — chặn đúng ở đó rồi tự mở tấm của mình. Bàn phím cũng vào
 * `<select>`, và các phím mở/di chuyển được chặn để lái tấm tự vẽ.
 * Mặt tiền và tấm listbox đều `aria-hidden`: chúng là **hình**, không phải
 * control. Trình đọc màn hình nghe đúng một ô chọn, như trước.
 *
 * Hệ quả đã biết và chấp nhận: lượt `↑`/`↓` khi tấm đang **đóng** vẫn là hành vi
 * native (đổi giá trị tại chỗ) — đúng thói quen người dùng bàn phím, và mặt
 * tiền cập nhật theo ngay.
 */
export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  /** Dòng gợi ý đầu danh sách, không phải giá trị hợp lệ. */
  placeholder?: string;
};

/** Khoảng lặng gõ phím trước khi type-ahead bắt đầu chuỗi mới. */
const TYPE_AHEAD_RESET_MS = 700;
/** Chỗ tối thiểu bên dưới mặt tiền; thiếu thì lật tấm lên trên (`17` §4.2). */
const MIN_SPACE_BELOW = 240;

function useHydrated(): boolean {
  const [hydrated, setHydrated] = React.useState(false);
  // Lượt dựng đầu tiên ở client PHẢI khớp bản máy chủ, nếu không React báo lỗi
  // hydration và vứt cả cây đi dựng lại. Vì vậy cờ chỉ bật ở effect.
  React.useEffect(() => setHydrated(true), []);
  return hydrated;
}

/** Đặt giá trị cho `<select>` thật và bắn `change` để `onChange` của React chạy. */
function commitValue(element: HTMLSelectElement, value: string) {
  // Đi qua setter gốc của prototype: React theo dõi giá trị của ô nhập bằng một
  // "value tracker" riêng, gán thẳng `element.value` có thể bị nó nuốt mất.
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set;
  if (setter) setter.call(element, value);
  else element.value = value;
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      children,
      placeholder,
      onKeyDown,
      onPointerDown,
      onClick,
      onBlur,
      onChange,
      ...props
    },
    forwardedRef,
  ) => {
    const hydrated = useHydrated();
    const selectRef = React.useRef<HTMLSelectElement | null>(null);
    const wrapperRef = React.useRef<HTMLDivElement | null>(null);
    const listRef = React.useRef<HTMLDivElement | null>(null);

    const [open, setOpen] = React.useState(false);
    const [anchor, setAnchor] = React.useState<{
      left: number;
      width: number;
      top: number | null;
      bottom: number | null;
    } | null>(null);
    const [activeIndex, setActiveIndex] = React.useState(-1);
    const [selectedValue, setSelectedValue] = React.useState("");
    const typeAhead = React.useRef({ query: "", at: 0 });
    /**
     * Cú bấm hiện tại có bắt đầu **trên chính ô chọn** không?
     *
     * Đây là dấu hiệu duy nhất tách được hai đường vào, vì cả hai đều kết thúc
     * bằng một `click` giống hệt nhau trên ô chọn (cùng `detail`, cùng target):
     *   · bấm thẳng vào ô  → có `pointerdown` ở đây ⇒ `pointerdown` lo việc,
     *     `click` đi sau phải im để không mở lại đúng cái vừa đóng;
     *   · bấm vào chữ nhãn → `pointerdown` rơi vào **nhãn**, trình duyệt tổng
     *     hợp một `click` chuyển tiếp sang ô ⇒ `click` phải lo việc.
     */
    const gestureStartedHere = React.useRef(false);

    const items = React.useMemo<SelectOptionItem[]>(() => {
      const collected = collectSelectOptions(children);
      if (!placeholder) return collected;
      // Dòng gợi ý là một `<option value="" disabled>` thật ở bản native; tấm tự
      // vẽ phải kể nó vào cùng thứ tự, nếu không chỉ số của hai bên lệch nhau.
      return [
        { value: "", label: placeholder, disabled: true, group: null, folded: "" },
        ...collected,
      ];
    }, [children, placeholder]);

    const setRefs = React.useCallback(
      (element: HTMLSelectElement | null) => {
        selectRef.current = element;
        if (typeof forwardedRef === "function") forwardedRef(element);
        else if (forwardedRef) forwardedRef.current = element;
      },
      [forwardedRef],
    );

    // Đồng bộ mặt tiền với `<select>` sau MỌI lượt dựng: giá trị đổi được vì
    // người dùng bấm, vì phím, vì cha dựng lại với `value` mới, vì `form.reset()`,
    // hoặc vì trình duyệt tự chọn `<option>` đầu tiên khi không ai đặt `value`.
    //
    // 🔴 CỐ Ý không có mảng phụ thuộc. Đây là phép đọc **DOM**, mà DOM thì đổi
    // được vì những lý do React không nhìn thấy (`form.reset()` không bắn
    // `change`). Đặt `[selectedValue]` như quy tắc lint đề nghị là biến nó
    // thành hàm chỉ chạy khi state đã đổi — tức đúng cái nó sinh ra để phát
    // hiện. Không có vòng lặp vô hạn: `setSelectedValue` chỉ gọi khi hai bên
    // đang lệch, và gọi xong thì hết lệch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    React.useEffect(() => {
      const element = selectRef.current;
      if (element && element.value !== selectedValue) setSelectedValue(element.value);
    });

    const selectedItem = items.find((item) => item.value === selectedValue) ?? null;
    const selectedIndex = selectedItem ? items.indexOf(selectedItem) : -1;

    const close = React.useCallback((returnFocus: boolean) => {
      setOpen(false);
      setActiveIndex(-1);
      if (returnFocus) selectRef.current?.focus();
    }, []);

    /**
     * Đo chỗ đặt tấm. Toạ độ theo khung nhìn (`position: fixed`) vì tấm được
     * bắn sang `document.body` — xem ghi chú ở chỗ dựng portal.
     */
    const measure = React.useCallback(() => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      const rect = wrapper.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      // Lật lên trên khi dưới thiếu chỗ VÀ trên rộng hơn dưới (`17` §4.2).
      const dropUp = spaceBelow < MIN_SPACE_BELOW && rect.top > spaceBelow;
      setAnchor({
        left: rect.left,
        width: rect.width,
        top: dropUp ? null : rect.bottom + 4,
        bottom: dropUp ? window.innerHeight - rect.top + 4 : null,
      });
    }, []);

    const openList = React.useCallback(() => {
      measure();
      setActiveIndex(selectedIndex >= 0 ? selectedIndex : edgeEnabledIndex(items, 1));
      setOpen(true);
    }, [measure, items, selectedIndex]);

    // Trang cuộn hay cửa sổ đổi cỡ trong lúc tấm đang mở thì đo lại. Tấm nằm ở
    // `body` nên nó KHÔNG tự trôi theo phần tử neo như bản `absolute` cũ.
    React.useEffect(() => {
      if (!open) return;
      const reposition = () => measure();
      window.addEventListener("scroll", reposition, true);
      window.addEventListener("resize", reposition);
      return () => {
        window.removeEventListener("scroll", reposition, true);
        window.removeEventListener("resize", reposition);
      };
    }, [open, measure]);

    const choose = React.useCallback(
      (index: number) => {
        const item = items[index];
        const element = selectRef.current;
        if (!item || item.disabled || !element) return;
        commitValue(element, item.value);
        setSelectedValue(item.value);
        close(true);
      },
      [items, close],
    );

    /**
     * Mọi cú bấm **bắt đầu ở nơi khác** đều xoá cờ cử chỉ.
     *
     * Hàng rào thứ hai cho `gestureStartedHere`: một số trình duyệt nuốt luôn
     * `click` sau khi `pointerdown` bị `preventDefault()`, và khi đó không ai
     * xoá cờ ⇒ cú bấm vào **chữ nhãn** lần kế tiếp bị tưởng là bản lặp và rơi
     * vào hư không. Listener này chạy cho **mọi** lượt bấm, kể cả khi tấm đang
     * đóng, nên cờ không bao giờ sống quá một cử chỉ.
     */
    React.useEffect(() => {
      const onPointerDownAnywhere = (event: PointerEvent) => {
        const target = event.target as Node;
        const insideSelect = selectRef.current === target;
        if (!insideSelect) gestureStartedHere.current = false;

        // Bấm ra ngoài thì đóng. `pointerdown` chứ không phải `click`: người
        // dùng kéo chuột từ trong tấm ra ngoài rồi mới nhả thì `click` không
        // bao giờ nổ. Tấm nằm ở `body`, KHÔNG còn là con của wrapper — phải hỏi
        // cả hai, nếu không mỗi cú bấm vào một mục lại tự đóng tấm trước khi
        // chọn xong.
        if (!open) return;
        if (wrapperRef.current?.contains(target) || listRef.current?.contains(target)) return;
        close(false);
      };
      document.addEventListener("pointerdown", onPointerDownAnywhere);
      return () => document.removeEventListener("pointerdown", onPointerDownAnywhere);
    }, [open, close]);

    // Cuộn mục đang trỏ vào tầm nhìn — danh sách lớp có thể dài hơn 280px.
    React.useEffect(() => {
      if (!open || activeIndex < 0) return;
      const row = listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
      // jsdom không cài `scrollIntoView`. Không phải chuyện của riêng bộ kiểm:
      // đây là một lời gọi thuần trang trí, ném lỗi ở đây là đánh sập cả cây
      // React vì một cú cuộn không thành.
      if (typeof row?.scrollIntoView === "function") row.scrollIntoView({ block: "nearest" });
    }, [open, activeIndex]);

    const handlePointerDown = (event: React.PointerEvent<HTMLSelectElement>) => {
      onPointerDown?.(event);
      if (event.defaultPrevented || props.disabled || !hydrated) return;
      // Chặn đúng ở đây là chặn listbox của hệ điều hành. Kèm theo đó trình
      // duyệt cũng thôi tự đưa focus, nên phải tự gọi `focus()`.
      event.preventDefault();
      gestureStartedHere.current = true;
      selectRef.current?.focus();
      if (open) close(false);
      else openList();
    };

    /**
     * Bấm vào **chữ của nhãn** không đi qua `pointerdown` của ô chọn: trình
     * duyệt kích hoạt control bằng một `click` tổng hợp. Không bắt ở đây thì
     * đúng đường ấy vẫn bung listbox của hệ điều hành — cái mà cả đợt này sinh
     * ra để dẹp — và nó là đường người dùng hay đi vì chữ nhãn to hơn cái ô.
     */
    const handleClick = (event: React.MouseEvent<HTMLSelectElement>) => {
      onClick?.(event);
      if (gestureStartedHere.current) {
        gestureStartedHere.current = false;
        return;
      }
      if (event.defaultPrevented || props.disabled || !hydrated) return;
      event.preventDefault();
      selectRef.current?.focus();
      if (!open) openList();
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLSelectElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented || props.disabled || !hydrated) return;

      const { key, altKey } = event;

      if (!open) {
        if (key === "Enter" || key === " " || (altKey && (key === "ArrowDown" || key === "ArrowUp"))) {
          event.preventDefault();
          openList();
        }
        // `↑`/`↓`/`Home`/`End`/gõ chữ khi đang đóng: để native lo. Nó đổi giá
        // trị tại chỗ, không mở listbox hệ điều hành, và mặt tiền theo kịp.
        return;
      }

      if (key === "Escape" || (altKey && key === "ArrowUp")) {
        event.preventDefault();
        close(true);
        return;
      }
      if (key === "Tab") {
        close(false);
        return;
      }
      if (key === "Enter" || key === " ") {
        event.preventDefault();
        choose(activeIndex);
        return;
      }
      if (key === "ArrowDown" || key === "ArrowUp") {
        event.preventDefault();
        const delta = key === "ArrowDown" ? 1 : -1;
        setActiveIndex((current) =>
          current < 0 ? edgeEnabledIndex(items, delta) : nextEnabledIndex(items, current, delta),
        );
        return;
      }
      if (key === "Home" || key === "End") {
        event.preventDefault();
        setActiveIndex(edgeEnabledIndex(items, key === "Home" ? 1 : -1));
        return;
      }
      if (key.length === 1 && !event.ctrlKey && !event.metaKey && !altKey) {
        event.preventDefault();
        const now = Date.now();
        const state = typeAhead.current;
        state.query = now - state.at > TYPE_AHEAD_RESET_MS ? key : state.query + key;
        state.at = now;
        // Gõ lặp một chữ = đi vòng qua các mục cùng chữ đầu, đúng thói quen của
        // `<select>` native.
        const repeated = state.query.length > 1 && new Set(state.query).size === 1;
        const found = findByTypeAhead(
          items,
          repeated ? key : state.query,
          repeated || state.query.length === 1 ? activeIndex : activeIndex - 1,
        );
        if (found >= 0) setActiveIndex(found);
      }
    };

    const handleBlur = (event: React.FocusEvent<HTMLSelectElement>) => {
      onBlur?.(event);
      if (open) close(false);
    };

    /**
     * Giá trị cũng đổi được **không qua tấm**: `↑`/`↓` lúc tấm đóng, `form.reset()`,
     * hay `selectOption()` của bộ kiểm. Đóng tấm ở đây để hai bên không bao giờ
     * lệch nhau — một tấm còn mở sau khi giá trị đã đổi là tấm đang nói dối.
     */
    const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedValue(event.target.value);
      if (open) close(false);
      onChange?.(event);
    };

    const nativeClassName = hydrated
      ? // Vẫn nằm trong luồng bố cục về mặt kích thước (phủ kín mặt tiền) và
        // vẫn "nhìn thấy được" theo nghĩa của Playwright — `opacity` bằng 0
        // KHÔNG phải `visibility: hidden`, nên `selectOption()` vẫn chạy.
        "absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0"
      : cn(inputBaseClassName, "h-control appearance-none pr-10");

    const listboxId = React.useId();

    return (
      <div ref={wrapperRef} className={cn("relative", className)}>
        {/* 🔴 `<select>` đứng TRƯỚC mặt tiền trong DOM, và đó là bắt buộc: lớp
            `peer-*` của Tailwind dịch ra bộ chọn anh–em **xuôi** (`~`), nên nó
            chỉ tô được cho phần tử nằm SAU peer. Đặt sau thì vòng focus của bàn
            phím im lặng biến mất — không lỗi, không cảnh báo, chỉ là không có.
            Sau hydration `<select>` là `absolute` nên nó vẫn vẽ **đè lên** mặt
            tiền (phần tử đã định vị vẽ trên phần tử tĩnh) và nhận trọn cú bấm. */}
        <select
          ref={setRefs}
          className={cn("peer", nativeClassName)}
          onPointerDown={handlePointerDown}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onChange={handleChange}
          {...props}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {children}
        </select>

        {hydrated ? (
          // 🔴 `<button>` chứ không phải `<div>`, và lý do KHÔNG phải thẩm mỹ.
          //
          // Nhiều chỗ gọi bọc ô chọn trong một `<label>` **không** `htmlFor`
          // (`notification-center`, `gradebook-editor`). Tên của một nhãn kiểu
          // ấy được tính bằng chữ trong cả cây con của nó — nên một mặt tiền
          // `<div>` sẽ **nối chữ của mình vào tên nhãn**: nhãn "Đối tượng nhận"
          // hoá thành "Đối tượng nhậnChọn đối tượng". Quy tắc tính tên của HTML
          // bỏ qua các phần tử **nhận nhãn được** (button · select · input · …),
          // nên đặt mặt tiền là `<button>` thì chữ của nó nằm ngoài phép tính.
          //
          // `<select>` vẫn đứng TRƯỚC nên nó vẫn là control mà nhãn trỏ tới —
          // nhãn luôn gắn với phần tử nhận-nhãn-được **đầu tiên**.
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            data-select-trigger="true"
            data-state={open ? "open" : "closed"}
            className={cn(
              inputBaseClassName,
              "flex h-control items-center justify-between gap-2 pr-3",
              // Vòng focus vẽ theo `<select>` đang nằm đè lên (`peer`).
              "peer-focus-visible:border-theme-primary peer-focus-visible:ring-2 peer-focus-visible:ring-theme-ring",
              props.disabled && "cursor-not-allowed bg-surface-muted opacity-60",
            )}
          >
            <span className={cn("truncate", selectedItem ? "text-ink" : "text-ink-muted")}>
              {selectedItem?.label ?? placeholder ?? ""}
            </span>
            <ChevronDown
              className={cn(
                "h-5 w-5 shrink-0 text-ink-muted transition-transform duration-base ease-out",
                open && "rotate-180",
              )}
              strokeWidth={1.75}
            />
          </button>
        ) : (
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted"
            strokeWidth={1.75}
            aria-hidden="true"
          />
        )}

        {/* 🔴 Tấm listbox bắn thẳng sang `document.body`, KHÔNG nằm trong cây
            của ô chọn. Hai lý do, cả hai đều là lỗi thật chứ không phải phòng xa:

            1. **Bị cắt cụt.** Ô chọn có mặt trong hàng bảng và trong khối cuộn
               ngang (`data-table`, `roster-row`, `batch-row-editor`,
               `promotion-board`). Một tấm `absolute` nằm trong tổ tiên
               `overflow-*` thì bị xén theo tổ tiên ấy — người dùng thấy một
               danh sách bị chặt ngang thân.
            2. **Nó chui vào tên nhãn.** Vài chỗ gọi bọc ô chọn trong `<label>`
               không `htmlFor`; tên của nhãn kiểu ấy tính bằng chữ của cả cây
               con, nên tấm đang mở làm nhãn "Phạm vi" hoá thành "Phạm
               vi…Toàn hệ thống…". Đo được: `notification-center.test.tsx` đỏ. */}
        {hydrated && open && anchor
          ? createPortal(
              <div
                ref={listRef}
                id={listboxId}
                aria-hidden="true"
                data-select-listbox="true"
                style={{
                  position: "fixed",
                  left: anchor.left,
                  minWidth: anchor.width,
                  ...(anchor.top === null ? { bottom: anchor.bottom ?? 0 } : { top: anchor.top }),
                }}
                className={cn(
                  // `w-max` để nhãn dài không bị cắt, `min-w-*` để không hẹp hơn
                  // mặt tiền, `max-w-*` để ở 360px nó không đẩy trang trôi ngang.
                  "z-dropdown max-h-[280px] w-max overflow-auto rounded-md",
                  "max-w-[min(24rem,calc(100vw-2rem))]",
                  "border border-line bg-surface py-1 shadow-md",
                  "animate-in fade-in-0 zoom-in-95 duration-base ease-out",
                  anchor.top === null ? "origin-bottom" : "origin-top",
                )}
              >
            {items.map((item, index) => {
              const previous = items[index - 1];
              const startsGroup = item.group !== null && item.group !== previous?.group;
              return (
                <React.Fragment key={`${item.group ?? ""}:${item.value}:${index}`}>
                  {startsGroup ? (
                    <div className="px-3 pb-1 pt-2 text-xs font-semibold text-ink-muted">
                      {item.group}
                    </div>
                  ) : null}
                  <div
                    data-index={index}
                    data-select-option={item.value}
                    // Giữ focus ở `<select>`: nếu để mặc định, `mousedown` ở đây
                    // làm ô chọn mất focus ⇒ `onBlur` đóng tấm **trước khi**
                    // `click` kịp nổ, và cú bấm rơi vào hư không.
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => choose(index)}
                    onMouseEnter={() => !item.disabled && setActiveIndex(index)}
                    className={cn(
                      "flex min-h-11 cursor-pointer items-center gap-2 px-3 text-sm",
                      item.disabled && "cursor-not-allowed text-ink-muted opacity-60",
                      !item.disabled && index === activeIndex && "bg-surface-muted",
                      !item.disabled &&
                        item.value === selectedValue &&
                        "bg-theme-tint font-medium text-theme-accent-text",
                    )}
                  >
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0",
                        item.value === selectedValue && !item.disabled ? "opacity-100" : "opacity-0",
                      )}
                      strokeWidth={1.75}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                </React.Fragment>
              );
            })}
              </div>,
              document.body,
            )
          : null}
      </div>
    );
  },
);
Select.displayName = "Select";
