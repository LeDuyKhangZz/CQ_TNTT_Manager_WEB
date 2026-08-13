/**
 * Hợp đồng giữa guard máy chủ và trang `/login` — M14 A-04, `04_TO_BE_FLOWS.md`
 * F01 §5.
 *
 * 🔴 Vì sao phải có file này. Gốc rễ của A-04 (5 Whys ở `03_AUDIT_RESULTS.md`
 * F01) không phải "quên hiển thị một câu chữ", mà là: `guards.ts` được viết như
 * một API **phát tín hiệu** — nó gắn `?error=account_unavailable` vào URL rồi
 * coi như xong — trong khi **không có phía nhận nào bị bắt buộc tồn tại**.
 * Người bị khoá tài khoản bị đá về một màn hình đăng nhập trắng trơn, nhập lại,
 * và chỉ khi đó mới biết mình bị khoá.
 *
 * Cách chặn tái diễn: guard **không được tự gõ chuỗi query**. Nó gọi
 * `buildLoginUrl()`, và hàm đó chỉ nhận mã nằm trong hai danh sách dưới đây —
 * mỗi mã đều đã có sẵn câu chữ tiếng Việt. Muốn thêm tín hiệu mới thì phải khai
 * vào đây trước, tức là không thể phát ra một mã mà trang `/login` chưa biết đọc.
 *
 * Cùng mô hình với `APP_ERROR_CODES` ở `src/lib/errors/index.ts` (mã ổn định +
 * bảng câu chữ tiếng Việt), nhưng tách riêng: đó là lỗi **nghiệp vụ** ném ra
 * trong thân hàm, còn đây là **trạng thái chuyển tiếp** đi qua thanh địa chỉ.
 *
 * File này cố ý KHÔNG `import "server-only"`: `sanitizeNextPath` và
 * `resolveNextPath` là hàm thuần, cần chạy được trong unit test (AC-F5).
 */

import type { AuthContext } from "./types";
import { canAccessRoute } from "@/lib/permissions/route-map";

/** Đích mặc định sau khi đăng nhập, và là nơi rơi về khi `next` không hợp lệ. */
export const DEFAULT_AFTER_LOGIN_PATH = "/dashboard";

/**
 * Header do middleware đặt để Server Component biết đường dẫn thật của request.
 *
 * `layout.tsx` của `(dashboard)` không có cách nào khác để biết mình đang dựng
 * cho route nào — bản cũ vì thế gọi `requireAuthContext()` không tham số, nên
 * `next` **luôn** là `/dashboard` và mọi deep-link đều mất (`home.spec.ts` cũ
 * còn khẳng định `/admin` → `next=%2Fdashboard` là hành vi đúng).
 *
 * ⚠️ Middleware phải dùng `headers.set()`, không phải `append()`: người dùng có
 * thể tự gửi kèm `x-pathname` trong request. `set` ghi đè giá trị của họ.
 */
export const REQUEST_PATH_HEADER = "x-pathname";

/* ==========================================================================
   1. Tín hiệu hiển thị trên `/login`
   ========================================================================== */

/** Tín hiệu **lỗi** — người dùng bị chặn, phải đọc mới hiểu chuyện gì xảy ra. */
export const LOGIN_ERROR_CODES = ["account_unavailable"] as const;

/** Tín hiệu **xác nhận** — việc người dùng vừa chủ động làm đã xong. */
export const LOGIN_NOTICE_CODES = ["signed_out"] as const;

export type LoginErrorCode = (typeof LOGIN_ERROR_CODES)[number];
export type LoginNoticeCode = (typeof LOGIN_NOTICE_CODES)[number];

export interface LoginBanner {
  /** `warning` cho tín hiệu lỗi, `info` cho xác nhận trung tính. */
  tone: "warning" | "info";
  /**
   * `alert` ngắt lời trình đọc màn hình — chỉ dùng cho tin người dùng **phải**
   * biết ngay. Xác nhận đăng xuất dùng `status` để không cướp lời.
   */
  role: "alert" | "status";
  title: string;
  description: string;
}

export const LOGIN_ERROR_BANNERS: Readonly<Record<LoginErrorCode, LoginBanner>> = {
  account_unavailable: {
    tone: "warning",
    role: "alert",
    title: "Tài khoản đang bị khóa hoặc đã vô hiệu hóa",
    description:
      "Bạn không thể đăng nhập cho tới khi Ban quản trị Xứ đoàn mở lại tài khoản. Vui lòng liên hệ Ban quản trị.",
  },
};

