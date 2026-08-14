"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  FAILSAFE_HIDE_MS,
  MIN_VISIBLE_MS,
  SHOW_AFTER_MS,
} from "@/lib/loading/constants";
import { pickNextIndex } from "@/lib/loading/pick";
import type { LoiChuaVerse } from "@/lib/loading/verses";
import { LoadingOverlay } from "./loading-overlay";

/**
 * Hệ thống chờ toàn cục — `17_UI_POLISH_PLAN.md` §3, `09` §12 A3/A4.
 *
 * Chẩn đoán gốc (kế hoạch 17 §1): `router.refresh()` ở **45 chỗ** dựng lại server
 * component **tại chỗ**, nên `loading.tsx` của App Router không bao giờ chạy. Phản
 * hồi duy nhất người dùng nhận được là một cái nút bị mờ đi — nhiều nút thậm chí
 * không đổi cả nhãn. Đây là câu trả lời cho *"load lâu mà không có phản hồi"*.
 *
 * Ba nguồn "đang bận" chảy vào **một** bộ đếm:
 *   1. `useGlobalPending(isPending)` — ~20 client component đã có `useTransition`.
 *   2. `<FormPendingBridge />` — form không cần JS, qua `useFormStatus()`.
 *   3. Bắt click điều hướng ngay trên `document` — **không phải sửa từng `<Link>`**.
 */

type LoadingApi = {
  /** Báo có một việc chậm bắt đầu. Phải có đúng một `end()` đi kèm. */
  begin: () => void;
  end: () => void;
  /**
   * Cho `router.push`/`router.replace` gọi tay. KHÔNG cần `end()`: lần đổi route
   * kế tiếp tự tắt. Đây là điểm khác biệt với `begin()` — điều hướng do mã lệnh
   * gây ra không đi qua bộ bắt click, mà đếm nó bằng `begin()` thì phải tìm cho
   * ra chỗ gọi `end()` sau khi trang mới đã dựng, tức là không có chỗ nào.
   */
  beginNavigation: () => void;
};

const LoadingContext = React.createContext<LoadingApi | null>(null);

/**
 * 🔴 KHÔNG ném lỗi khi thiếu provider — khác hẳn `useToast`.
 *
 * Hook này sẽ nằm trong ~20 component nghiệp vụ đang có bộ kiểm đơn vị render
 * chúng **trần**, không bọc provider. Nếu thiếu provider là ném lỗi thì một thứ
 * thuần trang trí sẽ đánh sập vài chục bài kiểm đang xanh, và tệ hơn: nó biến
 * một component nghiệp vụ thành thứ chỉ dùng được bên trong màn hình chờ. Thiếu
 * provider ⇒ không có gì xảy ra, đúng nghĩa "tăng tiến".
 */
const NOOP_API: LoadingApi = { begin: () => {}, end: () => {}, beginNavigation: () => {} };

export function useGlobalLoading(): LoadingApi {
  return React.useContext(LoadingContext) ?? NOOP_API;
}

/**
 * Một dòng duy nhất để nối một `useTransition` sẵn có vào màn hình chờ:
 *
 * ```tsx
 * const [isPending, startTransition] = useTransition();
 * useGlobalPending(isPending);
 * ```
 */
export function useGlobalPending(isPending: boolean): void {
  const api = React.useContext(LoadingContext);

  React.useEffect(() => {
    if (!api || !isPending) return;
    api.begin();
    return api.end;
  }, [api, isPending]);
}

type Frame = {
  image: string | null;
  verse: LoiChuaVerse | null;
};

