import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { AbsenceRequestPanel } from "@/features/absence-requests/components/absence-request-panel";
import { getAbsenceRequestsPageData } from "@/features/portal/server/queries";

export default async function AbsenceRequestsPage() {
  const { children, requests } = await getAbsenceRequestsPageData();

  return (
    <PageContainer>
      <PageHeader
        title="Đơn xin nghỉ"
        description="Báo trước cho giáo lý viên khi con không đến được. Đơn là lời báo, giáo lý viên vẫn là người điểm danh."
      />
      <AbsenceRequestPanel students={children} requests={requests} />
    </PageContainer>
  );
}
