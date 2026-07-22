import { Card, CardContent } from "@/components/ui/card";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { AttendanceHistory } from "@/features/portal/components/attendance-history";
import { getStudentSelfAttendancePageData } from "@/features/portal/server/queries";

export default async function StudentAttendancePage() {
  const { student, summary, rows } = await getStudentSelfAttendancePageData();

  return (
    <PageContainer>
      <PageHeader
        title="Điểm danh của em"
        description="Chỉ hiện những buổi giáo lý viên đã chốt."
      />
      {student === null ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Tài khoản của em chưa gắn với hồ sơ thiếu nhi. Nhờ giáo lý viên kiểm tra giúp.
            </p>
          </CardContent>
        </Card>
      ) : (
        <AttendanceHistory summary={summary} rows={rows} />
      )}
    </PageContainer>
  );
}
