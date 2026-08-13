import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { AttendanceHistory } from "@/features/portal/components/attendance-history";
import { PortalEmptyState } from "@/features/portal/components/portal-empty-state";
import { getStudentSelfAttendancePageData } from "@/features/portal/server/queries";

export default async function StudentAttendancePage() {
  const { context, student, status, yearCode, summary, rows } = await getStudentSelfAttendancePageData();

  return (
    <PageContainer>
      <PageHeader
        title="Điểm danh của em"
        description="Chỉ hiện những buổi giáo lý viên đã chốt."
      />
      {student === null ? (
        <PortalEmptyState reason="not_linked" audience="student" />
      ) : (
        <AttendanceHistory
          summary={summary}
          rows={rows}
          status={status}
          audience={context.audience}
          yearCode={yearCode}
        />
      )}
    </PageContainer>
  );
}
