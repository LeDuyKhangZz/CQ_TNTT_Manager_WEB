import Link from "next/link";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { AttendanceHistory } from "@/features/portal/components/attendance-history";
import { getChildAttendancePageData } from "@/features/portal/server/queries";

export default async function ParentChildPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const { student, summary, rows } = await getChildAttendancePageData(studentId);
  // RLS đã lọc; không đọc được nghĩa là không phải con mình — trả 404 chứ không
  // báo "không có quyền", để không lộ sự tồn tại của hồ sơ (AGENTS §5).
  if (!student) notFound();

  return (
    <PageContainer>
      <PageHeader
        title={student.label}
        description="Điểm danh Thánh lễ và Giáo lý của con."
        action={
          <Link href="/parent/absence-requests" className="text-sm text-muted-foreground hover:text-foreground">
            Đơn xin nghỉ →
          </Link>
        }
      />
      <AttendanceHistory summary={summary} rows={rows} />
    </PageContainer>
  );
}
