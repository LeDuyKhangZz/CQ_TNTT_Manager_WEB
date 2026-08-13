"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Thông báo nổi — 05 §3.3 #15, D-61. Dùng cho **biểu mẫu dài**: hồ sơ, điểm cả
 * lớp, thông báo, nhập Excel — nơi không được chuyển hướng mất dữ liệu đang gõ.
 * Biểu mẫu ngắn (1–3 ô) thì chuyển hướng + `Alert` đầu trang, không dùng Toast.
 *
 * Hai vùng phát riêng, cố ý:
 *   • `role="status"` + `aria-live="polite"` cho thành công/thông tin — chờ
 *     người dùng ngừng gõ rồi mới đọc
 *   • `role="alert"` + `aria-live="assertive"` cho lỗi — cắt ngang ngay
 * Một vùng duy nhất thì không đổi được `aria-live` giữa chừng: nhiều trình đọc
 * màn hình chỉ đọc thuộc tính lúc vùng được tạo, đổi sau không có tác dụng.
 *
 * Cả hai vùng **luôn nằm trong DOM kể cả khi rỗng**. Vùng aria-live tạo ra
 * cùng lúc với nội dung thì phần lớn trình đọc màn hình bỏ qua lần đầu.
 *
 * 🔴 Mỗi tone có icon riêng (09 §3) và tự tắt sau 6 giây. `duration: 0` để
 * thông báo ở lại — dùng khi câu chữ dài hơn mức đọc kịp 6 giây.
 */

export type ToastTone = "success" | "info" | "warning" | "danger";

export type ToastInput = {
  title: string;
  description?: string;
  tone?: ToastTone;
  /** Mili giây. `0` = không tự tắt. */
  duration?: number;
};

type ToastRecord = ToastInput & { id: number; tone: ToastTone };

const TONE_META = {
  success: { Icon: CheckCircle2, className: "text-success", srLabel: "Thành công" },
  info: { Icon: Info, className: "text-info", srLabel: "Thông tin" },
  warning: { Icon: AlertTriangle, className: "text-warning", srLabel: "Cảnh báo" },
  danger: { Icon: XCircle, className: "text-danger", srLabel: "Lỗi" },
} as const;

const DEFAULT_DURATION = 6000;

type ToastApi = {
  showToast: (toast: ToastInput) => void;
  dismissToast: (id: number) => void;
};

const ToastContext = React.createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const api = React.useContext(ToastContext);
  if (!api) {
    throw new Error("useToast phải nằm trong <ToastProvider>.");
  }
  return api;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastRecord[]>([]);
  const nextId = React.useRef(0);
  const timers = React.useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismissToast = React.useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = React.useCallback(
    ({ tone = "info", duration = DEFAULT_DURATION, ...rest }: ToastInput) => {
      const id = nextId.current++;
      setToasts((current) => [...current, { ...rest, tone, duration, id }]);

      if (duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismissToast(id), duration),
        );
      }
    },
    [dismissToast],
  );

  // Rời trang giữa chừng mà còn hẹn giờ là rò bộ đếm. Phải chụp `timers.current`
  // vào biến cục bộ: đọc `ref.current` trong hàm dọn dẹp là đọc giá trị ở thời
  // điểm gỡ, không phải giá trị lúc đăng ký.
  React.useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, []);

  const api = React.useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: readonly ToastRecord[];
  onDismiss: (id: number) => void;
}) {
  const urgent = toasts.filter((toast) => toast.tone === "danger");
  const polite = toasts.filter((toast) => toast.tone !== "danger");

  // Không dùng `display: contents` cho hai vùng phát: nhiều trình đọc màn hình
  // từng bỏ hẳn phần tử `display:contents` khỏi cây a11y, mà mất phần tử là mất
  // luôn `aria-live`. Hai vùng là hai hộp flex thật.
  const stack = "flex w-full flex-col items-center gap-2 sm:items-end";

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-toast flex flex-col gap-2 p-4 sm:inset-x-auto sm:right-4 sm:w-auto">
      <div role="alert" aria-live="assertive" className={stack}>
        {urgent.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </div>
      <div role="status" aria-live="polite" className={stack}>
        {polite.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </div>
    </div>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastRecord;
  onDismiss: (id: number) => void;
}) {
  const meta = TONE_META[toast.tone];

  return (
    <div
      data-tone={toast.tone}
      className={cn(
        "pointer-events-auto flex w-full max-w-sm gap-3 rounded-lg border border-line bg-surface p-4 shadow-md",
      )}
    >
      <meta.Icon
        className={cn("mt-0.5 h-5 w-5 shrink-0", meta.className)}
        strokeWidth={1.75}
        aria-hidden="true"
      />
      <span className="sr-only">{meta.srLabel}:</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{toast.title}</p>
        {toast.description ? (
          <p className="mt-0.5 text-sm text-ink-muted">{toast.description}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label={`Đóng thông báo: ${toast.title}`}
        className="-mr-2 -mt-2 inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md text-ink-muted hover:bg-surface-muted"
      >
        <X className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
      </button>
    </div>
  );
}
