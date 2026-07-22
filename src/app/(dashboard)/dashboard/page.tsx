import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { DashboardOverview } from "@/features/dashboard/components/dashboard-overview";
import { getDashboardData } from "@/features/dashboard/server/queries";

export default async function DashboardPage() {
  const data = await getDashboardData();
  return (
    <PageContainer>
      <PageHeader
        title="Tổng quan"
        description="Số liệu hiển thị đúng phạm vi bạn được phép xem."
      />
      <DashboardOverview data={data} />
    </PageContainer>
  );
}
