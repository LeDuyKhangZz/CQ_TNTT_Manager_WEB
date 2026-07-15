import { PageContainer } from "@/components/layout/page-container";
import { PermissionDenied } from "@/components/shared/permission-denied";

export default function AccessDeniedPage() {
  return <PageContainer><PermissionDenied /></PageContainer>;
}