export function LoadingProvider({
  images,
  verses,
  children,
}: {
  /** Đường dẫn công khai, do máy chủ liệt kê — `src/lib/loading/assets.ts`. */
  images: readonly string[];
  verses: readonly LoiChuaVerse[];
  children: React.ReactNode;
}) {
  // Bộ đếm việc lồng nhau: hai thao tác chậm chồng lên nhau chỉ hiện MỘT overlay,
  // và overlay chỉ tắt khi việc **cuối cùng** xong.
  const [taskCount, setTaskCount] = React.useState(0);
  // Điều hướng tách khỏi bộ đếm, cố ý: một cú bấm có thể không dẫn tới lần đổi
  // route nào (link tự huỷ, route trùng lọt lưới). Là cờ thì lần đổi route kế
  // tiếp xoá sạch; là bộ đếm thì nó rò một đơn vị vĩnh viễn.
  const [navigating, setNavigating] = React.useState(false);
  // `frame !== null` CHÍNH LÀ "đang hiện" — một trạng thái, không phải hai.
  const [frame, setFrame] = React.useState<Frame | null>(null);

  const lastImageRef = React.useRef(-1);
  const lastVerseRef = React.useRef(-1);
  const queuedImageRef = React.useRef(-1);
  const shownAtRef = React.useRef(0);
  const showTimerRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hideTimerRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const active = taskCount > 0 || navigating;

  const begin = React.useCallback(() => setTaskCount((count) => count + 1), []);
  const end = React.useCallback(() => setTaskCount((count) => Math.max(0, count - 1)), []);
  const beginNavigation = React.useCallback(() => setNavigating(true), []);
  const api = React.useMemo<LoadingApi>(
    () => ({ begin, end, beginNavigation }),
    [begin, end, beginNavigation],
  );

  /** Chọn sẵn ảnh cho LẦN SAU và nạp trước, để lúc hiện không có ô trống. */
  const queueNextImage = React.useCallback(() => {
    const next = pickNextIndex(images.length, lastImageRef.current);
    queuedImageRef.current = next;

    if (next >= 0 && typeof window !== "undefined") {
      const preloader = new window.Image();
      preloader.src = images[next];
    }
  }, [images]);

  React.useEffect(() => {
    queueNextImage();
  }, [queueNextImage]);

  const show = React.useCallback(() => {
    const imageIndex = queuedImageRef.current;
    const verseIndex = pickNextIndex(verses.length, lastVerseRef.current);

    lastImageRef.current = imageIndex;
    lastVerseRef.current = verseIndex;
    shownAtRef.current = Date.now();

    setFrame({
      image: imageIndex >= 0 ? images[imageIndex] : null,
      verse: verseIndex >= 0 ? verses[verseIndex] : null,
    });

    queueNextImage();
  }, [images, verses, queueNextImage]);

  // Luật thời gian. Cố ý KHÔNG dọn dẹp trong hàm cleanup của effect này: effect
  // chạy lại mỗi lần `active`/`frame` đổi, mà dọn ở đó thì cái hẹn giờ "chờ đủ
  // 1 giây rồi hiện" sẽ bị chính lần chạy kế tiếp huỷ và overlay không bao giờ
  // hiện. Hẹn giờ được quản bằng ref, và chỉ dọn sạch lúc gỡ component.
  React.useEffect(() => {
    if (active) {
      if (hideTimerRef.current !== undefined) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = undefined;
      }
      if (frame === null && showTimerRef.current === undefined) {
        showTimerRef.current = setTimeout(() => {
          showTimerRef.current = undefined;
          show();
        }, SHOW_AFTER_MS);
      }
      return;
    }

    if (showTimerRef.current !== undefined) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = undefined;
    }
    if (frame === null || hideTimerRef.current !== undefined) return;

    // Đã hiện thì giữ đủ `MIN_VISIBLE_MS`, không nháy tắt.
    const remaining = Math.max(0, MIN_VISIBLE_MS - (Date.now() - shownAtRef.current));
    hideTimerRef.current = setTimeout(() => {
      hideTimerRef.current = undefined;
      setFrame(null);
    }, remaining);
  }, [active, frame, show]);

  React.useEffect(
    () => () => {
      clearTimeout(showTimerRef.current);
      clearTimeout(hideTimerRef.current);
      showTimerRef.current = undefined;
      hideTimerRef.current = undefined;
    },
    [],
  );

  // Lưới an toàn. Một `end()` bị nuốt không được phép khoá màn hình vĩnh viễn.
  React.useEffect(() => {
    if (frame === null) return;

    const timer = setTimeout(() => {
      setTaskCount(0);
      setNavigating(false);
      setFrame(null);
    }, FAILSAFE_HIDE_MS);

    return () => clearTimeout(timer);
  }, [frame]);

  const settleNavigation = React.useCallback(() => setNavigating(false), []);

  // Bắt điều hướng ở tầng `document`, giai đoạn capture: một chỗ duy nhất phủ
  // hết mọi `<Link>` và mọi `<a>` của toàn ứng dụng. Sửa từng chỗ gọi là 100+
  // file và chắc chắn sót.
  React.useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      // Ctrl/Cmd/Shift/Alt = mở tab mới hoặc tải về; trang hiện tại không đi đâu.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.hasAttribute("download")) return;
      if (anchor.target && anchor.target !== "_self") return;

      const href = anchor.getAttribute("href") ?? "";
      if (href.startsWith("#")) return;

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) return;
      // Bấm vào chính trang đang đứng thì không có lần đổi route nào để chờ.
      if (url.pathname === window.location.pathname && url.search === window.location.search) {
        return;
      }

      setNavigating(true);
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  // Nút Lùi/Tiến của trình duyệt: địa chỉ đổi trước khi React kịp biết, nên
  // `popstate` chỉ dùng làm tín hiệu KẾT THÚC, không phải tín hiệu bắt đầu.
  React.useEffect(() => {
    window.addEventListener("popstate", settleNavigation);
    return () => window.removeEventListener("popstate", settleNavigation);
  }, [settleNavigation]);

  return (
    <LoadingContext.Provider value={api}>
      <React.Suspense fallback={null}>
        <NavigationSettleWatcher onSettled={settleNavigation} />
      </React.Suspense>
      {children}
      {frame ? <LoadingOverlay image={frame.image} verse={frame.verse} /> : null}
    </LoadingContext.Provider>
  );
}

/**
 * Route mới đã dựng xong ⇒ hết chờ.
 *
 * 🔴 Phải bọc `Suspense`: `useSearchParams()` không có ranh giới Suspense sẽ đẩy
 * **cả cây** sang render phía client lúc `next build`, và với trang tĩnh thì đó
 * là một lỗi build chứ không phải cảnh báo. Đặt riêng thành component con để
 * ranh giới ấy chỉ bao đúng một node rỗng, không bao nội dung trang.
 */
function NavigationSettleWatcher({ onSettled }: { onSettled: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const previousKeyRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (previousKeyRef.current === null) {
      previousKeyRef.current = routeKey;
      return;
    }
    if (previousKeyRef.current === routeKey) return;

    previousKeyRef.current = routeKey;
    onSettled();
  }, [routeKey, onSettled]);

  return null;
}
