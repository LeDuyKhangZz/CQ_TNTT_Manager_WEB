/**
 * Phần thuần logic của `DateField`/`DateTimeField` — `17` §5.
 *
 * Tách khỏi component vì hai lẽ: file kia mang `"use client"`, và vì đây là chỗ
 * dễ sai nhất của cả đợt. Mọi luật đọc–viết ngày nằm ở đây, có bộ kiểm riêng.
 *
 * 🔴 Định dạng hiển thị của TOÀN BỘ ứng dụng là **dd/MM/yyyy** (docs/04 §7).
 * Ô `<input type="date">` native **không** theo luật ấy: nó vẽ theo *locale của
 * trình duyệt*, nên trên một máy đặt tiếng Anh thì ngày sinh của thiếu nhi hiện
 * ra **MM/DD/YYYY**. Đó chính là lỗi chủ dự án báo, và không có dòng CSS nào
 * chữa được — phải tự vẽ ô thì mới cầm được định dạng.
 */

/** Giá trị máy: `yyyy-MM-dd`. Đây là thứ đi lên máy chủ, không bao giờ đổi. */
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
/** Giá trị người: `d/M/yyyy` — chấp nhận thiếu số 0 và dấu `.` hoặc `-`. */
const VI_DATE = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/;
/** `yyyy-MM-ddTHH:mm` của `<input type="datetime-local">`. */
const ISO_DATE_TIME = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2})/;

export type DateParts = { year: number; month: number; day: number };

function isRealDate({ year, month, day }: DateParts): boolean {
  if (month < 1 || month > 12 || day < 1 || year < 1) return false;
  // Ngày 31/2 phải bị từ chối, không được lặng lẽ trôi sang 3/3 như `new Date()`.
  const probe = new Date(Date.UTC(year, month - 1, day));
  return (
    probe.getUTCFullYear() === year &&
    probe.getUTCMonth() === month - 1 &&
    probe.getUTCDate() === day
  );
}

export function toIso({ year, month, day }: DateParts): string {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Đọc chuỗi người dùng gõ. Nhận **cả hai** kiểu, và cả hai đều cần thật:
 *   · `dd/MM/yyyy` — kiểu người dùng gõ, và là kiểu ô này hiển thị;
 *   · `yyyy-MM-dd` — kiểu máy. Dán từ chỗ khác sang vẫn phải nhận, và **bộ kiểm
 *     E2E gõ đúng kiểu này** (`fill("2016-01-15")`).
 * Trả `null` khi chuỗi không phải một ngày có thật.
 */
export function parseDateInput(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;

  const iso = ISO_DATE.exec(text);
  if (iso) {
    const parts = { year: +iso[1], month: +iso[2], day: +iso[3] };
    return isRealDate(parts) ? toIso(parts) : null;
  }

  const vi = VI_DATE.exec(text);
  if (vi) {
    const parts = { year: +vi[3], month: +vi[2], day: +vi[1] };
    return isRealDate(parts) ? toIso(parts) : null;
  }

  return null;
}

/** `yyyy-MM-dd` → `dd/MM/yyyy`. Chuỗi không hợp lệ trả về nguyên văn. */
export function formatIsoForDisplay(iso: string): string {
  const match = ISO_DATE.exec(iso);
  if (!match) return iso;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

/**
 * Tách `yyyy-MM-ddTHH:mm` thành hai phần.
 *
 * 🔴 Nhận cả chuỗi chỉ có ngày: `DateTimeField` nạp lại giá trị cũ từ máy chủ
 * qua `toDateTimeLocalVi()` (luôn đủ giờ), nhưng bộ kiểm và người dùng có thể
 * đưa vào một chuỗi cụt. Trả giờ rỗng còn hơn ném lỗi giữa biểu mẫu.
 */
export function splitDateTime(value: string): { date: string; time: string } {
  const match = ISO_DATE_TIME.exec(value.trim());
  if (match) return { date: match[1], time: `${match[2]}:${match[3]}` };
  const dateOnly = parseDateInput(value);
  return { date: dateOnly ?? "", time: "" };
}

/** Ghép lại giá trị của `datetime-local`. Thiếu một trong hai thì trả rỗng. */
export function joinDateTime(date: string, time: string): string {
  if (!date || !/^\d{2}:\d{2}$/.test(time)) return "";
  return `${date}T${time}`;
}

/** Nằm ngoài `min`/`max` thì ô lịch mờ đi và không bấm được (`17` §5.1). */
export function isOutOfRange(iso: string, min?: string, max?: string): boolean {
  if (min && iso < min) return true;
  if (max && iso > max) return true;
  return false;
}

export const WEEKDAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"] as const;

export const MONTH_LABELS = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
] as const;

export type CalendarCell = { iso: string; day: number; inMonth: boolean };

/**
 * Lưới 6 hàng × 7 cột cho một tháng, **bắt đầu từ Thứ Hai**.
 *
 * Luôn đủ 42 ô: lưới đổi số hàng giữa các tháng thì cả popover nhảy chiều cao,
 * và nút "tháng sau" chạy khỏi ngón tay đang bấm.
 */
export function monthGrid(year: number, month: number): CalendarCell[] {
  const first = new Date(Date.UTC(year, month - 1, 1));
  // `getUTCDay()`: 0 = Chủ nhật. Xoay về 0 = Thứ Hai cho đúng lịch Việt Nam.
  const lead = (first.getUTCDay() + 6) % 7;
  const start = new Date(first);
  start.setUTCDate(1 - lead);

  return Array.from({ length: 42 }, (_, index) => {
    const cursor = new Date(start);
    cursor.setUTCDate(start.getUTCDate() + index);
    return {
      iso: cursor.toISOString().slice(0, 10),
      day: cursor.getUTCDate(),
      inMonth: cursor.getUTCMonth() === month - 1,
    };
  });
}

/** Dịch một mốc ISO đi `days` ngày (dùng cho phím mũi tên trong lịch). */
export function shiftIsoDays(iso: string, days: number): string {
  const match = ISO_DATE.exec(iso);
  if (!match) return iso;
  const cursor = new Date(Date.UTC(+match[1], +match[2] - 1, +match[3]));
  cursor.setUTCDate(cursor.getUTCDate() + days);
  return cursor.toISOString().slice(0, 10);
}

/** Dịch `months` tháng, kẹp ngày về cuối tháng khi tháng đích ngắn hơn. */
export function shiftIsoMonths(iso: string, months: number): string {
  const match = ISO_DATE.exec(iso);
  if (!match) return iso;
  const year = +match[1];
  const month = +match[2];
  const day = +match[3];
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  return toIso({
    year: target.getUTCFullYear(),
    month: target.getUTCMonth() + 1,
    day: Math.min(day, lastDay),
  });
}
