import { AppShell } from "@/components/layout/app-shell";
import { getUnreadNotificationCount } from "@/features/notifications/server/queries";
import { requireAuthContext } from "@/lib/auth/guards";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const authContext = await requireAuthContext();
  const unreadCount = await getUnreadNotificationCount();
  return (
    <AppShell authContext={authContext} unreadCount={unreadCount}>
      {children}
    </AppShell>
  );
}
