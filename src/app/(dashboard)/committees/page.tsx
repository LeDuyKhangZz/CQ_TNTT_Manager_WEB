import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { CommitteeList } from "@/features/committees/components/committee-list";
import { getCommitteesPageData } from "@/features/committees/server/queries";

export default async function CommitteesPage() {
  const data = await getCommitteesPageData();
  return (
    <PageContainer>
      <PageHeader
        title="Ban"
        description="Thành viên chỉ thấy Ban của mình; Trưởng ban và Phó ban đăng thông báo, lịch họp và công việc tuần."
      />
      <CommitteeList committees={data.committees} canManage={data.canManageCommittees} />
    </PageContainer>
  );
}
