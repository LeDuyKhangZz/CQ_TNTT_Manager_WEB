"use client";

import { useFormStatus } from "react-dom";
import { useGlobalPending } from "./loading-provider";

/**
 * Cầu nối 0 giao diện giữa `<form action={serverAction}>` và màn hình chờ —
 * `17_UI_POLISH_PLAN.md` §3.2.
 *
 * Thả vào **bên trong** thẻ `<form>` chậm:
 *
 * ```tsx
 * <form action={commitImport}>
 *   <FormPendingBridge />
 *   …
 * </form>
 * ```
 *
 * `useFormStatus()` chỉ đọc được form cha, nên component phải nằm trong form —
 * đặt ngoài thì nó im lặng trả `pending: false` mãi mãi, không lỗi, không cảnh
 * báo. Đây là cái bẫy duy nhất của tệp này.
 *
 * Không có JS thì component không chạy và form vẫn gửi được như cũ — đúng tinh
 * thần tăng tiến của `09` §11 và §12 A1.
 */
export function FormPendingBridge() {
  const { pending } = useFormStatus();
  useGlobalPending(pending);
  return null;
}
