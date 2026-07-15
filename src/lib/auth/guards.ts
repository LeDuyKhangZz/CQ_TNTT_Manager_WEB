import "server-only";

import { redirect } from "next/navigation";
import { canAccessRoute } from "@/lib/permissions/route-map";
import { getAuthContext } from "./session";

export async function requireAuthContext(nextPath = "/dashboard") {
  const context = await getAuthContext();
  if (!context) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  if (context.accountStatus !== "active") redirect("/login?error=account_unavailable");
  if (context.mustChangePassword && nextPath !== "/change-password") {
    redirect("/change-password");
  }
  return context;
}

export async function requireRouteAccess(pathname: string) {
  const context = await requireAuthContext(pathname);
  if (!canAccessRoute(context, pathname)) redirect("/access-denied");
  return context;
}
