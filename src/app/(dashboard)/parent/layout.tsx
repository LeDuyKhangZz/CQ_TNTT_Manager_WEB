import type { ReactNode } from "react";

/** M13-B: cổng phụ huynh dùng mật độ chữ và điều khiển dễ đọc đã duyệt ở 09 §2. */
export default function ParentPortalLayout({ children }: { children: ReactNode }) {
  return <div data-density="comfortable">{children}</div>;
}
