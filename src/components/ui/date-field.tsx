"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { todayVi } from "@/lib/dates";
import { inputBaseClassName } from "./input";
import {
  formatIsoForDisplay,
  isOutOfRange,
  joinDateTime,
  MONTH_LABELS,
  monthGrid,
  parseDateInput,
  shiftIsoDays,
  shiftIsoMonths,
  splitDateTime,
  WEEKDAY_LABELS,
} from "./date-field-utils";

/**
 * Ô chọn ngày — `17` §5, `09` §12 A2.
 *
 * ## Vì sao phải tự dựng
 *
 * `<input type="date">` vẽ ngày theo **locale của trình duyệt**. Máy phòng học
 * đặt tiếng Anh thì ngày sinh thiếu nhi hiện `MM/DD/YYYY`, trong khi cả phần
 * còn lại của ứng dụng in `dd/MM/yyyy` (`formatDateVi`, 103 chỗ). Không có CSS
 * nào đụng được vào phần đó — đây là lý do kỹ thuật, không phải thẩm mỹ.
 *
 * ## Tăng tiến (`09` §12 A1, cùng khuôn với `Select` v2)
 *
 * | Thời điểm | Cái gì được dựng | Form chạy không JS? |
 * |---|---|---|
 * | Trước hydration | `<input type="date" name>` native | ✅ |
 * | Sau hydration | Ô chữ `dd/MM/yyyy` + lịch tự vẽ + `<input type="hidden" name>` mang ISO | ✅ |
 *
 * Giá trị gửi lên máy chủ **luôn** là `yyyy-MM-dd`, y như trước ⇒ không một
 * server action nào phải sửa.
 *
 * ## Gõ tay vẫn là đường đi chính
 *
 * Nhập ngày sinh cho gần 900 thiếu nhi bằng cách bấm lùi lịch về năm 2016 là
 * việc không ai làm nổi. Ô này nhận **cả** `dd/MM/yyyy` lẫn `yyyy-MM-dd`
 * (`parseDateInput`), lịch chỉ là lối phụ.
 */

type BaseProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "defaultValue" | "onChange"
> & {
  value?: string;
  defaultValue?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export type DateFieldProps = BaseProps;

/**
 * Bật cờ hydration, và **nhận lấy giá trị đang có trong DOM trước khi bật**.
 *
 * 🔴 Không có bước "nhận lấy" thì đây là một lỗi mất dữ liệu có thật:
 *
 * Trước hydration ô này là `<input type="date">` native, sau hydration nó là ô
 * chữ + ô ẩn. Ai gõ (hoặc dán) một ngày vào **trong khoảng giữa** — trang đã
 * hiện nhưng JavaScript chưa chạy xong — sẽ thấy thứ mình vừa nhập **biến mất**,
 * vì `DateField` dựng lại từ `defaultValue` của máy chủ và không hề biết DOM đã
 * đổi. Người dùng không nhận ra: ô lại hiện ngày mặc định, họ bấm Lưu, và biểu
 * mẫu gửi đi một ngày khác ngày họ vừa chọn.
 *
 * Đo được ở `attendance.spec.ts`: 3 bài đỏ **ngẫu nhiên** tuỳ máy nhanh hay
 * chậm, vì nó là một cuộc đua với hydration. Bộ kiểm chỉ thao tác nhanh hơn
 * người thật, không làm gì người thật không làm được.
 */
function useHydratedInput(
  ref: React.RefObject<HTMLInputElement | null>,
  currentValue: string,
  onAdopt: (value: string) => void,
): boolean {
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    const domValue = ref.current?.value ?? "";
    // Ô native mang sẵn giá trị dạng máy (`yyyy-MM-dd` hoặc `yyyy-MM-ddTHH:mm`),
    // đúng dạng phía trong vẫn dùng — nhận thẳng, không phải đọc lại.
    if (domValue && domValue !== currentValue) onAdopt(domValue);
    setHydrated(true);
    // Chỉ chạy một lần, đúng lúc chuyển giao. Chạy lại là giẫm lên giá trị người
    // dùng vừa chọn bằng chính cái ô đã bị thay.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return hydrated;
}

/* -------------------------------------------------------------------------- */
/*  Lịch                                                                       */
/* -------------------------------------------------------------------------- */

function CalendarPanel({
  valueIso,
  cursor,
  min,
  max,
  onCursor,
  onPick,
  panelRef,
}: {
  valueIso: string;
  cursor: string;
  min?: string;
  max?: string;
  onCursor: (iso: string) => void;
  onPick: (iso: string) => void;
  panelRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [year, month] = [Number(cursor.slice(0, 4)), Number(cursor.slice(5, 7))];
  const cells = monthGrid(year, month);
  const today = todayVi();

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label={`${MONTH_LABELS[month - 1]} ${year}`}
      data-date-calendar="true"
      className={cn(
        "z-dropdown w-[19rem] max-w-[calc(100vw-2rem)] rounded-md border border-line bg-surface p-3 shadow-md",
        "animate-in fade-in-0 zoom-in-95 duration-base ease-out",
      )}
      // Giữ focus ở ô chữ: mất focus là popover đóng trước khi cú bấm kịp nổ.
      onMouseDown={(event) => event.preventDefault()}
    >
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label="Tháng trước"
          onClick={() => onCursor(shiftIsoMonths(cursor, -1))}
          className="flex h-11 w-11 items-center justify-center rounded-md text-ink hover:bg-surface-muted"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
        </button>
        <span className="text-sm font-semibold text-ink">
          {MONTH_LABELS[month - 1]} {year}
        </span>
        <button
          type="button"
          aria-label="Tháng sau"
          onClick={() => onCursor(shiftIsoMonths(cursor, 1))}
          className="flex h-11 w-11 items-center justify-center rounded-md text-ink hover:bg-surface-muted"
        >
          <ChevronRight className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>

      <div className="mt-2 grid grid-cols-7 gap-0.5" role="presentation">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-1 text-center text-xs font-semibold text-ink-muted">
            {label}
          </div>
        ))}
        {cells.map((cell) => {
          const disabled = isOutOfRange(cell.iso, min, max);
          const selected = cell.iso === valueIso;
          return (
            <button
              key={cell.iso}
              type="button"
              disabled={disabled}
              aria-current={cell.iso === today ? "date" : undefined}
              aria-pressed={selected}
              data-date-cell={cell.iso}
              onClick={() => onPick(cell.iso)}
              className={cn(
                "flex h-10 items-center justify-center rounded-md text-sm",
                cell.inMonth ? "text-ink" : "text-ink-muted",
                !disabled && !selected && "hover:bg-surface-muted",
                disabled && "cursor-not-allowed opacity-40",
                cell.iso === today && !selected && "border border-theme-border font-semibold",
                selected && "bg-theme-primary font-semibold text-theme-on-primary",
              )}
            >
              {cell.day}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => onPick(today)}
        disabled={isOutOfRange(today, min, max)}
        className="mt-2 min-h-11 w-full rounded-md border border-line text-sm font-medium text-ink hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
      >
        Hôm nay
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Bộ khung dùng chung cho DateField và DateTimeField                         */
/* -------------------------------------------------------------------------- */

type ShellProps = {
  nativeType: "date" | "datetime-local";
  /** Giá trị đầy đủ gửi lên máy chủ (`yyyy-MM-dd` hoặc `yyyy-MM-ddTHH:mm`). */
  submitValue: string;
  /** Phần ngày `yyyy-MM-dd` — lịch làm việc trên phần này. */
  dateIso: string;
  onDateIso: (iso: string) => void;
  /** Ô giờ:phút của `DateTimeField`, `null` với `DateField`. */
  timeSlot: React.ReactNode;
  /**
   * Đọc chuỗi người dùng gõ. Trả về phần ngày ISO khi hiểu được, `null` khi
   * không. `DateTimeField` cài hàm này để nuốt luôn `yyyy-MM-ddTHH:mm` — đó là
   * chuỗi bộ kiểm E2E gõ thẳng vào (`fill("2026-10-03T19:00")`).
   */
  acceptTyped: (raw: string) => string | null;
  min?: string;
  max?: string;
  rest: BaseProps;
  className?: string;
  nativeValue: string;
  onNativeChange: (value: string) => void;
  forwardedRef: React.ForwardedRef<HTMLInputElement>;
};

function DateShell({
  nativeType,
  submitValue,
  dateIso,
  onDateIso,
  timeSlot,
  acceptTyped,
  min,
  max,
  rest,
  className,
  nativeValue,
  onNativeChange,
  forwardedRef,
}: ShellProps) {
  const textRef = React.useRef<HTMLInputElement | null>(null);
  const hydrated = useHydratedInput(textRef, nativeValue, onNativeChange);
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const panelRef = React.useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = React.useState(false);
  const [anchor, setAnchor] = React.useState<{ left: number; top: number } | null>(null);
  const [cursor, setCursor] = React.useState(() => dateIso || todayVi());
  /** Chữ đang hiện trong ô. Rời ô thì nó được chuẩn hoá lại về `dd/MM/yyyy`. */
  const [text, setText] = React.useState(() => (dateIso ? formatIsoForDisplay(dateIso) : ""));

  // Giá trị do phía ngoài đổi (ô có điều khiển, `form.reset()`) phải kéo được
  // phần chữ đi theo — nếu không, ô hiện một ngày mà form gửi đi một ngày khác.
  const lastSyncedIso = React.useRef(dateIso);
  if (lastSyncedIso.current !== dateIso) {
    lastSyncedIso.current = dateIso;
    const normalized = dateIso ? formatIsoForDisplay(dateIso) : "";
    if (parseDateInput(text) !== (dateIso || null)) setText(normalized);
  }

  const measure = React.useCallback(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    const height = panelRef.current?.offsetHeight ?? 360;
    const below = window.innerHeight - rect.bottom;
    setAnchor({
      left: Math.min(rect.left, Math.max(8, window.innerWidth - 320)),
      top: below < height && rect.top > below ? Math.max(8, rect.top - height - 4) : rect.bottom + 4,
    });
  }, []);

  const openCalendar = React.useCallback(() => {
    setCursor(dateIso || todayVi());
    measure();
    setOpen(true);
  }, [dateIso, measure]);

  React.useEffect(() => {
    if (!open) return;
    const reposition = () => measure();
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (wrapperRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    /**
     * 🔴 `Escape` phải bắt ở tầng `document`, không phải ở ô chữ.
     *
     * Bấm vào nút lịch thì focus nằm trên **nút**, nên một `onKeyDown` gắn vào ô
     * chữ không bao giờ nghe thấy phím ấy: lịch mở ra rồi không đóng lại được
     * bằng bàn phím. Đo được ở `date-field.test.tsx`.
     */
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      textRef.current?.focus();
    };
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, measure]);

  const commitText = (raw: string) => {
    setText(raw);
    const parsed = acceptTyped(raw);
    // Chuỗi đang gõ dở thì KHÔNG xoá giá trị đang có — người dùng xoá một chữ
    // số để sửa mà mất luôn cả ngày là hành vi khiến người ta bỏ ô này.
    if (parsed) {
      onDateIso(parsed);
      setCursor(parsed);
    } else if (raw.trim() === "") {
      onDateIso("");
    }
  };

  /**
   * 🔴 Chuỗi gõ dở mà KHÔNG đọc được phải chặn được lượt gửi.
   *
   * `required` nằm ở ô chữ, nên nó chỉ biết ô rỗng hay không rỗng. Gõ "31/02/2016"
   * hay "abc" thì ô **không rỗng** ⇒ qua được `required`, trong khi ô ẩn mang
   * giá trị cũ hoặc rỗng. Không có hàng rào này thì biểu mẫu gửi đi lặng lẽ một
   * ngày khác với ngày người dùng đang nhìn — đúng loại lỗi không ai truy ra.
   */
  React.useEffect(() => {
    const element = textRef.current;
    if (!element) return;
    const raw = text.trim();
    element.setCustomValidity(
      raw !== "" && acceptTyped(raw) === null ? "Ngày chưa đúng. Nhập dạng dd/mm/yyyy." : "",
    );
  }, [text, acceptTyped]);

  const pick = (iso: string) => {
    onDateIso(iso);
    setText(formatIsoForDisplay(iso));
    setOpen(false);
    textRef.current?.focus();
  };

  const onTextKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
      return;
    }
    if (!open) {
      if (event.altKey && event.key === "ArrowDown") {
        event.preventDefault();
        openCalendar();
      }
      return;
    }
    const step =
      event.key === "ArrowLeft" ? -1
      : event.key === "ArrowRight" ? 1
      : event.key === "ArrowUp" ? -7
      : event.key === "ArrowDown" ? 7
      : 0;
    if (step !== 0) {
      event.preventDefault();
      setCursor((current) => shiftIsoDays(current || todayVi(), step));
      return;
    }
    if (event.key === "PageUp" || event.key === "PageDown") {
      event.preventDefault();
      setCursor((current) => shiftIsoMonths(current || todayVi(), event.key === "PageUp" ? -1 : 1));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (!isOutOfRange(cursor, min, max)) pick(cursor);
    }
  };

  const setInputRef = (element: HTMLInputElement | null) => {
    textRef.current = element;
    if (typeof forwardedRef === "function") forwardedRef(element);
    else if (forwardedRef) forwardedRef.current = element;
  };

  const { id, name, required, disabled, ...inputRest } = rest;

  if (!hydrated) {
    // Trước hydration: đúng ô native như trước đợt này, không thiếu chức năng gì.
    return (
      <input
        {...inputRest}
        ref={setInputRef}
        id={id}
        name={name}
        required={required}
        disabled={disabled}
        min={min}
        max={max}
        type={nativeType}
        value={nativeValue}
        onChange={(event) => onNativeChange(event.target.value)}
        className={cn(inputBaseClassName, "flex h-control", className)}
      />
    );
  }

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            {...inputRest}
            ref={setInputRef}
            id={id}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            required={required}
            disabled={disabled}
            // `min`/`max` không có nghĩa với `type="text"`, nhưng vẫn đặt: ô này
            // là chỗ duy nhất đeo nhãn, nên nó phải nói ra được khoảng hợp lệ
            // cho công cụ và cho người đọc DOM — lịch đã chặn theo đúng hai mốc
            // này rồi. `class-settings.spec.ts` đọc thẳng hai thuộc tính ấy.
            min={min}
            max={max}
            placeholder={inputRest.placeholder ?? "dd/mm/yyyy"}
            aria-invalid={text.trim() !== "" && acceptTyped(text) === null ? true : undefined}
            data-date-text="true"
            value={text}
            onChange={(event) => commitText(event.target.value)}
            onKeyDown={onTextKeyDown}
            onBlur={(event) => {
              // Rời ô thì chuẩn hoá về dạng hiển thị chuẩn: người dùng gõ
              // "5-1-2016" phải thấy "05/01/2016", nếu không họ tưởng chưa nhận.
              const parsed = acceptTyped(event.target.value);
              if (parsed) setText(formatIsoForDisplay(parsed));
            }}
            className={cn(inputBaseClassName, "flex h-control pr-11")}
          />
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            data-date-trigger="true"
            disabled={disabled}
            onClick={() => (open ? setOpen(false) : openCalendar())}
            // 🔴 Vùng chạm đủ 44px (`09` §10.7) — nút này CAO BẰNG cả ô nhập,
            // không phải một nút nhỏ đặt lọt bên trong. Bản đầu để `h-9 w-9`
            // (36px) và `responsive.spec.ts` bắt được ngay ở trang hồ sơ thiếu
            // nhi: "button 36px" ×2. Vùng chạm là điều cấm số 7, không phải gợi ý.
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-ink-muted hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CalendarDays className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>
        {timeSlot}
      </div>

      {/* Giá trị thật gửi lên máy chủ. Luôn ISO, nên không server action nào đổi. */}
      <input type="hidden" name={name} value={submitValue} />
      {/* `required` của ô chữ đã chặn chuỗi rỗng; ô ẩn không tự kiểm được. */}

      {open && anchor
        ? createPortal(
            <div style={{ position: "fixed", left: anchor.left, top: anchor.top }}>
              <CalendarPanel
                valueIso={dateIso}
                cursor={cursor}
                min={min}
                max={max}
                onCursor={setCursor}
                onPick={pick}
                panelRef={panelRef}
              />
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  DateField                                                                  */
/* -------------------------------------------------------------------------- */

export const DateField = React.forwardRef<HTMLInputElement, DateFieldProps>(
  ({ className, value, defaultValue, onChange, min, max, ...rest }, forwardedRef) => {
    const controlled = value !== undefined;
    const [inner, setInner] = React.useState(defaultValue ?? "");
    /**
     * 🔴 `defaultValue` đổi giữa chừng phải kéo ô đi theo.
     *
     * `<input defaultValue>` native làm việc này sẵn: khuôn mẫu khắp dự án là
     * biểu mẫu gửi đi, máy chủ trả `state.values` về, và ô nhận lại đúng thứ
     * người dùng vừa gõ (`staff-create-form`, `create-student-form`…). Một ô tự
     * dựng chỉ đọc `defaultValue` lúc mount sẽ **nuốt mất dữ liệu đã gõ** ngay
     * ở màn cảnh báo trùng — đúng cái mà bài kiểm "không bắt nhập lại bảy ô"
     * sinh ra để chặn.
     */
    const lastDefault = React.useRef(defaultValue);
    if (!controlled && lastDefault.current !== defaultValue) {
      lastDefault.current = defaultValue;
      setInner(defaultValue ?? "");
    }
    const current = controlled ? (value ?? "") : inner;

    const emit = React.useCallback(
      (next: string) => {
        if (!controlled) setInner(next);
        onChange?.({
          target: { value: next, name: rest.name ?? "" },
          currentTarget: { value: next, name: rest.name ?? "" },
        } as unknown as React.ChangeEvent<HTMLInputElement>);
      },
      [controlled, onChange, rest.name],
    );

    return (
      <DateShell
        nativeType="date"
        submitValue={current}
        dateIso={current}
        onDateIso={emit}
        timeSlot={null}
        acceptTyped={parseDateInput}
        min={typeof min === "string" ? min : undefined}
        max={typeof max === "string" ? max : undefined}
        rest={rest}
        className={className}
        nativeValue={current}
        onNativeChange={emit}
        forwardedRef={forwardedRef}
      />
    );
  },
);
DateField.displayName = "DateField";

/* -------------------------------------------------------------------------- */
/*  DateTimeField                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Đọc chuỗi gõ vào ô ngày–giờ. Nhận cả `dd/MM/yyyy`, `yyyy-MM-dd` lẫn chuỗi đủ
 * `yyyy-MM-ddTHH:mm`; luôn trả về **phần ngày**, phần giờ do ô giờ giữ.
 */
function acceptTypedDateTime(raw: string): string | null {
  const direct = parseDateInput(raw);
  if (direct) return direct;
  const { date } = splitDateTime(raw);
  return date || null;
}

export const DateTimeField = React.forwardRef<HTMLInputElement, DateFieldProps>(
  ({ className, value, defaultValue, onChange, min, max, ...rest }, forwardedRef) => {
    const controlled = value !== undefined;
    const [inner, setInner] = React.useState(defaultValue ?? "");
    /**
     * 🔴 `defaultValue` đổi giữa chừng phải kéo ô đi theo.
     *
     * `<input defaultValue>` native làm việc này sẵn: khuôn mẫu khắp dự án là
     * biểu mẫu gửi đi, máy chủ trả `state.values` về, và ô nhận lại đúng thứ
     * người dùng vừa gõ (`staff-create-form`, `create-student-form`…). Một ô tự
     * dựng chỉ đọc `defaultValue` lúc mount sẽ **nuốt mất dữ liệu đã gõ** ngay
     * ở màn cảnh báo trùng — đúng cái mà bài kiểm "không bắt nhập lại bảy ô"
     * sinh ra để chặn.
     */
    const lastDefault = React.useRef(defaultValue);
    if (!controlled && lastDefault.current !== defaultValue) {
      lastDefault.current = defaultValue;
      setInner(defaultValue ?? "");
    }
    const current = controlled ? (value ?? "") : inner;

    /**
     * 🔴 Ngày và giờ giữ RIÊNG, không suy ngược ra từ chuỗi đã ghép.
     *
     * Bản đầu tính `splitDateTime(current)` ở mỗi lượt dựng. Hậu quả đo được:
     * xoá trắng ô giờ ⇒ giá trị ghép thành chuỗi rỗng ⇒ lượt dựng sau tách ra
     * được ngày rỗng ⇒ **ngày biến mất theo**. Người dùng chỉ định sửa giờ họp
     * mà mất luôn ngày họp.
     */
    const parsed = splitDateTime(current);
    const [parts, setParts] = React.useState(parsed);
    const lastValue = React.useRef(current);
    if (lastValue.current !== current) {
      lastValue.current = current;
      // Giá trị do phía ngoài đặt (ô có điều khiển) thì tin theo nó; còn phần
      // nào phía ngoài không nói tới thì giữ nguyên cái đang có.
      if (current !== joinDateTime(parts.date, parts.time)) {
        setParts({ date: parsed.date || parts.date, time: parsed.time || parts.time });
      }
    }
    const { date, time } = parts;

    const emit = React.useCallback(
      (next: string) => {
        if (!controlled) setInner(next);
        onChange?.({
          target: { value: next, name: rest.name ?? "" },
          currentTarget: { value: next, name: rest.name ?? "" },
        } as unknown as React.ChangeEvent<HTMLInputElement>);
      },
      [controlled, onChange, rest.name],
    );

    const update = (nextDate: string, nextTime: string) => {
      setParts({ date: nextDate, time: nextTime });
      lastValue.current = joinDateTime(nextDate, nextTime);
      emit(lastValue.current);
    };

    return (
      <DateShell
        nativeType="datetime-local"
        submitValue={current}
        dateIso={date}
        onDateIso={(iso) => update(iso, time || "00:00")}
        acceptTyped={acceptTypedDateTime}
        timeSlot={
          <input
            type="time"
            aria-label="Giờ"
            data-date-time="true"
            disabled={rest.disabled}
            value={time}
            onChange={(event) => update(date, event.target.value)}
            className={cn(inputBaseClassName, "flex h-control w-28 shrink-0")}
          />
        }
        min={typeof min === "string" ? min : undefined}
        max={typeof max === "string" ? max : undefined}
        rest={rest}
        className={className}
        nativeValue={current}
        onNativeChange={emit}
        forwardedRef={forwardedRef}
      />
    );
  },
);
DateTimeField.displayName = "DateTimeField";