export const LOGIN_NOTICE_BANNERS: Readonly<Record<LoginNoticeCode, LoginBanner>> = {
  signed_out: {
    tone: "info",
    role: "status",
    title: "Bạn đã đăng xuất.",
    description: "Phiên làm việc trên máy này đã kết thúc.",
  },
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Đọc `?error=` và `?notice=` ra tấm băng cần hiện. Mã lạ ⇒ `null`, tuyệt đối
 * không in lại giá trị thô lên màn hình (nó đến từ thanh địa chỉ của người lạ).
 */
export function resolveLoginBanner(params: {
  error?: string | string[];
  notice?: string | string[];
}): LoginBanner | null {
  const error = firstValue(params.error);
  if (error && (LOGIN_ERROR_CODES as readonly string[]).includes(error)) {
    return LOGIN_ERROR_BANNERS[error as LoginErrorCode];
  }
  const notice = firstValue(params.notice);
  if (notice && (LOGIN_NOTICE_CODES as readonly string[]).includes(notice)) {
    return LOGIN_NOTICE_BANNERS[notice as LoginNoticeCode];
  }
  return null;
}

/* ==========================================================================
   2. `?next=` — đường quay lại sau khi đăng nhập
   ========================================================================== */

/**
 * Giữ lại `next` **chỉ khi** nó là một đường dẫn nội bộ. Trả `null` cho mọi
 * thứ khác, kể cả những dạng trông giống đường dẫn nội bộ:
 *
 * | Đầu vào | Vì sao chặn |
 * |---|---|
 * | `https://evil.example` | URL tuyệt đối |
 * | `//evil.example` | URL tuyệt đối theo giao thức của trang hiện tại |
 * | `/\evil.example` | Trình duyệt coi `\` như `/` ⇒ hoá ra `//evil.example` |
 * | `javascript:…` | Không bắt đầu bằng `/` nên đã rơi ở luật đầu |
 * | có `\n`/`\r` | Chèn header vào `Location` |
 *
 * Đây là hàng rào chống **open redirect**: link "đăng nhập rồi tự khắc vào hệ
 * thống" gửi qua Zalo là đúng thứ người ta hay bấm mà không đọc địa chỉ.
 */
export function sanitizeNextPath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const candidate = value.trim();
  if (candidate.length === 0) return null;
  if (!candidate.startsWith("/")) return null;
  if (candidate.startsWith("//")) return null;
  if (candidate.includes("\\")) return null;
  // Ký tự điều khiển chèn được header vào Location. Đếm mã ký tự thay vì viết
  // regex: một regex chứa ký tự điều khiển thật là thứ không đọc nổi khi review.
  for (let index = 0; index < candidate.length; index += 1) {
    const code = candidate.charCodeAt(index);
    if (code < 0x20 || code === 0x7f) return null;
  }
  return candidate;
}

/** Bỏ phần query và neo để so với `ROUTE_RULES` (`/reports?type=weekly` → `/reports`). */
export function pathnameOfNext(candidate: string): string {
  return candidate.split(/[?#]/, 1)[0] ?? candidate;
}

type RouteAccessSubject = Pick<AuthContext, "accountStatus" | "role"> | null;

/**
 * Đích cuối cùng sau khi đăng nhập: `next` phải vừa là đường dẫn nội bộ hợp lệ,
 * vừa nằm trong quyền của chính người vừa đăng nhập.
 *
 * Kiểm quyền ở đây **không thay** guard của trang đích — nó chỉ tránh việc đưa
 * người dùng tới một trang mà việc đầu tiên xảy ra là bị đá sang
 * `/access-denied`. Trang đích vẫn tự authorize (docs/04 §3).
 */
export function resolveNextPath(subject: RouteAccessSubject, value: unknown): string {
  const candidate = sanitizeNextPath(value);
  if (!candidate) return DEFAULT_AFTER_LOGIN_PATH;
  if (!canAccessRoute(subject, pathnameOfNext(candidate))) return DEFAULT_AFTER_LOGIN_PATH;
  return candidate;
}

/* ==========================================================================
   3. Dựng URL — guard không bao giờ tự gõ chuỗi query
   ========================================================================== */

export function buildLoginUrl(
  params: { next?: string; error?: LoginErrorCode; notice?: LoginNoticeCode } = {},
): string {
  const query = new URLSearchParams();
  if (params.next) query.set("next", params.next);
  if (params.error) query.set("error", params.error);
  if (params.notice) query.set("notice", params.notice);
  const suffix = query.toString();
  return suffix ? `/login?${suffix}` : "/login";
}

export const CHANGE_PASSWORD_PATH = "/change-password";

/**
 * Đổi mật khẩu bắt buộc là một trạm dừng, không phải điểm đến: `next` phải đi
 * xuyên qua nó, nếu không người dùng gõ deep-link ở lần đăng nhập đầu tiên sẽ
 * mất đích đến ngay tại đây (F01 TO-BE §4).
 */
export function buildChangePasswordUrl(next?: string): string {
  const candidate = sanitizeNextPath(next);
  if (!candidate || pathnameOfNext(candidate) === CHANGE_PASSWORD_PATH) {
    return CHANGE_PASSWORD_PATH;
  }
  return `${CHANGE_PASSWORD_PATH}?next=${encodeURIComponent(candidate)}`;
}
