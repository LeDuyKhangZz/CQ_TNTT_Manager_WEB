import { getNavigationBadgeCount } from "@/features/navigation/server/queries";
import type { NavigationBadgeKind } from "@/features/navigation/types";

const labels: Record<NavigationBadgeKind, string> = {
  attendance: "đơn xin nghỉ chờ ghi nhận trong tuần, năm hiện hành",
  promotions: "đề xuất chờ duyệt, năm hiện hành",
  notifications: "thông báo chưa đọc",
};

export async function NavigationBadge({ kind }: { kind: NavigationBadgeKind }) {
  const count = await getNavigationBadgeCount(kind).catch(() => null);
  if (!count || count < 0) return null;
  return <span data-navigation-badge={kind} className="inline-flex min-w-5 shrink-0 items-center justify-center rounded bg-surface-muted px-1 text-2xs font-semibold leading-5 text-ink">
    <span aria-hidden="true">{count > 99 ? "99+" : count}</span>
    <span className="sr-only">{count} {labels[kind]}</span>
  </span>;
}
