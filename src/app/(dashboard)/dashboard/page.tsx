import { AllFeaturesGrid } from "@/components/layout/all-features-grid";
import { requireAuthContext } from "@/lib/auth/guards";
import { toShellViewer } from "@/lib/auth/types";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { DashboardOverview } from "@/features/dashboard/components/dashboard-overview";
import { getDashboardData } from "@/features/dashboard/server/queries";
import { ChildrenLinks } from "@/features/portal/components/children-links";
import { getGuardianChildLinks } from "@/features/portal/server/queries";

export default async function DashboardPage() {
  const [data, context] = await Promise.all([getDashboardData(), requireAuthContext("/dashboard")]);
  // M14 A-07: trang chủ của phụ huynh là đường vào tự nhiên nhất cho hồ sơ từng
  // con. Vai trò khác nhận mảng rỗng và không thấy khối này.
  const childDirectory = await getGuardianChildLinks();

  return (
    <PageContainer
      data-density={data.audience === "guardian" || data.audience === "student" ? "comfortable" : undefined}
    >
      <PageHeader
        title="Tổng quan"
        description={data.kpis?.academicYearCode ? `Năm học ${data.kpis.academicYearCode} · Trong phạm vi của bạn` : "Trong phạm vi của bạn"}
      />
      {data.audience === "guardian" ? (
        <div>
          <ChildrenLinks students={childDirectory.children} status={childDirectory.status} />
        </div>
      ) : null}
      <DashboardOverview data={data} />
      <AllFeaturesGrid viewer={toShellViewer(context)} />
    </PageContainer>
  );
}
