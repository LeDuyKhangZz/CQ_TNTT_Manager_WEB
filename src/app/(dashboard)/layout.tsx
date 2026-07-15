import { AppShell } from "@/components/layout/app-shell";
import { requireAuthContext } from "@/lib/auth/guards";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const authContext = await requireAuthContext();
  return <AppShell authContext={authContext}>{children}</AppShell>;
}
