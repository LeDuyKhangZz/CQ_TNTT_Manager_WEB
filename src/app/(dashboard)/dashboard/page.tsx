import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { DashboardOverview } from "@/features/dashboard/components/dashboard-overview";
import { getDashboardData } from "@/features/dashboard/server/queries";
import { ChildrenLinks } from "@/features/portal/components/children-links";
import { getGuardianChildLinks } from "@/features/portal/server/queries";

export default async function DashboardPage() {
  const data = await getDashboardData();
  // M14 A-07: trang chủ của phụ huynh là đường vào tự nhiên nhất cho hồ sơ từng
  // con. Vai trò khác nhận mảng rỗng và không thấy khối này.
  const childDirectory = await getGuardianChildLinks();

  return (
    <PageContainer
      data-density={data.audience === "guardian" || data.audience === "student" ? "comfortable" : undefined}
    >
      <PageHeader
        title="Tổng quan"
        description="Số liệu hiển thị đúng phạm vi bạn được phép xem."
      />
      {data.audience === "guardian" ? (
        <div className="mb-6">
          <ChildrenLinks students={childDirectory.children} status={childDirectory.status} />
        </div>
      ) : null}
      <DashboardOverview data={data} />
    </PageContainer>
  );
}
