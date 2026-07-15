import { requireRouteAccess } from "@/lib/auth/guards";
import { ModulePlaceholder } from "./module-placeholder";

export async function ProtectedModulePlaceholder({
  route,
  title,
  description,
  phase,
}: {
  route: string;
  title: string;
  description: string;
  phase: string;
}) {
  await requireRouteAccess(route);
  return <ModulePlaceholder title={title} description={description} phase={phase} />;
}
